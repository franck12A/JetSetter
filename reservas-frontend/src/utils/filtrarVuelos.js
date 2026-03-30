import { matchFlexible } from "./matchFlexible";

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const resolveCategorias = (vuelo = {}) => {
  const categorias = [];
  if (Array.isArray(vuelo.categorias)) categorias.push(...vuelo.categorias);
  if (vuelo.categoria) categorias.push(vuelo.categoria);
  if (vuelo.category?.name) categorias.push(vuelo.category.name);
  if (typeof vuelo.category === "string") categorias.push(vuelo.category);
  const resolved = categorias.filter(Boolean);
  return resolved.length > 0 ? resolved : ["Sin categoria"];
};

export function filtrarVuelos(vuelos, filtros) {
  const { origen, destino, categoria, precioMin, precioMax } = filtros;
  const categoriaNormalizada = normalizeText(categoria);

  return (vuelos || []).filter((vuelo) => {
    const matchOrigen = origen ? matchFlexible(origen, vuelo.origen) : true;
    const matchDestino = destino ? matchFlexible(destino, vuelo.destino) : true;

    const categoriasVuelo = resolveCategorias(vuelo).map(normalizeText);
    const matchCategoria = !categoriaNormalizada
      ? true
      : categoriasVuelo.length > 0 && categoriasVuelo.includes(categoriaNormalizada);

    const precio = Number(vuelo.precio ?? vuelo.precioTotal ?? vuelo.price ?? 0);
    const matchPrecio =
      (precioMin ? precio >= Number(precioMin) : true) &&
      (precioMax ? precio <= Number(precioMax) : true);

    return matchOrigen && matchDestino && matchCategoria && matchPrecio;
  });
}
