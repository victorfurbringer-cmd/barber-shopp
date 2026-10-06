const base = 'http://localhost:3000';

async function main() {
  const root = await fetch(base + '/');
  console.log('GET / ->', root.status, await root.text());

  const email = `cliente_${Date.now()}@teste.com`;

  const registerRes = await fetch(base + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Cliente Teste', email, senha: '123456' }),
  });
  const registerBody = await registerRes.text();
  console.log('POST /auth/register ->', registerRes.status, registerBody);

  const loginRes = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha: '123456' }),
  });
  const loginBody = await loginRes.text();
  console.log('POST /auth/login ->', loginRes.status, loginBody);

  const loginJson = JSON.parse(loginBody);
  const meRes = await fetch(base + '/auth/me', {
    headers: { Authorization: `Bearer ${loginJson.token}` },
  });
  const meBody = await meRes.text();
  console.log('GET /auth/me ->', meRes.status, meBody);

  const servicosRes = await fetch(base + '/servicos', {
    headers: { Authorization: `Bearer ${loginJson.token}` },
  });
  const servicosBody = await servicosRes.text();
  console.log('GET /servicos ->', servicosRes.status, servicosBody);
}

main().catch((error) => {
  console.error('FATAL', error);
  process.exit(1);
});
