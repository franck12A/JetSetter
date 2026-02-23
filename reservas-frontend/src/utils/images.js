export const getVueloImage = (vuelo) => {
  // 1️⃣ Si el vuelo ya tiene imagen, la usamos
  if (vuelo.imagenUrl) return vuelo.imagenUrl;
  if (vuelo.imagenPrincipal) return vuelo.imagenPrincipal;

  // 2️⃣ Sino, buscamos en Unsplash
  const UNSPLASH_KEY = "Q8A1ipqKEMbEFC8guAWjy6tasCf1Xtc7evpPH3Uu4pE"; // reemplazar con tu key
  const destino = vuelo.destination || "viaje";
  return `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(destino)}`;
};
