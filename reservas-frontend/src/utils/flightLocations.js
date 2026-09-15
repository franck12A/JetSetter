const clean = (value) => String(value || "").trim();

export const getFlightLocation = (vuelo = {}, endpoint = "destination") => {
  const prefix = endpoint === "origin" ? "origin" : "destination";
  const legacyPrefix = endpoint === "origin" ? "origen" : "destino";
  const code = clean(vuelo[prefix] || vuelo[legacyPrefix]);
  const city = clean(
    vuelo[`${prefix}DisplayCity`] ||
      vuelo[`${prefix}City`] ||
      vuelo[`${legacyPrefix}City`] ||
      vuelo[endpoint === "origin" ? "origenCiudad" : "destinoCiudad"]
  );
  const country = clean(
    vuelo[`${prefix}DisplayCountry`] ||
      vuelo[`${prefix}Country`] ||
      vuelo[`${legacyPrefix}Country`] ||
      vuelo[endpoint === "origin" ? "origenPais" : "paisDestino"]
  );
  const countryCode = clean(
    vuelo[`${prefix}CountryCode`] ||
      vuelo[`${legacyPrefix}CountryCode`] ||
      vuelo[endpoint === "origin" ? "origenCodigoPais" : "codigoPaisDestino"]
  );

  return { code, city, country, countryCode };
};

export const formatFlightLocation = (vuelo, endpoint) => {
  const { code, city, country } = getFlightLocation(vuelo, endpoint);
  const readable = [city, country].filter(Boolean).join(", ");
  return readable || code || "Ubicación no disponible";
};

export const formatFlightRoute = (vuelo) =>
  `${formatFlightLocation(vuelo, "origin")} -> ${formatFlightLocation(vuelo, "destination")}`;
