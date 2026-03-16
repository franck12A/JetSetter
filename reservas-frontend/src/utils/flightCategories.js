const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const toTitle = (value = "") => {
  const clean = normalizeText(value);
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const ARG_TOKENS = [
  "argentina",
  "buenos aires",
  "ezeiza",
  "aeroparque",
  "aep",
  "eze",
  "cor",
  "cordoba",
  "mdz",
  "mendoza",
  "sla",
  "salta",
  "brc",
  "bariloche",
  "igu",
  "iguazu",
];

const CATEGORY_KEYWORDS = {
  Playa: [
    "cancun",
    "miami",
    "rio",
    "copacabana",
    "punta cana",
    "caribe",
    "ibiza",
    "bali",
    "phuket",
    "maceio",
    "recife",
    "beach",
  ],
  Montana: [
    "bariloche",
    "andes",
    "alpes",
    "zurich",
    "geneva",
    "patagonia",
    "mendoza",
    "ushuaia",
    "mountain",
  ],
  Aventura: [
    "safari",
    "trek",
    "islandia",
    "iceland",
    "kenia",
    "peru",
    "cusco",
    "machu",
  ],
  Lujo: ["dubai", "doha", "abu dhabi", "monaco", "luxury"],
  Ciudad: [
    "new york",
    "paris",
    "london",
    "madrid",
    "roma",
    "tokyo",
    "cdmx",
    "berlin",
    "city",
  ],
};

const GENERIC = new Set(["otros", "sin categoria"]);

function inferScope(origenText, destinoText) {
  const isArg = (txt) => ARG_TOKENS.some((token) => txt.includes(token));
  if (isArg(origenText) && isArg(destinoText)) return "Nacional";
  return "Internacional";
}

export function inferFlightCategories(vuelo = {}) {
  const origen = normalizeText(vuelo.origen || vuelo.origin || "");
  const destino = normalizeText(vuelo.destino || vuelo.destination || "");
  const pais = normalizeText(vuelo.paisDestino || vuelo.country || "");
  const name = normalizeText(vuelo.name || vuelo.nombre || "");
  const haystack = `${destino} ${pais} ${name}`;

  const rawCats = [
    ...(Array.isArray(vuelo.categorias) ? vuelo.categorias : []),
    vuelo.categoria,
    vuelo.category?.name,
    typeof vuelo.category === "string" ? vuelo.category : null,
  ]
    .filter(Boolean)
    .map((c) => toTitle(c));

  const categories = new Set(rawCats.filter((c) => !GENERIC.has(normalizeText(c))));

  categories.add(inferScope(origen, destino));

  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    if (keywords.some((k) => haystack.includes(normalizeText(k)))) {
      categories.add(category);
    }
  });

  if (categories.size === 1) {
    categories.add("Ciudad");
  }

  return Array.from(categories);
}

export function hasCategoryMatch(vueloCategorias = [], selectedCategories = []) {
  const selectedArray = Array.isArray(selectedCategories) ? selectedCategories : [selectedCategories];
  const cleaned = selectedArray.map((cat) => normalizeText(cat)).filter(Boolean);
  if (cleaned.length === 0) return true;
  return (vueloCategorias || []).some((cat) => cleaned.includes(normalizeText(cat)));
}
