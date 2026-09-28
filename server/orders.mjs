import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';

export const SERVICES = ['Instalação de TV','Áudio & Home Theater','Manutenção de TV','Produtos & Acessórios'];
export class InputError extends Error {constructor(message,status=400){super(message);this.status=status}}
const clean = (value,max) => typeof value==='string' ? value.trim().slice(0,max) : '';
export function validateOrder(input){
  if(!input || typeof input!=='object' || Array.isArray(input))throw new InputError('Pedido inválido.');
  if(input.website)throw new InputError('Não foi possível registrar este pedido.');
  const data={service:clean(input.service,80),problem:clean(input.problem,120),size:clean(input.size,40),place:clean(input.place,40),name:clean(input.name,100),phone:clean(input.phone,30).replace(/\D/g,''),city:clean(input.city,120).replace(/&#(?:x20|32|160);|&nbsp;/gi,' ').trim(),notes:clean(input.notes,2000),consent:input.consent===true};
  if(!SERVICES.includes(data.service))throw new InputError('Selecione um serviço válido.');
  if(data.service==='Manutenção de TV'&&!['Não liga','Liga, mas não aparece imagem','Sem som','Imagem com linhas ou manchas','Tela quebrada','Desliga sozinha','Outro problema'].includes(data.problem))throw new InputError('Selecione o problema da TV.');
  if(!['30–50″','51–65″','66–75″','76–98″+','Não sei / não se aplica'].includes(data.size))throw new InputError('Selecione o tamanho da TV.');
  if(!['Parede','Painel','Outro / a definir'].includes(data.place))throw new InputError('Selecione o local do projeto.');
  if(data.name.length<2)throw new InputError('Informe seu nome.');
  if(!/^(?:55)?\d{10,11}$/.test(data.phone))throw new InputError('Informe um telefone com DDD válido.');
  if(data.city.length<3)throw new InputError('Informe bairro e cidade.');
  if(!data.consent)throw new InputError('Autorize o contato para continuar.');
  return data;
}
export function openStore(path){
  if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});
  const db=new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT UNIQUE NOT NULL, idempotency_key TEXT UNIQUE NOT NULL,
    request_hash TEXT NOT NULL, service TEXT NOT NULL, size TEXT NOT NULL, place TEXT NOT NULL,
    name TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL, notes TEXT NOT NULL, problem TEXT NOT NULL DEFAULT '',
    consent_at TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'novo'
  );`);
  if(!db.prepare('PRAGMA table_info(orders)').all().some(c=>c.name==='problem'))db.exec("ALTER TABLE orders ADD COLUMN problem TEXT NOT NULL DEFAULT ''");
  return {
    create(input,key){
      const data=validateOrder(input);
      if(typeof key!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(key))throw new InputError('Identificador do pedido inválido. Atualize a página e tente novamente.');
      const hash=createHash('sha256').update(JSON.stringify(data)).digest('hex');
      const previous=db.prepare('SELECT reference, created_at, request_hash FROM orders WHERE idempotency_key = ?').get(key);
      if(previous){if(previous.request_hash!==hash)throw new InputError('Este envio já foi registrado com outros dados. Inicie um novo pedido.',409);return {reference:previous.reference,createdAt:previous.created_at,replayed:true}}
      const reference=`CHD-${new Date().getFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
      const time=new Date().toISOString();
      db.prepare('INSERT INTO orders (reference,idempotency_key,request_hash,service,size,place,name,phone,city,notes,problem,consent_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(reference,key,hash,data.service,data.size,data.place,data.name,data.phone,data.city,data.notes,data.problem,time,time);
      return {reference,createdAt:time,replayed:false};
    },
    list(){return db.prepare('SELECT reference,service,problem,size,place,name,phone,city,notes,created_at,status FROM orders ORDER BY id DESC LIMIT 200').all()},
    close(){db.close()}
  };
}
