export const config = {
  phone: '(11) 99907-6581', whatsapp: '5511999076581', email: 'suporte@connecthd.com.br',
  instagram: 'https://www.instagram.com/connecthd_/',
  serviceArea: 'Toda a região de São Paulo',
  installationCount: 500, installationCountVerified: false,
  testimonials: [
    {name:'Exemplo de avaliação • Instalação de TV',quote:'A TV ficou alinhada, os cabos organizados e a sala ganhou outro visual.'},
    {name:'Exemplo de avaliação • Home theater',quote:'Um projeto pensado para o espaço, com som envolvente e um acabamento muito cuidadoso.'},
    {name:'Exemplo de avaliação • Atendimento',quote:'Todas as etapas foram explicadas com clareza, do orçamento à entrega.'}
  ]
};
export const whatsappUrl = (message = 'Olá, ConnectHD! Gostaria de solicitar um orçamento.') => `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;
