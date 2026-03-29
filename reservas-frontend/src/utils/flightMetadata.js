const AIRLINE_NAME_MAP = {
  AF: "Air France",
  AR: "Aerolineas Argentinas",
  AZ: "ITA Airways",
  IB: "Iberia",
  KL: "KLM",
  LA: "LATAM",
  LH: "Lufthansa",
  UX: "Air Europa",
};

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const normalizeAirlineName = (rawAirline) => {
  const cleaned = String(rawAirline || "").trim();
  if (!cleaned) return "Desconocida";

  const fromCode = AIRLINE_NAME_MAP[cleaned.toUpperCase()];
  if (fromCode) return fromCode;

  const normalizedInput = normalizeKey(cleaned);
  const fromName = Object.values(AIRLINE_NAME_MAP).find(
    (name) => normalizeKey(name) === normalizedInput
  );

  return fromName || cleaned;
};
