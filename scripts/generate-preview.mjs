import { build } from 'esbuild';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const result=await build({entryPoints:['src/main.tsx'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true,jsx:'automatic',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'}});
let js=result.outputFiles[0].text;
for(const name of ['living','audio','theater'])js=js.replaceAll(`/images/${name}.webp`,`data:image/webp;base64,${readFileSync(`public/images/${name}.webp`).toString('base64')}`);
const css=readFileSync(`dist/assets/${readdirSync('dist/assets').find(x=>x.endsWith('.css'))}`,'utf8');
let html=readFileSync('index.html','utf8').replace('<html lang="pt-BR">','<html lang="pt-BR" data-preview="true">').replace(/<script type="module"[^>]*><\/script>/,'').replace(/<link rel="icon"[^>]*>/,'');
html=html.replace('</head>',`<style>${css}</style></head>`).replace('</body>',`<aside style="position:fixed;bottom:14px;left:14px;z-index:99;max-width:260px;background:#eee8dd;color:#222;padding:10px 13px;border:1px solid #aaa;font:11px/1.5 Arial">Prévia visual • Para salvar pedidos no banco, execute INICIAR.cmd no projeto completo.</aside><script>${js.replace(/<\/script/gi,'<\\/script')}</script></body>`);
writeFileSync('PREVIA.html',html);console.log('PREVIA.html gerada com imagens e código incorporados.');
