/* ArchXchange market guidance: where your fee sits against the COA minimum fee.
 * This is ArchXchange's reading of the market, not a COA rule. Edit freely.
 *
 *   Recommended fee = COA fee × (1 + experience premium + city premium)
 *   Peer range      = COA fee × (1 + experience low/high + city premium)
 *
 * Starting out is the only level that may sit below COA: up to 10% under it, and never above it,
 * so the city premium does not apply to it (cityPremium: false). Every other level is COA or more.
 */
(function (root) {
	"use strict";
	const MARKET = {
		experience: [
			{ id: "starting", name: "Starting out", years: "0–3 years", who: "First homes and interiors. Same range in every city", premium: [-10, 0], cityPremium: false },
			{ id: "mid", name: "Mid-level", years: "3–6 years", who: "Full houses and small commercial, with a small team", premium: [0, 0] },
			{ id: "established", name: "Established", years: "6–10 years", who: "A body of built work, approvals and site experience", premium: [5, 5] },
			{ id: "senior", name: "Senior", years: "10+ years", who: "Known portfolio; luxury, specialist or complex work", premium: [10, 10] },
		],
		cities: [
			{ id: "metro", name: "Metro", eg: "Mumbai, Delhi NCR, Bengaluru, Chennai, Hyderabad, Pune, Kolkata, Ahmedabad", premium: 10 },
			{ id: "tier2", name: "Tier 2 city", eg: "Coimbatore, Kochi, Jaipur, Indore, Lucknow, Nagpur, Vizag and similar", premium: 5 },
			{ id: "tier3", name: "Tier 3 and towns", eg: "District headquarters, smaller cities and towns", premium: 0 },
		],
	};
	if (typeof module !== "undefined" && module.exports) module.exports = MARKET;
	else root.MARKET = MARKET;
})(this);
