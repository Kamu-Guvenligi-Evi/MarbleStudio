import {defineConfig} from 'vite';

const factory = process.env.VITE_FACTORY_ORIGIN || 'http://127.0.0.1:5180';
const proxy = Object.fromEntries(['/api', '/output'].map(route => [route, {
  target: factory,
  changeOrigin: true,
}]));

export default defineConfig({
  build: {rollupOptions: {input: {main:'index.html',factory:'factory.html',renderer:'factory-render.html',breaker:'spiral-breaker.html',glass:'glass-breaker.html',duel:'ball-duel.html'}}},
  server: {host:'127.0.0.1',port:5173,strictPort:true,proxy,watch:{ignored:['**/artifacts/**','**/output/**','**/*.log']}},
});
