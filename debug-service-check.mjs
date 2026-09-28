import bcrypt from 'bcrypt';
import prisma from './src/config/prisma.js';

const email = 'admin@barbershop.com';
const senha = 'admin123';
const nome = 'Administrador';

const existente = await prisma.usuario.findUnique({ where: { email } });
if (!existente) {
  const hash = await bcrypt.hash(senha, 12);
  await prisma.usuario.create({
    data: { nome, email, senha: hash, tipo: 'ADMIN' }
  });
}

const loginRes = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, senha })
});

const loginData = await loginRes.json();
console.log('LOGIN_STATUS', loginRes.status);
console.log(JSON.stringify(loginData));

const token = loginData.token;
const createRes = await fetch('http://localhost:3000/servicos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    nome: 'Corte Teste',
    descricao: 'Teste de criação',
    duracaoMinutos: 30,
    preco: 35.5
  })
});

const text = await createRes.text();
console.log('CREATE_STATUS', createRes.status);
console.log(text);
