/* ArchXchange market guidance: what architects add ON TOP of the COA minimum fee.
 * This is ArchXchange's reading of the market, not a COA rule. Edit freely; COA is never reduced:
 * every premium here is 0 or more, so no fee can go below the COA minimum.
 *
 *   Recommended fee = COA fee × (1 + experience premium + city premium)
 *   Peer range      = COA fee × (1 + experience low/high + city premium)
 */
(function (root) {
	"use strict";
	const MARKET = {
		experience: [
			{ id: "starting", name: "Starting out", years: "0–3 years", who: "Your own first homes and interiors", premium: [0, 5] },
			{ id: "mid", name: "Mid-level", years: "3–6 years", who: "Full houses and small commercial, with a small team", premium: [5, 10] },
			{ id: "established", name: "Established", years: "6–10 years", who: "A body of built work, approvals and site experience", premium: [10, 20] },
			{ id: "senior", name: "Senior", years: "10+ years", who: "Known portfolio; luxury, specialist or complex work", premium: [20, 30] },
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
