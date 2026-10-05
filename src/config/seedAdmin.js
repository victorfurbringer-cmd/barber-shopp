import bcrypt from 'bcrypt';
import prisma from './prisma.js';

export async function ensureDefaultAdmin() {
  const email = 'admin@barbershop.com';
  const senha = 'admin123';

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (usuarioExistente) {
    return usuarioExistente;
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  return prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email,
      senha: senhaHash,
      tipo: 'ADMIN',
    },
  });
}
