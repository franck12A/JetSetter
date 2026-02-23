export function matchFlexible(texto, valor) {
  if (!texto || !valor) return false;

  texto = texto.toLowerCase();
  valor = valor.toLowerCase();

  // Remover acentos y espacios
  const normalizar = s =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");

  return normalizar(valor).includes(normalizar(texto));
}
