// Porta de entrada das Fichas DBT.
// Enquanto a variável FICHAS_CODIGO não existir no Cloudflare, as fichas ficam abertas.
// Quando ela existir, pede o código da turma uma vez e lembra por 180 dias.
async function hash(s){
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fichas-dbt:'+s));
  return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function pagina(erro){
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Fichas DBT</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf9f7;font-family:system-ui,sans-serif;color:#2a1c1e}
form{background:#fff;border:1px solid #e6cfd3;border-radius:16px;padding:2rem;width:min(340px,90vw)}
h1{font-size:1.2rem;margin:0 0 .4rem;color:#8c2335}p{font-size:.85rem;color:#6f5a5d;margin:0 0 1.2rem}
input{width:100%;box-sizing:border-box;padding:.75rem;border:1px solid #e6cfd3;border-radius:10px;font-size:1rem}
button{margin-top:.8rem;width:100%;padding:.75rem;border:0;border-radius:10px;background:#8c2335;color:#fff;font-weight:600;font-size:.95rem}
.e{color:#b3261e;font-size:.8rem;margin-top:.6rem}</style></head><body>
<form method="post"><h1>Fichas DBT</h1><p>Material da turma Descomplicando a DBT. Digite o código da turma.</p>
<input name="codigo" autocomplete="off" autofocus aria-label="Código da turma"><button>Entrar</button>
${erro?'<div class="e">Código não confere.</div>':''}</form></body></html>`,
  {status: erro?401:200, headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
}
export async function onRequest(ctx){
  const codigo = (ctx.env.FICHAS_CODIGO||'').trim();
  if(!codigo) return ctx.next();
  const certo = await hash(codigo);
  const ck = ctx.request.headers.get('cookie')||'';
  if(ck.includes('fichas='+certo)) return ctx.next();
  if(ctx.request.method==='POST'){
    const f = await ctx.request.formData();
    if((f.get('codigo')||'').toString().trim().toLowerCase() === codigo.toLowerCase()){
      return new Response(null,{status:303,headers:{
        'location': new URL(ctx.request.url).pathname,
        'set-cookie': `fichas=${certo}; Path=/fichas; Max-Age=15552000; Secure; HttpOnly; SameSite=Lax`}});
    }
    return pagina(true);
  }
  return pagina(false);
}
