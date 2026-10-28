// Vite proxies local API/output requests; built pages serve them directly.
export function factoryOrigin(){
  return new URL(document.querySelector('.factory-link')?.href??location.origin).origin;
}
