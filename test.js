// Checks the fee maths and the COA data. Run: node test.js   (Node 18+, no installs)
// Expected figures are worked by hand from the COA tables, not from fee-calc.js.
"use strict";
const assert = require("assert");
const { calculate, slabIndex, repetitionFactor, COA } = require("./fee-calc.js");

let passed = 0;
function test(name, fn) {
	try { fn(); passed += 1; console.log("  ok   " + name); }
	catch (e) { console.log("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; }
}
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.005, (msg || "") + " expected " + b + ", got " + a);

console.log("COA data");
test("Tables 1 and 2 have 11 categories × 7 slabs, Tables 3 and 4 have 6 slabs", () => {
	["T1", "T2"].forEach((t) => {
		assert.strictEqual(Object.keys(COA.rates[t]).length, 11);
		Object.values(COA.rates[t]).forEach((r) => { assert.strictEqual(r.simple.length, 7); assert.strictEqual(r.complex.length, 7); });
	});
	Object.values(COA.rates.T3).concat([COA.rates.T4.masterPlanning]).forEach((r) => { assert.strictEqual(r.simple.length, 6); assert.strictEqual(r.complex.length, 6); });
});
test("Spot values as printed by COA", () => {
	assert.strictEqual(COA.rates.T1["1a"].simple[0], 5.56);
	assert.strictEqual(COA.rates.T1["1b"].complex[0], 8.55);
	assert.strictEqual(COA.rates.T1["3"].complex[2], 6.53);
	assert.strictEqual(COA.rates.T2["1b"].simple[0], 3.86);
	assert.strictEqual(COA.rates.T2["8"].simple[6], 2.02);
	assert.strictEqual(COA.rates.T2["1b"].simple[4], null);
	assert.strictEqual(COA.rates.T3.interior.complex[3], 6.0);
	assert.strictEqual(COA.rates.T3.lighting.simple[3], null);
	assert.strictEqual(COA.rates.T4.masterPlanning.complex[5], 0.75);
});
test("Payment stages total 100%", () => assert.strictEqual(COA.stages.reduce((a, s) => a + s.pct, 0), 100));

console.log("Slabs");
test("₹4.99 Cr is the first building slab, ₹5 Cr the second", () => {
	assert.strictEqual(slabIndex(4.99e7, COA.slabs.building), 0);
	assert.strictEqual(slabIndex(5e7, COA.slabs.building), 1);
	assert.strictEqual(slabIndex(1000e7, COA.slabs.building), 6);
});
test("Tables 3 and 4: ₹9.99 Cr is the first slab, ₹10 Cr the second", () => {
	assert.strictEqual(slabIndex(9.99e7, COA.slabs.discipline), 0);
	assert.strictEqual(slabIndex(10e7, COA.slabs.discipline), 1);
});

console.log("Fees");
test("Workbook sample: Comprehensive, 1a, Simple, ₹3.5 Cr → 5.56% = ₹19,46,000", () => {
	const r = calculate({ service: "comp", category: "1a", complexity: "simple", buildCost: 35000000 });
	assert.strictEqual(r.lines[0].pct, 5.56);
	near(r.coaFee, 1946000);
});
test("Villa, Architecture only, 1b, Simple, 3,000 sq.ft × ₹3,500 → 3.86% = ₹4,05,300", () => {
	const r = calculate({ service: "arch", category: "1b", complexity: "simple", buildCost: 3000 * 3500, area: 3000 });
	near(r.coaFee, 405300);
	near(r.fee, 405300);
	near(r.perSqft, 135.1);
});
test("Villa, Architecture + Interiors, Simple, +5%: ₹4,05,300 + ₹4,05,000 = ₹8,10,300 → ₹8,50,815 + GST", () => {
	const r = calculate({ service: "archInt", category: "1b", complexity: "simple", buildCost: 10500000, interiorCost: 4500000, premiumPct: 5 });
	near(r.lines[0].coaFee, 405300);
	near(r.lines[1].coaFee, 405000);
	near(r.coaFee, 810300);
	near(r.fee, 850815);
	near(r.gst, 153146.7);
	near(r.total, 1003961.7);
});
test("Villa, Comprehensive, 1b, Simple, +20%: 6.65% = ₹6,98,250 → ₹8,37,900", () => {
	const r = calculate({ service: "comp", category: "1b", complexity: "simple", buildCost: 10500000, premiumPct: 20 });
	near(r.coaFee, 698250);
	near(r.fee, 837900);
});
test("Slab edge, Architecture only, 1b, Simple: ₹4.99 Cr → 3.86%, ₹5 Cr → 3.58%", () => {
	near(calculate({ service: "arch", category: "1b", complexity: "simple", buildCost: 49900000 }).coaFee, 1926140);
	near(calculate({ service: "arch", category: "1b", complexity: "simple", buildCost: 50000000 }).coaFee, 1790000);
});
test("Interiors: ₹9.99 Cr → 9%, ₹10 Cr → 8%", () => {
	near(calculate({ service: "interior", complexity: "simple", interiorCost: 99900000 }).coaFee, 8991000);
	near(calculate({ service: "interior", complexity: "simple", interiorCost: 100000000 }).coaFee, 8000000);
});
test("Office, Architecture only, Category 2, Complex, ₹16 Cr → 3.51% = ₹56,16,000", () => {
	near(calculate({ service: "arch", category: "2", complexity: "complex", buildCost: 160000000 }).coaFee, 5616000);
});
test("Master planning, Simple, ₹200 Cr → 0.75% = ₹1,50,00,000", () => {
	near(calculate({ service: "master", complexity: "simple", buildCost: 2000000000 }).coaFee, 15000000);
});
test("Lighting, Complex, ₹60 Cr → 1.00% = ₹60,00,000", () => {
	near(calculate({ service: "discipline", discipline: "lighting", complexity: "complex", buildCost: 600000000 }).coaFee, 6000000);
});
test("No COA % (house above ₹99.9 Cr, lighting above ₹99.9 Cr) gives an error, not a fee", () => {
	const a = calculate({ service: "arch", category: "1b", complexity: "simple", buildCost: 1200000000 });
	assert.ok(a.errors.length && a.fee === undefined);
	const b = calculate({ service: "discipline", discipline: "lighting", complexity: "simple", buildCost: 1500000000 });
	assert.ok(b.errors.length);
});
test("Repetition: 3 repeats → (1 + 3 × 0.5) ÷ 4 = 0.625; 0 repeats → 1; 7 repeats → (1 + 1.5 + 0.9 + 0.2) ÷ 8", () => {
	near(repetitionFactor(3), 0.625);
	near(repetitionFactor(0), 1);
	near(repetitionFactor(7), 3.6 / 8);
});
test("4 identical blocks, ₹20 Cr total, Comprehensive 1a Simple: 4.70% = ₹94,00,000 × 0.625 = ₹58,75,000", () => {
	near(calculate({ service: "comp", category: "1a", complexity: "simple", buildCost: 200000000, repeats: 3 }).coaFee, 5875000);
});
test("Never below COA: a negative premium counts as 0", () => {
	near(calculate({ service: "arch", category: "1b", complexity: "simple", buildCost: 10500000, premiumPct: -10 }).fee, 405300);
});
console.log("Experience, city and your current rate");
const villa = { service: "archInt", category: "1b", complexity: "simple", buildCost: 10500000, interiorCost: 4500000, area: 3000 };
test("Mid-level (5–10%) in a metro (+10%): peers ₹9,31,845–₹9,72,360, recommended ×1.175 = ₹9,52,102.50", () => {
	const r = calculate(Object.assign({ experience: "mid", city: "metro" }, villa));
	near(r.coaFee, 810300);
	near(r.peer.low, 931845);
	near(r.peer.high, 972360);
	near(r.fee, 952102.5);
});
test("Senior (20–30%) in a Tier 2 city (+5%), Comprehensive: ₹6,98,250 × 1.30 = ₹9,07,725", () => {
	const r = calculate({ service: "comp", category: "1b", complexity: "simple", buildCost: 10500000, experience: "senior", city: "tier2" });
	near(r.peer.low, 872812.5);
	near(r.peer.high, 942637.5);
	near(r.fee, 907725);
});
test("Starting out in a Tier 3 town: recommended is COA + 2.5%, the low end is exactly COA", () => {
	const r = calculate(Object.assign({ experience: "starting", city: "tier3" }, villa));
	near(r.peer.low, 810300);
	near(r.fee, 810300 * 1.025);
});
test("Your rate: ₹200/sq.ft (₹6,00,000) is below COA by ₹2,10,300", () => {
	const r = calculate(Object.assign({ experience: "mid", city: "metro", currentTotal: 600000 }, villa));
	assert.strictEqual(r.compare.status, "belowCoa");
	near(r.compare.shortOfCoa, 210300);
	near(r.compare.pctOfCoa, 100 * 600000 / 810300);
});
test("Your rate: ₹9,00,000 is above COA but ₹31,845 below peers; ₹9,50,000 is in line; ₹10,00,000 is above", () => {
	const base = Object.assign({ experience: "mid", city: "metro" }, villa);
	const a = calculate(Object.assign({ currentTotal: 900000 }, base));
	assert.strictEqual(a.compare.status, "belowPeers");
	near(a.compare.shortOfPeers, 31845);
	assert.strictEqual(calculate(Object.assign({ currentTotal: 950000 }, base)).compare.status, "inLine");
	assert.strictEqual(calculate(Object.assign({ currentTotal: 1000000 }, base)).compare.status, "above");
});

console.log("Custom payment stages");
test("Custom stages 20/30/30/20 on ₹9,52,102.50 split to the rupee and add up to ₹9,52,103", () => {
	const stages = [{ name: "Advance", pct: 20 }, { name: "Design", pct: 30 }, { name: "Drawings", pct: 30 }, { name: "Site", pct: 20 }];
	const r = calculate(Object.assign({ experience: "mid", city: "metro", stages: stages }, villa));
	assert.ok(r.customStages && r.stagesCheck.ok);
	assert.deepStrictEqual(r.stages.map((s) => s.amount), [190421, 285631, 285631, 190420]);
	assert.strictEqual(r.stages.reduce((a, s) => a + s.amount, 0), 952103);
	assert.strictEqual(r.stages[3].cumulative, 100);
});
test("Custom stages that total 95%, or have no name or 0%, are flagged; the fee itself is unchanged", () => {
	const r = calculate(Object.assign({ experience: "mid", city: "metro", stages: [{ name: "Advance", pct: 45 }, { name: "Rest", pct: 50 }] }, villa));
	assert.ok(!r.stagesCheck.ok);
	assert.ok(/95%/.test(r.stagesCheck.problems.join(" ")));
	near(r.fee, 952102.5);
	assert.ok(!calculate(Object.assign({ stages: [{ name: "", pct: 100 }] }, villa)).stagesCheck.ok);
	assert.ok(!calculate(Object.assign({ stages: [{ name: "A", pct: 100 }, { name: "B", pct: 0 }] }, villa)).stagesCheck.ok);
});
test("No custom stages means COA's 15 stages", () => {
	const r = calculate(villa);
	assert.ok(!r.customStages);
	assert.strictEqual(r.stages.length, 15);
});

test("Stage amounts add up exactly to the rounded fee", () => {
	const r = calculate({ service: "archInt", category: "1b", complexity: "complex", buildCost: 12345678, interiorCost: 3456789, premiumPct: 7 });
	assert.strictEqual(r.stages.reduce((a, s) => a + s.amount, 0), Math.round(r.fee));
	assert.strictEqual(r.stages[r.stages.length - 1].cumulative, 100);
});

console.log("\n" + passed + " passed" + (process.exitCode ? ", some FAILED" : ", all good"));
