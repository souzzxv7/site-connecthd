import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { openStore, InputError } from './orders.mjs';

const port=Number(process.env.PORT||3001), host=process.env.HOST||'127.0.0.1';
const store=openStore(resolve(process.env.DATABASE_PATH||'data/connecthd.sqlite'));
const publicDir=resolve('dist');
const limits=new Map();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
const cleanup=setInterval(()=>{const now=Date.now();for(const [key,v] of limits)if(now>v.until)limits.delete(key)},60000);cleanup.unref();
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
function authorized(req){const token=process.env.ADMIN_TOKEN;if(!token||token.length<32)return false;const value=String(req.headers.authorization||'').replace(/^Bearer /,'');const a=Buffer.from(value),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b)}
async function body(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16000)throw new InputError('Pedido muito longo. Reduza as observações.',413);chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new InputError('Formato de pedido inválido.')}}
const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/health'&&req.method==='GET')return json(res,200,{ok:true});
    if(url.pathname==='/api/orders'&&req.method==='POST'){
      if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new InputError('Use um pedido JSON.',415);
      if(req.headers['sec-fetch-site']==='cross-site')throw new InputError('Origem não autorizada.',403);
      if(process.env.PUBLIC_ORIGIN && req.headers.origin && req.headers.origin!==process.env.PUBLIC_ORIGIN)throw new InputError('Origem não autorizada.',403);
      const key=req.socket.remoteAddress||'unknown',now=Date.now();let bucket=limits.get(key);
      if(!bucket||now>bucket.until){bucket={count:0,until:now+600000};limits.set(key,bucket)}
      if(++bucket.count>12){res.setHeader('Retry-After','600');throw new InputError('Muitas tentativas. Aguarde alguns minutos e tente novamente.',429)}
      const result=store.create(await body(req),req.headers['idempotency-key']);return json(res,result.replayed?200:201,result);
    }
    if(url.pathname==='/api/orders'&&req.method==='GET'){
      if(!authorized(req))return json(res,401,{error:'Acesso restrito à equipe ConnectHD.'});return json(res,200,{orders:store.list()});
    }
    if(url.pathname.startsWith('/api/'))return json(res,404,{error:'Rota não encontrada.'});
    if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Método não permitido.'});
    let decoded;try{decoded=decodeURIComponent(url.pathname)}catch{throw new InputError('Endereço inválido.')}
    let file=resolve(publicDir,'.'+decoded);if(file!==publicDir&&!file.startsWith(publicDir+sep))throw new InputError('Endereço inválido.',403);
    try{if((await stat(file)).isDirectory())file=resolve(file,'index.html')}catch{if(extname(file))return json(res,404,{error:'Arquivo não encontrado.'});file=resolve(publicDir,'index.html')}
    let content;try{content=await readFile(file)}catch{return json(res,503,{error:'Execute npm run build antes de iniciar o site em produção.'})}
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':file.includes(`${sep}assets${sep}`)?'public,max-age=31536000,immutable':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
  }catch(error){json(res,error instanceof InputError?error.status:500,{error:error instanceof InputError?error.message:'Não foi possível registrar agora. Tente novamente ou fale pelo WhatsApp.'})}
});
server.listen(port,host,()=>console.log(`ConnectHD API: http://${host}:${port}`));
function shutdown(){server.close(()=>{store.close();process.exit(0)})}process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
