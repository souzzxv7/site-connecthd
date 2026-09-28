import { openStore } from '../server/orders.mjs';
const store=openStore(process.env.DATABASE_PATH||'data/connecthd.sqlite');
console.log(JSON.stringify(store.list(),null,2));store.close();
