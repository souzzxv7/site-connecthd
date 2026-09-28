import { spawn } from 'node:child_process';
const children = [
  spawn(process.execPath, ['--env-file-if-exists=.env','server/index.mjs'], {stdio:'inherit'}),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], {stdio:'inherit'})
];
let stopping = false;
const stop = (code=0) => {if(stopping)return;stopping=true;children.forEach(c=>c.kill());setTimeout(()=>process.exit(code),150).unref()};
children.forEach(c=>c.on('exit',code=>stop(code??0)));
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
