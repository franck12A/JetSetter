// utils/limpiar.js (opcional, o dentro del BuscadorVuelos.jsx)
export function limpiar(str) {
  return str
    ?.normalize("NFD")               // separar acentos
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .trim()
    .toLowerCase() || "";
}
