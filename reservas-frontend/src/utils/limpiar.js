// utils/limpiar.js (opcional, o dentro del BuscadorVuelos.jsx)
export function limpiar(str) {
  return str
    ?.normalize("NFD")               // separar acentos
    .replace(/[̀-ͯ]/g, "") // quitar acentos
    .trim()
    .toLowerCase() || "";
}
