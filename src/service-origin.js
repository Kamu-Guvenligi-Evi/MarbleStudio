// Built Studio pages are served by the production service itself. Only Vite
// development pages need a separate port, supplied by Start-Studio.ps1.
export function factoryOrigin(){
  return import.meta.env.DEV?new URL(import.meta.env.VITE_FACTORY_ORIGIN||'http://127.0.0.1:5180').origin:location.origin;
}
