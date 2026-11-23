/* Which COA category a building falls in.
 * TYPES: COA's own lists, word for word, from the Manual of Architectural Practice, Vol. 4, §4.5.1
 *        (pages 33–35), "categories for types of projects".
 * ALIASES: ArchXchange's everyday Indian names for those same building types, so a search for
 *        "kalyana mandapam" finds COA's "Banquet Halls". Add to these freely; never edit TYPES.
 */
(function (root) {
	"use strict";
	const TYPES = {
		"1a": ["Row Housing", "Affordable Housing", "High Rise / High Density", "Housing Complex", "Service Apartments", "Hostels"],
		"1b": ["Independent Bungalows", "Palaces", "Villas"],
		"2": ["IT Parks", "Convention Centres", "Office Complexes", "Corporate Headquarters", "Data Centres", "General Business and Commercial District Centres"],
		"3": ["Malls", "Shopping Complexes", "Retail Shops", "Departmental Stores", "Supermarkets", "Warehousing / Wholesale, Godowns", "Regulated Markets"],
		"4": ["Spas and Salons", "Budget Hotels", "Luxury Hotels", "Boutique Hotels", "Cinema Halls", "Concert Halls and Theatres", "Restaurants", "Banquet Halls", "Bakeries", "Independent Food Courts"],
		"5": ["College Buildings", "Universities", "Kindergarten", "Libraries", "Research Buildings", "Veterinary Clinics", "Medical and Health Clinics", "Art Galleries", "Observatories", "Auditoriums", "Aquaria", "Exhibition / Exposition Buildings",
			"School Buildings (Government and Government-aided Primary & Secondary Schools where standard plans are used)", "School Buildings (other than Government and Government-aided Primary & Secondary Schools where standard plans are used)",
			"Hospitals (Service, Teaching, Central-support Units or Departments to Hospitals)"],
		"6": ["Farm Buildings", "Storage or Warehouse Buildings", "Telephone Exchange Buildings", "Power Stations", "Power Plants", "Industrial Buildings with Manufacturing and Packaging Facilities", "Audio-visual / Telecommunication Buildings", "Assembly Plants", "Laboratories", "Refineries", "Gas Plants", "Mills", "Dairies", "Factories"],
		"7": ["Govt. / Semi-govt. / Public Offices", "Police Headquarters / Stations, Police Line", "Places of Worship", "Legislative Buildings", "Mausoleums", "Memorials", "Monuments", "Museums", "Embassy Buildings", "Assembly Halls", "Banks", "Community Centres", "Courthouses", "Fire Stations", "Post Offices", "Prisons"],
		"8": ["A building or campus with two or more typologies housed in a composite manner, e.g. a building that has commercial, hotel and office together"],
		"9": ["Playgrounds", "Golf Courses", "Indoor and Outdoor Stadiums", "Sports Academies", "Gymnasium", "Bowling Centres", "Sports Buildings / Complexes", "Gymkhanas", "Stadiums", "Parks", "Clubhouses", "Gardens", "Zoos"],
		"10": ["Bus Terminal", "Railway Stations", "Airports", "Ferry Terminal Buildings", "Metro Stations"],
	};

	// Everyday name → [category, COA type it matches]. One name may point to more than one COA type.
	const ALIASES = [
		[["marriage hall", "kalyana mandapam", "kalyan mandapam", "mandapam", "mandap", "wedding hall", "wedding venue", "function hall", "party hall", "reception hall", "choultry", "banquet", "convention hall"], "4", "Banquet Halls"],
		[["marriage hall", "kalyana mandapam", "mandapam", "community hall", "social hall", "samaj bhavan", "samudaya bhavan", "town hall"], "7", "Community Centres"],
		[["independent house", "house", "individual house", "residence", "duplex", "farmhouse", "farm house", "weekend home", "bungalow", "home"], "1b", "Villas"],
		[["apartment", "apartments", "flats", "flat", "tower", "gated community", "condominium", "multi-storey residential"], "1a", "High Rise / High Density"],
		[["township", "residential layout", "villa community", "housing project"], "1a", "Housing Complex"],
		[["row house", "row houses", "terrace houses"], "1a", "Row Housing"],
		[["pg", "paying guest", "dormitory", "student housing", "working women hostel"], "1a", "Hostels"],
		[["serviced apartment", "co-living", "coliving"], "1a", "Service Apartments"],
		[["office", "office building", "coworking", "co-working", "commercial building", "business centre"], "2", "Office Complexes"],
		[["head office", "hq"], "2", "Corporate Headquarters"],
		[["shop", "showroom", "store", "outlet", "retail"], "3", "Retail Shops"],
		[["shopping centre", "commercial complex", "arcade"], "3", "Shopping Complexes"],
		[["hypermarket", "grocery", "mart"], "3", "Supermarkets"],
		[["godown", "wholesale", "cold storage"], "3", "Warehousing / Wholesale, Godowns"],
		[["market", "vegetable market", "fish market", "mandi"], "3", "Regulated Markets"],
		[["lodge", "guest house", "homestay", "motel", "hotel"], "4", "Budget Hotels"],
		[["resort", "5 star", "five star", "hotel"], "4", "Luxury Hotels"],
		[["cafe", "café", "bar", "pub", "eatery", "dhaba", "canteen", "cloud kitchen"], "4", "Restaurants"],
		[["multiplex", "cinema", "movie theatre"], "4", "Cinema Halls"],
		[["theatre", "performing arts", "concert hall", "amphitheatre"], "4", "Concert Halls and Theatres"],
		[["spa", "salon", "beauty parlour", "wellness centre"], "4", "Spas and Salons"],
		[["sweet shop", "patisserie"], "4", "Bakeries"],
		[["food court"], "4", "Independent Food Courts"],
		[["hospital", "nursing home", "multi-speciality hospital", "medical college hospital"], "5", "Hospitals (Service, Teaching, Central-support Units or Departments to Hospitals)"],
		[["clinic", "dental clinic", "diagnostic centre", "dispensary", "polyclinic", "health centre", "phc"], "5", "Medical and Health Clinics"],
		[["school", "private school", "cbse school", "international school", "matriculation school"], "5", "School Buildings (other than Government and Government-aided Primary & Secondary Schools where standard plans are used)"],
		[["government school", "corporation school", "panchayat school"], "5", "School Buildings (Government and Government-aided Primary & Secondary Schools where standard plans are used)"],
		[["college", "engineering college", "arts college", "institute", "polytechnic", "iti"], "5", "College Buildings"],
		[["university", "campus"], "5", "Universities"],
		[["playschool", "play school", "preschool", "nursery school", "creche", "daycare", "anganwadi"], "5", "Kindergarten"],
		[["library", "reading room"], "5", "Libraries"],
		[["research centre", "r&d centre", "innovation centre"], "5", "Research Buildings"],
		[["auditorium", "seminar hall", "convocation hall", "convention hall"], "5", "Auditoriums"],
		[["gallery", "art gallery"], "5", "Art Galleries"],
		[["exhibition centre", "expo centre", "trade centre"], "5", "Exhibition / Exposition Buildings"],
		[["vet clinic", "pet clinic", "animal hospital"], "5", "Veterinary Clinics"],
		[["factory", "manufacturing unit", "industrial shed", "workshop", "plant"], "6", "Factories"],
		[["warehouse", "logistics park", "distribution centre"], "6", "Storage or Warehouse Buildings"],
		[["farm shed", "cowshed", "poultry farm", "barn"], "6", "Farm Buildings"],
		[["lab", "laboratory", "testing lab"], "6", "Laboratories"],
		[["rice mill", "textile mill", "spinning mill"], "6", "Mills"],
		[["temple", "church", "mosque", "masjid", "gurudwara", "dargah", "mandir", "prayer hall", "monastery", "ashram"], "7", "Places of Worship"],
		[["government office", "collectorate", "municipal office", "panchayat office", "taluk office", "public office"], "7", "Govt. / Semi-govt. / Public Offices"],
		[["bank", "bank branch"], "7", "Banks"],
		[["police station"], "7", "Police Headquarters / Stations, Police Line"],
		[["court", "court complex"], "7", "Courthouses"],
		[["museum", "heritage centre", "interpretation centre"], "7", "Museums"],
		[["memorial", "samadhi"], "7", "Memorials"],
		[["mixed use", "mixed-use", "commercial cum residential", "shops with flats", "shop and house"], "8", "A building or campus with two or more typologies housed in a composite manner, e.g. a building that has commercial, hotel and office together"],
		[["club", "club house", "recreation club"], "9", "Clubhouses"],
		[["gym", "fitness centre", "health club"], "9", "Gymnasium"],
		[["sports complex", "badminton court", "indoor stadium", "swimming pool", "turf", "sports centre"], "9", "Sports Buildings / Complexes"],
		[["cricket ground", "football ground", "stadium"], "9", "Stadiums"],
		[["park", "theme park"], "9", "Parks"],
		[["garden", "botanical garden"], "9", "Gardens"],
		[["bus stand", "bus station", "bus depot"], "10", "Bus Terminal"],
		[["railway station", "train station"], "10", "Railway Stations"],
		[["metro", "metro station"], "10", "Metro Stations"],
		[["airport", "airstrip"], "10", "Airports"],
		[["jetty", "ferry", "boat terminal"], "10", "Ferry Terminal Buildings"],
	];

	const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9& ]+/g, " ").replace(/\s+/g, " ").trim();

	/** Best COA matches for what the user typed: [{ category, coaType, said, score }], strongest first. */
	function searchBuilding(query, limit) {
		const q = norm(query);
		if (q.length < 2) return [];
		const hits = new Map();
		const add = (category, coaType, said, score) => {
			const key = category + "|" + coaType;
			const prev = hits.get(key);
			if (!prev || score > prev.score) hits.set(key, { category: category, coaType: coaType, said: said, score: score });
		};
		Object.keys(TYPES).forEach((cat) => TYPES[cat].forEach((t) => {
			const n = norm(t);
			if (n === q) add(cat, t, null, 100);
			else if (n.indexOf(q) === 0) add(cat, t, null, 80);
			else if (n.indexOf(q) > -1) add(cat, t, null, 60);
		}));
		ALIASES.forEach(([names, cat, t]) => names.forEach((name) => {
			const n = norm(name);
			if (n === q) add(cat, t, name, 95);
			else if (n.indexOf(q) === 0) add(cat, t, name, 70);
			else if (q.length >= 4 && (n.indexOf(q) > -1 || q.indexOf(n) > -1)) add(cat, t, name, 50);
		}));
		return Array.from(hits.values()).sort((a, b) => b.score - a.score || a.coaType.length - b.coaType.length).slice(0, limit || 6);
	}

	const api = { TYPES: TYPES, ALIASES: ALIASES, searchBuilding: searchBuilding };
	if (typeof module !== "undefined" && module.exports) module.exports = api;
	else root.AXBuildings = api;
})(this);
