# ConnectHD — site completo

Site institucional com React, TypeScript, Vite, Tailwind e Framer Motion. Visual editorial escuro, destaque em azul-claro, títulos grandes, animações de rolagem e cursor contextual em computador. Pedidos pelo site com banco SQLite e protocolo, além de WhatsApp no formato solicitado.

## Abrir e visualizar

Requer Node.js 24 ou superior. No Windows, dê dois cliques em `INICIAR.cmd`, ou execute:

```bash
npm install
npm run dev
```

Abra http://127.0.0.1:5173. Mantenha o terminal aberto. O comando inicia tanto o site quanto a API e o banco de dados.

O arquivo `PREVIA.html`, quando fornecido junto da entrega, é uma prévia visual independente: abre com dois cliques, sem instalar nada. O banco de dados exige o servidor acima. A prévia não registra pedidos.

## Recursos

- Experiência binaural de 31 segundos com sete posições, graves discretos, volume ajustável e interrupção ao sair da aba. Use fones. O áudio é sintetizado pelo navegador com HRTF; simula posições de um sistema 7.1 em saída estéreo, sem prometer reproduzir a acústica de uma sala real.
- Serviços detalhados, galeria filtrável e lightbox, comparação de acabamento, escala de TV e fluxo de manutenção.
- Formulário em três etapas com validação, escolha do defeito para manutenção e consentimento para contato.
- Pedido salvo no servidor com protocolo e proteção contra duplicação em tentativas repetidas.
- WhatsApp com título “Orçamento rápido — [serviço]”, problema, nome, telefone, bairro/cidade e observações. Espaços codificados são corrigidos.
- Atendimento em toda a região de São Paulo.

## Banco de dados e consulta dos pedidos

O banco é criado automaticamente em `data/connecthd.sqlite`. Esta pasta e arquivos `.env` são ignorados pelo Git. Não há dados de clientes no repositório.

Para consultar os últimos 200 pedidos no computador/servidor:

```bash
npm run orders
```

A consulta remota `GET /api/orders` exige `Authorization: Bearer [ADMIN_TOKEN]`. Configure um token aleatório com ao menos 32 caracteres em `.env`; sem ele, a consulta remota fica bloqueada. Nunca coloque o token no frontend. O site não envia notificações automáticas à equipe: consulte os pedidos ou use a integração de WhatsApp.

## Publicar com banco persistente

Este projeto precisa de **Node.js 24 e disco persistente**. Hospedagem apenas estática (GitHub Pages, por exemplo) não executa o banco/API.

```bash
npm ci
npm run build
npm start
```

O servidor serve `dist/` e a API na mesma origem. Configure:

- `HOST=0.0.0.0` no servidor de hospedagem;
- `PORT` conforme a plataforma;
- `DATABASE_PATH` apontando para um volume persistente;
- `PUBLIC_ORIGIN` igual à URL HTTPS final;
- `ADMIN_TOKEN` para acesso remoto restrito aos pedidos, quando necessário.

Há um `Dockerfile` para esse cenário. Monte um volume em `/app/data`. Mantenha backups do banco e publique atrás de HTTPS. Não use o armazenamento temporário de uma função serverless para SQLite. O limite de tentativas usa o IP da conexão; atrás de proxy, ajuste a infraestrutura com cuidado para não confiar indiscriminadamente em cabeçalhos de IP enviados por visitantes.

## Personalizar

- `src/config.ts`: contatos e região de atendimento.
- `src/data.ts`: serviços, dúvidas e referências de ambientes.
- `src/Editorial.tsx` e `src/editorial.css`: composição e interações principais.
- `src/OrderForm.tsx` e `src/quoteMessage.ts`: pedido e mensagem de WhatsApp.
- `server/orders.mjs`: banco, validação e persistência.
- `index.html`: SEO e dados estruturados. Inclua canonical e URL definitiva após escolher o domínio.

Fotos locais em WebP, de referência, não apresentadas como portfólio real. Créditos Unsplash:

- Влад Хмара: https://unsplash.com/photos/9PRDJ6XRp4c
- Caroline Badran: https://unsplash.com/photos/wHOVZsDxECk
- Li Zhang: https://unsplash.com/photos/zSAZG5uQGvk

## Verificação

```bash
npm test
npm run build
```

Os testes cobrem persistência após reabrir o banco, prevenção de duplicação e rejeição de dados inválidos. A compilação verifica os tipos. Não há pontuação Lighthouse aferida: a meta de 90+ precisa ser validada no ambiente final.
