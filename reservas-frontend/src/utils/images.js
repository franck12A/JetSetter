export const getVueloImage = (vuelo) => {
  if (!vuelo) return "/assets/avionsito.png";
  if (vuelo.imagenUrl) return vuelo.imagenUrl;
  if (vuelo.imagenPrincipal) return vuelo.imagenPrincipal;
  if (vuelo.image) return vuelo.image;
  if (Array.isArray(vuelo.imagenesPais) && vuelo.imagenesPais.length > 0) return vuelo.imagenesPais[0];
  if (Array.isArray(vuelo.imagesBase64) && vuelo.imagesBase64.length > 0) return vuelo.imagesBase64[0];
  return "/assets/avionsito.png";
};
