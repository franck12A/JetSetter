import { matchFlexible } from "./matchFlexible";

export function filtrarVuelos(vuelos, filtros) {
  const { origen, destino, categoria, precioMin, precioMax } = filtros;

  return vuelos.filter(v => {

    const matchOrigen = origen ? matchFlexible(origen, v.origen) : true;

    const matchDestino = destino ? matchFlexible(destino, v.destino) : true;

    const matchCategoria = categoria
      ? v.categoria === categoria.toLowerCase()
      : true;

    const matchPrecio =
      (precioMin ? v.precio >= precioMin : true) &&
      (precioMax ? v.precio <= precioMax : true);

    return matchOrigen && matchDestino && matchCategoria && matchPrecio;
  });
}
