import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{input:{main:'index.html',factory:'factory.html',renderer:'factory-render.html'}}},server:{host:'127.0.0.1',port:5173,strictPort:true,watch:{ignored:['**/artifacts/**','**/output/**','**/*.log']}}});
