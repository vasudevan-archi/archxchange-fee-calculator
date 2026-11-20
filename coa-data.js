/* COA professional fee tables — Council of Architecture, India, Manual of Architectural Practice
 * (2022), Volume 4, "Guidelines for Architectural Services & Fees", section 4.8.1, pages 51–54.
 * Generated from the text of COA's published PDF (coa.org.in, COA Vol_4_R13.pdf) and checked cell by
 * cell against ArchXchange_Architects_Fee_Calculator.xlsx on 21 Nov 2026: 368 cells, 0 mismatches.
 *
 * Values are % of the gross construction cost. null = COA prints "-" (no % for that slab).
 * Do not edit a percentage unless COA changes it; `node test.js` guards the known values.
 */
(function (root) {
	"use strict";
	const COA = {
		source: "COA Manual of Architectural Practice, Vol. 4, §4.8.1 (Tables 1–4)",
		// Slab lower bounds in ₹ crore. A project falls in the last slab whose floor it reaches.
		slabs: {
			building: [0, 5, 10, 50, 100, 500, 1000], // Tables 1 and 2
			discipline: [0, 10, 50, 100, 500, 1000], // Tables 3 and 4 (first slab is ₹0–9.9 Cr)
		},
		slabLabels: {
			building: ["₹0–4.9 Cr", "₹5–9.9 Cr", "₹10–49.9 Cr", "₹50–99.9 Cr", "₹100–499.9 Cr", "₹500–999.9 Cr", "₹1000 Cr and above"],
			discipline: ["₹0–9.9 Cr", "₹10–49.9 Cr", "₹50–99.9 Cr", "₹100–499.9 Cr", "₹500–999.9 Cr", "₹1000 Cr and above"],
		},
		tables: {
			T1: "Table 1 – Comprehensive Architectural Services (architectural, basic engineering: structural, MEPF and liaisoning only)",
			T2: "Table 2 – Architectural Services Only (excluding all other engineering and specialist services)",
			T3: "Table 3 – Architectural Consultancy: Interior Design, Lighting, Landscape and Conservation",
			T4: "Table 4 – Comprehensive Master Planning",
		},
		categories: [
			{ id: "1a", name: "Category 1a – Residential" },
			{ id: "1b", name: "Category 1b – Independent Single Dwelling" },
			{ id: "2", name: "Category 2 – Commercial" },
			{ id: "3", name: "Category 3 – Mercantile / Retail" },
			{ id: "4", name: "Category 4 – Hospitality" },
			{ id: "5", name: "Category 5 – Institutional" },
			{ id: "6", name: "Category 6 – Industrial" },
			{ id: "7", name: "Category 7 – Public and Semi-Public" },
			{ id: "8", name: "Category 8 – Mixed-Use" },
			{ id: "9", name: "Category 9 – Recreational" },
			{ id: "10", name: "Category 10 – Transportation" },
		],
		disciplines: [
			{ id: "interior", name: "Interior Design" },
			{ id: "lighting", name: "Lighting" },
			{ id: "landscape", name: "Landscape" },
			{ id: "conservation", name: "Architectural Conservation / Retrofitting / Additions & Alterations" },
		],
		rates: {
		T1: {
			"1a": { simple: [5.56, 5.13, 4.70, 4.28, 3.85, 3.42, 2.99], complex: [7.05, 6.41, 5.77, 5.13, 4.49, 3.85, 3.21] },
			"1b": { simple: [6.65, 6.18, 5.70, 5.23, null, null, null], complex: [8.55, 7.84, 7.13, 6.41, null, null, null] },
			"2": { simple: [5.84, 5.42, 4.99, 4.56, 4.13, 3.71, 3.28], complex: [7.34, 6.70, 6.06, 5.42, 4.77, 4.13, 3.49] },
			"3": { simple: [6.13, 5.70, 5.27, 4.85, 4.42, 3.99, 3.56], complex: [7.62, 6.98, 6.53, 5.70, 5.06, 4.42, 3.78] },
			"4": { simple: [5.99, 5.56, 5.13, 4.70, 4.28, 3.85, 3.42], complex: [7.48, 6.84, 6.20, 5.56, 4.92, 4.28, 3.63] },
			"5": { simple: [5.56, 5.13, 4.70, 4.28, 3.85, 3.42, 2.99], complex: [7.05, 6.41, 5.77, 5.13, 4.49, 3.85, 3.21] },
			"6": { simple: [5.27, 4.85, 4.42, 3.99, 3.56, 3.14, 2.71], complex: [6.77, 6.13, 5.49, 4.85, 4.20, 3.56, 2.92] },
			"7": { simple: [5.84, 5.42, 4.99, 4.56, 4.13, 3.71, 3.28], complex: [7.34, 6.70, 6.06, 5.42, 4.77, 4.13, 3.49] },
			"8": { simple: [6.41, 5.99, 5.56, 5.13, 4.70, 4.28, 3.49], complex: [7.91, 7.27, 6.82, 5.99, 5.34, 4.70, 4.06] },
			"9": { simple: [5.84, 5.42, 4.99, 4.56, 4.13, 3.71, 3.28], complex: [7.34, 6.70, 6.06, 5.42, 4.77, 4.13, 3.49] },
			"10": { simple: [5.70, 5.27, 4.85, 4.42, 3.99, 3.56, 3.14], complex: [7.20, 6.56, 5.91, 5.27, 4.63, 3.99, 3.35] },
		},
		T2: {
			"1a": { simple: [3.22, 2.98, 2.73, 2.48, 2.23, 1.98, 1.74], complex: [4.09, 3.72, 3.35, 2.98, 2.60, 2.23, 1.86] },
			"1b": { simple: [3.86, 3.58, 3.31, 3.03, null, null, null], complex: [4.96, 4.55, 4.13, 3.72, null, null, null] },
			"2": { simple: [3.39, 3.14, 2.89, 2.64, 2.40, 2.15, 1.90], complex: [4.26, 3.88, 3.51, 3.14, 2.77, 2.40, 2.02] },
			"3": { simple: [3.55, 3.31, 3.06, 2.81, 2.56, 2.31, 2.07], complex: [4.42, 4.05, 3.79, 3.31, 2.93, 2.56, 2.19] },
			"4": { simple: [3.47, 3.22, 2.98, 2.73, 2.48, 2.23, 1.98], complex: [4.34, 3.97, 3.60, 3.22, 2.85, 2.48, 2.11] },
			"5": { simple: [3.22, 2.98, 2.73, 2.48, 2.23, 1.98, 1.74], complex: [4.09, 3.72, 3.35, 2.98, 2.60, 2.23, 1.86] },
			"6": { simple: [3.06, 2.81, 2.56, 2.31, 2.07, 1.82, 1.57], complex: [3.93, 3.55, 3.18, 2.81, 2.44, 2.07, 1.69] },
			"7": { simple: [3.39, 3.14, 2.89, 2.64, 2.40, 2.15, 1.90], complex: [4.26, 3.88, 3.51, 3.14, 2.77, 2.40, 2.02] },
			"8": { simple: [3.72, 3.47, 3.22, 2.98, 2.73, 2.48, 2.02], complex: [4.59, 4.22, 3.95, 3.47, 3.10, 2.73, 2.36] },
			"9": { simple: [3.39, 3.14, 2.89, 2.64, 2.40, 2.15, 1.90], complex: [4.26, 3.88, 3.51, 3.14, 2.77, 2.40, 2.02] },
			"10": { simple: [3.31, 3.06, 2.81, 2.56, 2.31, 2.07, 1.82], complex: [4.17, 3.80, 3.43, 3.06, 2.69, 2.31, 1.94] },
		},
		T3: {
			interior: { simple: [9.00, 8.00, 7.00, 6.00, 5.00, 4.50], complex: [10.00, 9.00, 8.00, 6.00, 5.50, 5.00] },
			lighting: { simple: [2.00, 1.50, 0.75, null, null, null], complex: [2.50, 2.00, 1.00, null, null, null] },
			landscape: { simple: [6.50, 6.00, 5.50, null, null, null], complex: [7.00, 6.50, 6.00, null, null, null] },
			conservation: { simple: [7.50, 7.00, 6.50, 6.00, 5.50, 5.00], complex: [8.50, 8.00, 7.50, 7.00, 6.50, 6.00] },
		},
		T4: {
			masterPlanning: { simple: [1.50, 1.25, 1.00, 0.75, 0.50, 0.25], complex: [2.00, 1.75, 1.50, 1.25, 1.00, 0.75] },
		},
		},
		// §4.8.1 Note (2): fees for repeated building blocks, as a share of the original fee.
		repetition: { upTo3: 0.5, from4to6: 0.3, beyond6: 0.2 },
		// §4.3.2 C: indicative schedule of payments (share of the total fee).
		stages: [
			{ group: "a", name: "On execution of agreement", pct: 10 },
			{ group: "b", name: "Concept design", pct: 10 },
			{ group: "c", name: "Schematic design, part 1", pct: 5 },
			{ group: "c", name: "Schematic design, part 2", pct: 5 },
			{ group: "d", name: "Statutory approval", pct: 5 },
			{ group: "e", name: "Detail design development, part 1", pct: 4 },
			{ group: "e", name: "Detail design development, part 2", pct: 3 },
			{ group: "e", name: "Detail design development, part 3", pct: 3 },
			{ group: "g", name: "Construction documents, part 1", pct: 5 },
			{ group: "g", name: "Construction documents, part 2", pct: 5 },
			{ group: "g", name: "Construction documents, part 3", pct: 5 },
			{ group: "g", name: "Construction documents, part 4", pct: 5 },
			{ group: "h", name: "Tender", pct: 10 },
			{ group: "i", name: "Construction administration (in instalments with progress)", pct: 20 },
			{ group: "j", name: "Project close-out", pct: 5 },
		],
		complexity: {
			simple: "The site is uncomplicated and plain (minimal to no contours) and/or the brief is utilitarian: limited, plain finishes and basic structural, mechanical and electrical coordination; simple forms and clean lines.",
			complex: "Challenging site (steep contours, dense vegetation) and/or a brief that calls for remarkable character and complexity: advanced systems, complicated structural and MEPF coordination, and other disciplines such as ICT, security or energy systems.",
		},
		// §4.3.2.1: construction cost generally excludes these.
		costExcludes: [
			"Land cost and land development cost",
			"Client's administrative costs: finance, overheads, the architect's and sub-consultants' fees, insurance",
			"Other professional fees that are the client's responsibility",
			"Project management, quantity surveyor fees, and drawings not prepared by the appointed architect",
			"Site office, warehouses, batching plants, labour camps (unless the architect designed them)",
			"Licences, permits, statutory approval and NOC fees, and liaison costs",
		],
		notes: [
			"These are minimum fee percentages set by COA, on the gross construction cost.",
			"They are net fees; GST and other taxes are extra.",
			"Higher fees may be quoted where justified by the practice's exceptional expertise, stature, experience or standing, with the client's prior agreement.",
		],
	};
	if (typeof module !== "undefined" && module.exports) module.exports = COA;
	else root.COA = COA;
})(this);
