// Airport lookups must be served by JetSetter, never with provider credentials in the browser.
// This legacy helper is currently unused; retain its export without calling an external provider.
export async function buscarAeropuertos(keyword) {
  void keyword;
  return [];
}
