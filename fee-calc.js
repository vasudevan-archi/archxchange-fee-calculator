/* ArchXchange fee calculation. Pure functions, no page code, so `node test.js` can check them.
 *
 *   COA fee   = gross construction cost × COA % (table, category or discipline, complexity, cost slab)
 *   Your fee  = COA fee × (1 + experience premium + city premium), from market.js; every premium ≥ 0,
 *               so COA is the minimum and is never discounted
 *   Peers     = the same with the low and high end of the experience range
 *   Client pays = your fee + GST (18%)
 *
 * Services and the COA table that prices each part:
 *   arch       Architecture only               Table 2 on the construction cost
 *   comp       Comprehensive                   Table 1 on the construction cost
 *   archInt    Architecture + Interiors        Table 2 on the construction cost + Table 3 (Interior) on the fit-out cost
 *   interior   Interior design only            Table 3 (Interior) on the fit-out cost
 *   discipline Lighting / Landscape / Conservation  Table 3 on the cost of that discipline's work
 *   master     Master planning                 Table 4 on the gross execution cost of the master plan works
 */
(function (root) {
	"use strict";
	const NODE = typeof module !== "undefined" && module.exports;
	const COA = NODE ? require("./coa-data.js") : root.COA;
	const MARKET = NODE ? require("./market.js") : root.MARKET;

	const SERVICES = [
		{ id: "arch", name: "Architecture only", hint: "Design, drawings, approvals and site visits. Engineering consultants paid separately.", parts: ["build"] },
		{ id: "comp", name: "Comprehensive", hint: "Architecture with structural, MEPF and liaison under your fee.", parts: ["build"] },
		{ id: "archInt", name: "Architecture + Interiors", hint: "Architecture on the building cost, plus interior design on the fit-out cost.", parts: ["build", "interior"] },
		{ id: "interior", name: "Interior design only", hint: "Interior design on the fit-out cost.", parts: ["interior"] },
		{ id: "discipline", name: "Lighting, landscape or conservation", hint: "A specialist consultancy, on the cost of that work.", parts: ["discipline"] },
		{ id: "master", name: "Master planning", hint: "Layouts, levels, roads, drainage and infrastructure for a master plan.", parts: ["master"] },
	];

	/** Index of the slab the cost falls in: the last slab whose floor (₹ Cr) it reaches. */
	function slabIndex(cost, floorsCr) {
		const cr = cost / 1e7;
		let i = 0;
		for (let k = 0; k < floorsCr.length; k++) if (cr >= floorsCr[k]) i = k;
		return i;
	}

	/** COA's fee share for repeated identical blocks (§4.8.1 note 2), read as tiers, as in the workbook:
	 *  the original block at 100%, repeats 1–3 at 50% each, 4–6 at 30% each, 7 and beyond at 20% each.
	 *  Returned as a factor on the fee for all (1 + n) blocks. */
	function repetitionFactor(n) {
		const r = COA.repetition;
		const repeats = Math.max(0, Math.floor(Number(n) || 0));
		const shares = 1 + r.upTo3 * Math.min(repeats, 3) + r.from4to6 * Math.min(Math.max(repeats - 3, 0), 3) + r.beyond6 * Math.max(repeats - 6, 0);
		return shares / (1 + repeats);
	}

	function line(part, tableId, rowName, row, slabKind, cost, complexity) {
		const i = slabIndex(cost, COA.slabs[slabKind]);
		const pct = row[complexity][i];
		return {
			part: part, tableId: tableId, table: COA.tables[tableId], row: rowName, complexity: complexity,
			cost: cost, slabIndex: i, slab: COA.slabLabels[slabKind][i], slabs: COA.slabLabels[slabKind],
			rowRates: row[complexity], pct: pct, tabulated: pct != null,
			coaFee: pct != null ? cost * pct / 100 : null,
		};
	}

	/** Splits a rounded total over the stages (COA's by default); when they total 100%, the last stage
	 *  takes the rounding difference so the amounts add up exactly to the fee. */
	function stageAmounts(total, stages) {
		const list = stages || COA.stages;
		const sum = list.reduce(function (a, s) { return a + (Number(s.pct) || 0); }, 0);
		const exact = Math.abs(sum - 100) < 0.001;
		const rounded = Math.round(total);
		let cum = 0, paid = 0;
		return list.map(function (s, i, all) {
			const p = Number(s.pct) || 0;
			cum += p;
			const amount = exact && i === all.length - 1 ? rounded - paid : Math.round(total * p / 100);
			paid += amount;
			return { name: s.name, group: s.group, pct: p, cumulative: Math.round(cum * 100) / 100, amount: amount };
		});
	}

	/** Checks custom stages: each needs a name and a % above 0, and together they must make 100%. */
	function checkStages(stages) {
		const total = stages.reduce(function (a, s) { return a + (Number(s.pct) || 0); }, 0);
		const problems = [];
		if (!stages.length) problems.push("Add at least one stage.");
		if (stages.some(function (s) { return !String(s.name || "").trim(); })) problems.push("Give every stage a name.");
		if (stages.some(function (s) { return !(Number(s.pct) > 0); })) problems.push("Give every stage a % above 0.");
		if (Math.abs(total - 100) >= 0.001) problems.push("Your stages add up to " + (Math.round(total * 100) / 100) + "%. Make them 100%.");
		return { total: total, ok: !problems.length, problems: problems };
	}

	/**
	 * @param {object} x
	 *   service      one of SERVICES ids
	 *   category     "1a".."10" (Tables 1, 2)
	 *   discipline   "lighting" | "landscape" | "conservation" (service "discipline")
	 *   complexity   "simple" | "complex"
	 *   buildCost    ₹ gross construction cost (arch, comp, archInt); also the discipline / master-plan cost
	 *   interiorCost ₹ interior fit-out cost (archInt, interior)
	 *   repeats      repeated identical blocks (Tables 1, 2 only), default 0
	 *   stages       optional custom payment stages [{ name, pct }]; COA's 15 stages when left out
	 *   experience   MARKET.experience id, or "custom" to use premiumPct
	 *   city         MARKET.cities id
	 *   premiumPct   with experience "custom": your premium above COA, %, never below 0
	 *   currentTotal what you charge now for this project, ₹ before GST (optional)
	 *   gstRate      default 0.18; 0 to leave GST out
	 *   area         built-up sq.ft, optional, only for ₹ per sq.ft
	 */
	function calculate(x) {
		const errors = [];
		const svc = SERVICES.find(function (s) { return s.id === x.service; });
		if (!svc) return { errors: ["Choose a service."] };
		const cx = x.complexity === "complex" ? "complex" : "simple";
		const build = Number(x.buildCost) || 0;
		const interior = Number(x.interiorCost) || 0;
		const lines = [];

		if (svc.id === "arch" || svc.id === "comp" || svc.id === "archInt") {
			const tableId = svc.id === "comp" ? "T1" : "T2";
			const cat = COA.categories.find(function (c) { return c.id === x.category; });
			if (!cat) errors.push("Choose the building category.");
			else if (!(build > 0)) errors.push("Enter the construction cost.");
			else lines.push(line("Architecture", tableId, cat.name, COA.rates[tableId][cat.id], "building", build, cx));
		}
		if (svc.id === "archInt" || svc.id === "interior") {
			if (!(interior > 0)) errors.push("Enter the interior fit-out cost.");
			else lines.push(line("Interiors", "T3", "Interior Design", COA.rates.T3.interior, "discipline", interior, cx));
		}
		if (svc.id === "discipline") {
			const d = COA.disciplines.find(function (q) { return q.id === x.discipline && q.id !== "interior"; });
			if (!d) errors.push("Choose lighting, landscape or conservation.");
			else if (!(build > 0)) errors.push("Enter the cost of the work.");
			else lines.push(line(d.name, "T3", d.name, COA.rates.T3[d.id], "discipline", build, cx));
		}
		if (svc.id === "master") {
			if (!(build > 0)) errors.push("Enter the gross execution cost of the master plan works.");
			else lines.push(line("Master planning", "T4", "Master Planning", COA.rates.T4.masterPlanning, "discipline", build, cx));
		}
		lines.forEach(function (l) {
			if (!l.tabulated) errors.push("COA gives no " + l.part.toLowerCase() + " percentage for " + l.row + " in the " + l.slab + " slab.");
		});
		if (errors.length) return { errors: errors, lines: lines };

		const repFactor = repetitionFactor(x.repeats);
		lines.forEach(function (l) {
			l.repetitionFactor = l.tableId === "T1" || l.tableId === "T2" ? repFactor : 1;
			l.feeAfterRepetition = l.coaFee * l.repetitionFactor;
		});
		const cost = lines.reduce(function (a, l) { return a + l.cost; }, 0);
		const coaFee = lines.reduce(function (a, l) { return a + l.feeAfterRepetition; }, 0);

		// Premium on top of COA: experience (a range) plus city. Never negative, so never below COA.
		const exp = MARKET.experience.find(function (e) { return e.id === x.experience; });
		const city = MARKET.cities.find(function (c) { return c.id === x.city; }) || MARKET.cities[MARKET.cities.length - 1];
		const custom = Math.max(0, Number(x.premiumPct) || 0);
		const expRange = exp ? exp.premium : [custom, custom];
		const cityPct = Math.max(0, city.premium);
		const lowPct = Math.max(0, expRange[0]) + cityPct;
		const highPct = Math.max(0, expRange[1]) + cityPct;
		const premiumPct = (lowPct + highPct) / 2;
		const fee = coaFee * (1 + premiumPct / 100);
		const peerLow = coaFee * (1 + lowPct / 100);
		const peerHigh = coaFee * (1 + highPct / 100);

		const gstRate = x.gstRate == null ? 0.18 : Math.max(0, Number(x.gstRate) || 0);
		const gst = fee * gstRate;
		const area = Number(x.area) > 0 ? Number(x.area) : 0;
		const custom_stages = Array.isArray(x.stages) && x.stages.length > 0;
		const stagesCheck = custom_stages ? checkStages(x.stages) : { total: 100, ok: true, problems: [] };

		// What you charge now, against COA and your peers.
		const current = Number(x.currentTotal) > 0 ? Number(x.currentTotal) : 0;
		let compare = null;
		if (current) {
			const status = current < coaFee * 0.995 ? "belowCoa" : current < peerLow * 0.995 ? "belowPeers" : current <= peerHigh * 1.005 ? "inLine" : "above";
			compare = {
				status: status, current: current, pctOfCoa: 100 * current / coaFee,
				shortOfCoa: Math.max(0, coaFee - current), shortOfPeers: Math.max(0, peerLow - current), shortOfFee: Math.max(0, fee - current),
				perSqft: area ? current / area : 0,
			};
		}
		return {
			errors: [], service: svc, lines: lines, cost: cost,
			repeats: Math.max(0, Math.floor(Number(x.repeats) || 0)), repetitionFactor: repFactor,
			coaFee: coaFee, experience: exp || null, city: city, cityPct: cityPct,
			premiumPct: premiumPct, premium: fee - coaFee, fee: fee,
			peer: { lowPct: lowPct, highPct: highPct, low: peerLow, high: peerHigh },
			gstRate: gstRate, gst: gst, total: fee + gst,
			feePctOfCost: cost ? 100 * fee / cost : 0, coaPctOfCost: cost ? 100 * coaFee / cost : 0,
			area: area, perSqft: area ? fee / area : 0, coaPerSqft: area ? coaFee / area : 0,
			compare: compare,
			customStages: custom_stages,
			stagesCheck: stagesCheck,
			stages: stageAmounts(fee, custom_stages ? x.stages : null),
		};
	}

	const api = { SERVICES: SERVICES, COA: COA, MARKET: MARKET, calculate: calculate, slabIndex: slabIndex, repetitionFactor: repetitionFactor, stageAmounts: stageAmounts, checkStages: checkStages };
	if (typeof module !== "undefined" && module.exports) module.exports = api;
	else root.AXFee = api;
})(this);
