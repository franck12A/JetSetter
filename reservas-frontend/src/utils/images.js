const COUNTRY_FALLBACKS = {
  Argentina: "/assets/imagenespaises/argentina_1.jpg",
  Australia: "/assets/imagenespaises/australia_1.jpg",
  Brazil: "/assets/imagenespaises/brazil_1.jpg",
  Canada: "/assets/imagenespaises/canada_1.jpg",
  China: "/assets/imagenespaises/china_1.jpg",
  Egypt: "/assets/imagenespaises/egipto_1.jpg",
  France: "/assets/imagenespaises/france_1.webp",
  Germany: "/assets/imagenespaises/germany_1.jpg",
  Greece: "/assets/imagenespaises/grecia_1.jpg",
  India: "/assets/imagenespaises/india_1.jpg",
  Italy: "/assets/imagenespaises/italy_1.webp",
  Japan: "/assets/imagenespaises/japon_1.jpg",
  Mexico: "/assets/imagenespaises/mexico_1.jpg",
  Netherlands: "/assets/imagenespaises/holanda_1.jpg",
  Norway: "/assets/imagenespaises/Norway_1.jpg",
  Portugal: "/assets/imagenespaises/portugal_1.jpg",
  "South Africa": "/assets/imagenespaises/southafrica_1.jpg",
  Spain: "/assets/imagenespaises/spain_1.jpg",
  Sweden: "/assets/imagenespaises/Sweden_1.jpg",
  Switzerland: "/assets/imagenespaises/Switzerland_1.jpg",
  Thailand: "/assets/imagenespaises/tailandia_1.jpg",
  Turkey: "/assets/imagenespaises/turkia_1.jpg",
  "United Kingdom": "/assets/imagenespaises/london_1.jpg",
  "United States": "/assets/imagenespaises/newyork_1.jpg",
};

export const getCountryFallbackImage = (country) =>
  COUNTRY_FALLBACKS[String(country || "").trim()] || "/assets/avionsito.png";

export const getVueloImage = (vuelo) => {
  if (!vuelo) return "/assets/avionsito.png";
  if (vuelo.imagenUrl) return vuelo.imagenUrl;
  if (vuelo.imagenPrincipal) return vuelo.imagenPrincipal;
  if (vuelo.image) return vuelo.image;
  if (Array.isArray(vuelo.imagenesPais) && vuelo.imagenesPais.length > 0) return vuelo.imagenesPais[0];
  if (Array.isArray(vuelo.imagesBase64) && vuelo.imagesBase64.length > 0) return vuelo.imagesBase64[0];
  return getCountryFallbackImage(vuelo.destinationCountry || vuelo.paisDestino || vuelo.country);
};
