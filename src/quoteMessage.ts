export function cleanQuoteText(value:string){return value.replace(/&#(?:x20|32|160);|&nbsp;/gi,' ').replace(/[\t\r\n ]+/g,' ').trim()}
export function quoteMessage(data:{service:string,problem?:string,name:string,phone:string,city:string,notes:string,size?:string,place?:string,reference?:string}){
  const rows=[`Orçamento rápido — ${data.service}`];
  if(data.service==='Manutenção de TV')rows.push(`⚠️ Problema: ${cleanQuoteText(data.problem||'A informar')}`);
  rows.push(`👤 Nome: ${cleanQuoteText(data.name)||'A informar'}`,`📱 WhatsApp: ${data.phone.replace(/\D/g,'')||'A informar'}`,`📍 Bairro/Cidade: ${cleanQuoteText(data.city)||'A informar'}`,`💬 Observações: ${cleanQuoteText(data.notes)||'Não informadas'}`);
  if(data.service!=='Manutenção de TV'){if(data.size&&data.size!=='Não sei / não se aplica')rows.push(`📺 TV: ${data.size}`);if(data.place&&data.place!=='Outro / a definir')rows.push(`🏠 Local: ${data.place}`)}
  if(data.reference)rows.push(`\n📋 Protocolo: ${data.reference}`);
  return rows.join('\n');
}
