/* Page wiring for the fee calculator. All maths lives in fee-calc.js; this file only reads the form,
 * calls AXFee.calculate, and draws the result. */
(function () {
	"use strict";
	const { SERVICES, COA, MARKET, calculate } = window.AXFee;
	const $ = (id) => document.getElementById(id);
	const form = $("form");
	const STORE = "ax.feeCalculator.v2";

	const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
	const short = (n) => {
		const v = Number(n) || 0;
		if (v >= 1e7) return "₹" + (v / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " Cr";
		if (v >= 1e5) return "₹" + (v / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " L";
		return inr(v);
	};
	const pct = (n) => Number(n).toFixed(2) + "%";
	const pctShort = (n) => (Math.round(n * 10) / 10).toLocaleString("en-IN") + "%";
	const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
	const radio = (name) => (form.querySelector('input[name="' + name + '"]:checked') || {}).value;
	const option = (name, value, checked, title, body, tag) =>
		'<label class="opt"><input type="radio" name="' + name + '" value="' + value + '"' + (checked ? " checked" : "") + ">" +
		'<span><b>' + esc(title) + (tag ? '<i class="tag">' + esc(tag) + "</i>" : "") + "</b>" + (body ? "<small>" + esc(body) + "</small>" : "") + "</span></label>";

	/* ---------- Build the form from the data ---------- */
	$("services").innerHTML = SERVICES.map((s) => option("service", s.id, s.id === "archInt", s.name, s.hint)).join("");
	$("category").innerHTML = COA.categories.map((c) => '<option value="' + c.id + '"' + (c.id === "1b" ? " selected" : "") + ">" + esc(c.name) + "</option>").join("");
	$("discipline").innerHTML = COA.disciplines.filter((d) => d.id !== "interior").map((d) => '<option value="' + d.id + '">' + esc(d.name) + "</option>").join("");
	$("experience").innerHTML = MARKET.experience.map((e) =>
		option("experience", e.id, e.id === "mid", e.name, e.years + " · " + e.who, "+" + e.premium[0] + "–" + e.premium[1] + "%")).join("") +
		option("experience", "custom", false, "Set my own", "Your own premium above COA", "custom");
	$("cities").innerHTML = MARKET.cities.map((c) =>
		option("city", c.id, c.id === "metro", c.name, c.eg, c.premium ? "+" + c.premium + "%" : "at COA")).join("");
	$("def-simple").textContent = COA.complexity.simple;
	$("def-complex").textContent = COA.complexity.complex;
	$("excludes").innerHTML = COA.costExcludes.map((x) => "<li>" + esc(x) + "</li>").join("");
	$("notes").innerHTML = COA.notes.map((x) => "<li>" + esc(x) + "</li>").join("");

	/* ---------- Remember the inputs on this device ---------- */
	const RADIOS = ["service", "complexity", "method", "experience", "city", "cur"];
	const FIELDS = ["category", "discipline", "area", "buildRate", "buildTotal", "interiorRate", "interiorTotal", "premium", "repeats", "current"];
	function save() {
		try {
			const s = { gst: $("gst").checked };
			RADIOS.forEach((n) => { s[n] = radio(n); });
			FIELDS.forEach((f) => { s[f] = $(f).value; });
			localStorage.setItem(STORE, JSON.stringify(s));
		} catch (_e) { /* storage unavailable */ }
	}
	function restore() {
		let s = null;
		try { s = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (_e) { /* storage unavailable */ }
		if (!s) s = { area: "3000", buildRate: "3500", interiorRate: "1500" }; // a 3,000 sq.ft villa to start
		RADIOS.forEach((n) => {
			const el = form.querySelector('input[name="' + n + '"][value="' + s[n] + '"]');
			if (el) el.checked = true;
		});
		FIELDS.forEach((f) => { if (s[f] != null) $(f).value = s[f]; });
		if (typeof s.gst === "boolean") $("gst").checked = s.gst;
	}

	/* ---------- Read the form ---------- */
	function read() {
		const method = radio("method");
		const area = Number($("area").value) || 0;
		const cost = (rateId, totalId) => method === "area" ? area * (Number($(rateId).value) || 0) : Number($(totalId).value) || 0;
		const x = {
			service: radio("service"), method: method,
			category: $("category").value, discipline: $("discipline").value, complexity: radio("complexity"),
			area: area, buildCost: cost("buildRate", "buildTotal"), interiorCost: cost("interiorRate", "interiorTotal"),
			experience: radio("experience"), city: radio("city"), premiumPct: Number($("premium").value) || 0,
			repeats: Number($("repeats").value) || 0, gstRate: $("gst").checked ? 0.18 : 0,
		};
		// What you charge today, turned into ₹ for this project.
		const cur = Number($("current").value) || 0;
		const mode = radio("cur");
		const svc = SERVICES.find((s) => s.id === x.service);
		const projectCost = (svc.parts.indexOf("build") > -1 || svc.parts.indexOf("discipline") > -1 || svc.parts.indexOf("master") > -1 ? x.buildCost : 0) +
			(svc.parts.indexOf("interior") > -1 ? x.interiorCost : 0);
		x.currentTotal = !cur ? 0 : mode === "sqft" ? cur * area : mode === "pct" ? projectCost * cur / 100 : cur;
		x.curMode = mode;
		return x;
	}

	/* ---------- Show only what this service needs ---------- */
	function layout(x) {
		const svc = SERVICES.find((s) => s.id === x.service);
		const needs = (p) => svc.parts.indexOf(p) > -1;
		$("q-category").hidden = !needs("build");
		$("q-discipline").hidden = !needs("discipline");
		$("f-build").hidden = !(needs("build") || needs("discipline") || needs("master"));
		$("f-interior").hidden = !needs("interior");
		$("f-custom").hidden = x.experience !== "custom";
		const d = COA.disciplines.find((q) => q.id === x.discipline);
		$("build-label").textContent = needs("master") ? "Gross execution cost of the master plan works"
			: needs("discipline") ? "Cost of the " + (d ? d.name.split(" /")[0].toLowerCase() : "") + " work" : "Construction cost";
		form.querySelectorAll("[data-method]").forEach((el) => { el.hidden = el.dataset.method !== x.method; });
		$("area-label").textContent = x.method === "area" ? "Built-up area, all floors" : "Built-up area, all floors (optional, for ₹ per sq.ft)";
		$("build-echo").textContent = x.buildCost > 0 ? "= " + short(x.buildCost) : "";
		$("interior-echo").textContent = x.interiorCost > 0 ? "= " + short(x.interiorCost) : "";
		const m = x.curMode;
		$("cur-pre").textContent = m === "pct" ? "" : "₹";
		$("cur-post").textContent = m === "sqft" ? "/sq.ft" : m === "pct" ? "% of cost" : "for this project";
		$("cur-pre").hidden = m === "pct";
		$("current").placeholder = m === "sqft" ? "200" : m === "pct" ? "5" : "600000";
		$("cur-echo").textContent = x.currentTotal > 0 ? "= " + inr(x.currentTotal) + " for this project" : (m === "sqft" && !x.area && $("current").value ? "Enter the built-up area above to compare." : "");
	}

	/* ---------- Draw the result ---------- */
	function slabTable(l) {
		return '<table class="slab"><tr>' + l.slabs.map((s, i) =>
			'<td class="' + (i === l.slabIndex ? "on" : "") + '"><span>' + esc(s.replace(" and above", "+")) + "</span><b>" +
			(l.rowRates[i] == null ? "–" : l.rowRates[i].toFixed(2)) + "</b></td>").join("") + "</tr></table>";
	}
	function who(r) {
		const lvl = r.experience ? r.experience.name.toLowerCase() + " architects" : "architects charging your premium";
		return lvl + (r.cityPct || r.city.id !== "tier3" ? " in a " + r.city.name.toLowerCase() : " in tier 3 cities and towns");
	}
	function compareBox(r) {
		const c = r.compare;
		if (!c) return "";
		const peers = inr(r.peer.low) + "–" + inr(r.peer.high);
		const you = inr(c.current) + (c.perSqft ? " (" + inr(c.perSqft) + "/sq.ft)" : "");
		const T = {
			belowCoa: ["bad", "Below COA", "You're charging below the COA minimum",
				"At " + you + " you are " + inr(c.shortOfCoa) + " under the COA fee for this project, which is " + pctShort(c.pctOfCoa) + " of COA. " +
				capital(who(r)) + " charge " + peers + ". Quote at least " + inr(r.coaFee) + "."],
			belowPeers: ["warn", "Undercharging", "Above COA, but below your peers",
				capital(who(r)) + " charge " + peers + " for this project. At " + you + " you're leaving " + inr(c.shortOfPeers) + " on the table."],
			inLine: ["ok", "In line", "You're in line with your peers",
				capital(who(r)) + " charge " + peers + ". You're at " + you + "."],
			above: ["ok", "Above peers", "You charge more than most of your peers",
				capital(who(r)) + " charge " + peers + ". At " + you + " you're above that: fine when your work and service justify it."],
		}[c.status];
		const lo = Math.min(c.current, r.coaFee) * 0.9, hi = Math.max(c.current, r.peer.high) * 1.08;
		const at = (v) => Math.max(0, Math.min(100, 100 * (v - lo) / (hi - lo))).toFixed(1) + "%";
		return '<div class="verdict ' + T[0] + '"><span class="badge">' + T[1] + "</span><b>" + T[2] + "</b></div>" +
			"<p>" + esc(T[3]) + "</p>" +
			'<div class="meter" aria-hidden="true">' +
			'<span class="band" style="left:' + at(r.peer.low) + ";width:calc(" + at(r.peer.high) + " - " + at(r.peer.low) + ')"></span>' +
			'<span class="mark coa" style="left:' + at(r.coaFee) + '"><i>COA</i></span>' +
			'<span class="mark you ' + T[0] + '" style="left:' + at(c.current) + '"><i>You</i></span>' +
			"</div>" +
			'<div class="meter-key"><span><i class="kc"></i>COA ' + inr(r.coaFee) + '</span><span><i class="kp"></i>Peers ' + peers + "</span></div>";
	}
	const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

	function render() {
		const x = read();
		layout(x);
		const r = calculate(x);
		const ok = r.errors && !r.errors.length;
		const hasCost = x.buildCost > 0 || x.interiorCost > 0;
		$("empty").hidden = ok || hasCost;
		$("out").hidden = !ok;
		$("errors").hidden = ok || !hasCost;
		$("errors").innerHTML = ok ? "" : (r.errors || []).map((e) => "<p>" + esc(e) + "</p>").join("");
		$("stages-sec").hidden = !ok;
		$("dock").hidden = !ok;
		save();
		render.last = ok ? r : null;
		if (ok) $("send-hint").hidden = true;
		if (!ok) return;

		$("fee").textContent = inr(r.fee);
		$("fee-sub").innerHTML = "COA + " + pctShort(r.premiumPct) + (r.area ? " · <b>" + inr(r.perSqft) + "</b> per sq.ft" : "") + " · " + pct(r.feePctOfCost) + " of cost";
		$("peers").innerHTML = '<span class="k">' + esc(capital(who(r))) + ' charge</span><b class="num">' + inr(r.peer.low) + " – " + inr(r.peer.high) + "</b>" +
			(r.area ? '<small class="num">' + inr(r.peer.low / r.area) + " – " + inr(r.peer.high / r.area) + " per sq.ft</small>" : "");
		$("compare").hidden = !r.compare;
		$("compare").innerHTML = compareBox(r);

		$("coaFee").textContent = inr(r.coaFee);
		$("lines").innerHTML = r.lines.map((l) =>
			'<div class="line">' +
			'<p class="line-head"><b>' + esc(l.part) + "</b> · " + esc(l.table.split(" (")[0]) + "</p>" +
			'<p class="line-meta">' + esc(l.row) + " · " + (l.complexity === "simple" ? "Simple" : "Complex") + " · " + esc(l.slab) + " slab</p>" +
			slabTable(l) +
			'<p class="calc num">' + pct(l.pct) + " × " + inr(l.cost) + " = <b>" + inr(l.coaFee) + "</b></p>" +
			(l.repetitionFactor !== 1 ? '<p class="calc num">× ' + l.repetitionFactor.toFixed(4) + " for " + r.repeats + " repeated block" + (r.repeats === 1 ? "" : "s") + " = <b>" + inr(l.feeAfterRepetition) + "</b></p>" : "") +
			"</div>").join("");

		const rows = [["COA minimum fee", inr(r.coaFee)]];
		rows.push(["Experience and city <small>+" + pctShort(r.premiumPct) + " on COA</small>", "+ " + inr(r.premium)]);
		rows.push(["Your fee", inr(r.fee), "fee"]);
		if (r.gstRate) rows.push(["GST, 18%", inr(r.gst)]);
		rows.push(["Client pays", inr(r.total), "total"]);
		$("rows").innerHTML = rows.map((row) => '<div class="row ' + (row[2] || "") + '"><span>' + row[0] + '</span><span class="num">' + row[1] + "</span></div>").join("");

		$("stages").innerHTML = r.stages.map((s) =>
			"<tr><td>" + esc(s.name) + '</td><td class="r num">' + s.pct + '%</td><td class="r num hide-sm">' + s.cumulative + '%</td><td class="r num">' + inr(s.amount) + "</td></tr>").join("");
		$("stages-total").textContent = inr(r.fee);
		$("dock-fee").textContent = inr(r.fee);
		const tag = r.compare ? { belowCoa: "You: below COA", belowPeers: "You: undercharging", inLine: "You: in line", above: "You: above peers" }[r.compare.status] : "";
		$("dock-tag").textContent = tag;
		$("dock-tag").className = "dock-tag " + (r.compare ? r.compare.status : "");
	}

	/* ---------- Send to your client: names, message, PDF ---------- */
	const BRANDING = true; // "Powered by ArchXchange" on the message and the PDF. Set false for the paid plan.
	const SEND_STORE = "ax.feeCalculator.send.v1";
	const SEND = ["fromName", "fromPhone", "toName", "project", "note"];
	const val = (id) => $(id).value.trim();
	try {
		const s = JSON.parse(localStorage.getItem(SEND_STORE) || "null");
		if (s) SEND.forEach((f) => { if (s[f]) $(f).value = s[f]; });
		if (s && s.note) $("note-wrap").open = true;
	} catch (_e) { /* storage unavailable */ }
	$("send").addEventListener("input", () => {
		try { const s = {}; SEND.forEach((f) => { s[f] = $(f).value; }); localStorage.setItem(SEND_STORE, JSON.stringify(s)); } catch (_e) { /* storage unavailable */ }
	});

	function scopeLine(r) {
		const l0 = r.lines[0];
		const bits = [r.service.name];
		if (l0 && (l0.tableId === "T1" || l0.tableId === "T2")) bits.push(l0.row.replace(/^Category \w+ – /, ""));
		if (r.area) bits.push(r.area.toLocaleString("en-IN") + " sq.ft");
		return bits.join(" · ");
	}

	/** The client-facing message for WhatsApp and Copy. */
	function message() {
		const r = render.last;
		if (!r) return "";
		const to = val("toName"), from = val("fromName"), phone = val("fromPhone"), project = val("project"), note = val("note");
		const m = [to ? "Dear " + to + "," : "Hello,", "",
			"Please find our professional fee" + (project ? " for *" + project + "*" : "") + ".",
			"Scope: " + scopeLine(r), "",
			"Professional fee: " + inr(r.fee)];
		if (r.gstRate) m.push("GST 18%: " + inr(r.gst));
		m.push("*Total: " + inr(r.total) + "*", "",
			"Payable in COA stages: 10% on signing the agreement, then through concept, schematic design, approvals, design development, construction documents, tender, construction and close-out.",
			"The fee follows the Council of Architecture scale of fees.");
		if (note) m.push("", note);
		if (from || phone) m.push("", "Regards,", from, phone);
		if (BRANDING) m.push("", "_Prepared with ArchXchange_");
		return m.filter((x, i, a) => !(x === "" && a[i - 1] === "")).filter((x) => x != null).join("\n").replace(/\n+$/, "");
	}

	/** One A4 page: the proposal the client receives. */
	function proposal() {
		const r = render.last;
		const from = val("fromName") || "Architect", phone = val("fromPhone"), to = val("toName"), project = val("project"), note = val("note");
		const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
		const basis = r.lines.map((l) => esc(l.part) + ": COA " + esc(l.table.split(" –")[0]) + ", " + esc(l.row) + ", " + (l.complexity === "simple" ? "simple" : "complex") +
			", " + esc(l.slab) + " slab, " + pct(l.pct) + " of " + inr(l.cost)).join("<br>");
		const costs = r.lines.map((l) => (l.part === "Interiors" ? "Interior fit-out" : l.tableId === "T4" ? "Master plan works" : l.tableId === "T3" ? esc(l.part) + " works" : "Construction") + " " + short(l.cost)).join(" · ");
		const half = Math.ceil(r.stages.length / 2);
		const stageRows = (list) => list.map((s) => "<tr><td>" + esc(s.name.replace(" (in instalments with progress)", "")) + '</td><td class="r">' + s.pct + '%</td><td class="r">' + inr(s.amount) + "</td></tr>").join("");
		return '<div class="sh-top"><div><div class="sh-firm">' + esc(from) + "</div>" + (phone ? '<div class="sh-muted">' + esc(phone) + "</div>" : "") + "</div>" +
			'<div class="sh-doc"><div class="sh-title">Fee proposal</div><div class="sh-muted">' + date + "</div></div></div>" +
			'<table class="sh-info"><tr><th>To</th><td>' + esc(to || "—") + "</td></tr><tr><th>Project</th><td>" + esc(project || "—") + "</td></tr>" +
			"<tr><th>Scope</th><td>" + esc(scopeLine(r)) + "</td></tr><tr><th>Project cost</th><td>" + costs + "</td></tr></table>" +
			'<h3>Professional fee</h3><table class="sh-fee"><tr><td>Professional fee</td><td class="r">' + inr(r.fee) + "</td></tr>" +
			(r.gstRate ? '<tr><td>GST at 18%</td><td class="r">' + inr(r.gst) + "</td></tr>" : "") +
			'<tr class="tot"><td>Total payable</td><td class="r">' + inr(r.total) + "</td></tr></table>" +
			'<p class="sh-basis">Basis: Council of Architecture scale of fees, <i>Manual of Architectural Practice</i>, Vol. 4.<br>' + basis +
			(r.repeats ? "<br>Adjusted for " + r.repeats + " repeated block" + (r.repeats === 1 ? "" : "s") + " as per COA." : "") +
			"<br>This fee is not below the COA minimum fee of " + inr(r.coaFee) + " for this project.</p>" +
			'<h3>Schedule of payments</h3><div class="sh-stages"><table>' + stageRows(r.stages.slice(0, half)) + "</table><table>" + stageRows(r.stages.slice(half)) + "</table></div>" +
			(note ? '<h3>Notes</h3><p class="sh-note">' + esc(note) + "</p>" : "") +
			'<p class="sh-terms">Fees are exclusive of GST unless shown. The construction cost excludes land, statutory and approval fees, and other consultants\' fees unless stated. Construction-stage fees are payable in instalments with progress. This proposal is valid for 30 days.</p>' +
			'<div class="sh-sign"><div>Accepted by client</div><div>For ' + esc(from) + "</div></div>" +
			(BRANDING ? '<div class="sh-brand"><img src="ax-mark.png" alt="" width="18" height="18"><span>Powered by <b>ArchXchange</b> · archxchange.in</span></div>' : "");
	}

	function fileName() {
		const who = val("toName") || val("project") || "client";
		return ("Fee proposal - " + who).replace(/[\\/:*?"<>|]+/g, "").slice(0, 80) + ".pdf";
	}
	let pdfLib = null;
	function loadPdfLib() {
		pdfLib = pdfLib || new Promise((resolve, reject) => {
			const s = document.createElement("script");
			s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
			s.onload = () => (window.html2pdf ? resolve(window.html2pdf) : reject(new Error("PDF library missing")));
			s.onerror = () => { pdfLib = null; reject(new Error("PDF library failed to load")); };
			document.head.appendChild(s);
		});
		return pdfLib;
	}
	function downloadPdf() {
		if (!render.last) { $("send-hint").hidden = false; return; }
		$("sheet").innerHTML = proposal();
		const b = $("pdf"), label = b.querySelector("span");
		label.textContent = "Preparing PDF…";
		b.disabled = true;
		const done = () => { label.textContent = "Download PDF proposal"; b.disabled = false; };
		loadPdfLib().then((html2pdf) => html2pdf().set({
			margin: 0, filename: fileName(), image: { type: "jpeg", quality: 0.96 },
			// scrollX/Y 0: without them a scrolled page renders a blank PDF.
			html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true, scrollX: 0, scrollY: 0 },
			jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
		}).from($("sheet")).save()).then(done, () => { done(); window.print(); }); // offline: fall back to Print → Save as PDF
	}
	$("pdf").addEventListener("click", downloadPdf);
	window.addEventListener("beforeprint", () => { if (render.last) $("sheet").innerHTML = proposal(); });
	$("share").addEventListener("click", () => {
		if (!render.last) { $("send-hint").hidden = false; return; }
		window.open("https://wa.me/?text=" + encodeURIComponent(message()), "_blank", "noopener");
	});
	$("copy").addEventListener("click", (e) => {
		const b = e.currentTarget;
		if (!render.last || !navigator.clipboard) return;
		navigator.clipboard.writeText(message()).then(() => { b.textContent = "Copied"; setTimeout(() => { b.textContent = "Copy text"; }, 2000); }, () => {});
	});
	const go = (id) => $(id).scrollIntoView({ behavior: "smooth", block: "start" });
	$("dock-go").addEventListener("click", () => go("result"));
	$("dock-send").addEventListener("click", () => go("send"));

	/* ---------- Section menu: highlight where you are ---------- */
	if ("IntersectionObserver" in window) {
		const links = document.querySelectorAll(".stepnav a");
		const seen = {};
		const io = new IntersectionObserver((es) => {
			es.forEach((e) => { seen[e.target.id] = e.isIntersecting; });
			const cur = ["send", "rate", "calc"].find((id) => seen[id]) || "calc";
			links.forEach((a) => a.classList.toggle("on", a.dataset.sec === cur));
		}, { rootMargin: "-130px 0px -45% 0px" });
		["calc", "rate", "send"].forEach((id) => io.observe($(id)));
	}

	form.addEventListener("input", render);
	form.addEventListener("change", render);
	if ("IntersectionObserver" in window) {
		new IntersectionObserver((es) => { document.body.classList.toggle("panel-visible", es[0].isIntersecting); }, { threshold: 0.12 }).observe($("card"));
	}
	restore();
	render();
})();
