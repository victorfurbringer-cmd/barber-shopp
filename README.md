# Barber Backend

Backend em Node.js + Express + Prisma + PostgreSQL para gestão de salão de barbearia.

## Status atual

### Funcionalidades implementadas
- ✅ Estrutura base do projeto em Express
- ✅ Autenticação com JWT
- ✅ Middleware de autenticação e autorização por tipo de usuário
- ✅ Rotas de autenticação: cadastro e login
- ✅ Rota protegida: /auth/me
- ✅ Estrutura do Prisma com models de usuário, cliente, barbeiro, serviço e agendamento
- ✅ CRUD base para clientes, barbeiros, serviços e agendamentos
- ✅ Schema Prisma validado
- ✅ PostgreSQL online e conectado ao projeto
- ✅ Migração inicial aplicada com sucesso
- ✅ Teste real de cadastro, login e rota protegida concluído com sucesso

### O que ainda falta para concluir o projeto
- ❌ Regras de conflito de horários em agendamentos
- ❌ Validações mais robustas de negócio para cliente/barbeiro/serviço
- ❌ Seed de administrador e usuários iniciais
- ❌ Melhor organização e tratamento de erros específicos por módulo
- ❌ Testes automatizados (unitários/integrados)
- ❌ Swagger ou documentação interativa de endpoints

---

## Tecnologias

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT (jsonwebtoken)
- bcrypt
- dotenv
- cors
- helmet
- express-validator

---

## Requisitos

Antes de rodar o projeto, verifique se você tem:

- Node.js 18 ou superior
- npm
- PostgreSQL instalado e em execução
- Banco criado com o nome: barbershopp
- Acesso local com usuário: postgres

---

## Estrutura do projeto

```bash
barber-backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── prisma.js
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── clienteController.js
│   │   ├── barbeiroController.js
│   │   ├── servicoController.js
│   │   └── agendamentoController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── errorMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── clienteRoutes.js
│   │   ├── barbeiroRoutes.js
│   │   ├── servicoRoutes.js
│   │   └── agendamentoRoutes.js
│   ├── app.js
│   └── server.js
├── .env
├── .gitignore
├── prisma.config.ts
├── package.json
├── README.md
└── node_modules/
```

---

## Instalação

1. Clone o projeto.
2. Instale as dependências:

```bash
npm install
```

3. Configure o arquivo .env conforme o exemplo abaixo.

---

## Variáveis de ambiente

Crie um arquivo .env na raiz do projeto com este conteúdo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barbershopp"
JWT_SECRET="barber-backend-secret-super-forte-2026-para-jwt-autenticacao"
JWT_EXPIRES_IN="8h"
PORT=3000
```

Importante:
- Troque a senha do PostgreSQL conforme sua máquina.
- Nunca compartilhe o .env em repositórios públicos.
- O JWT_SECRET deve ser forte e único.

---

## Banco de dados

A aplicação usa PostgreSQL com Prisma.

Antes de testar o fluxo completo, o PostgreSQL precisa estar rodando localmente.

### Comando para migrar

```bash
npx prisma migrate dev --name criar_usuario
```

### Gerar cliente Prisma

```bash
npx prisma generate
```

### Validar schema

```bash
npx prisma validate
```

---

## Execução

### Modo desenvolvimento

```bash
npm run dev
```

### Modo produção

```bash
npm start
```

A API deve subir em:

```text
http://localhost:3000
```

---

## Fluxo de autenticação

### Cadastro

Endpoint:

```http
POST /auth/register
```

Body:

```json
{
  "nome": "Victor Furbringer",
  "email": "victor@email.com",
  "senha": "123456"
}
```

### Login

Endpoint:

```http
POST /auth/login
```

Body:

```json
{
  "email": "victor@email.com",
  "senha": "123456"
}
```

Resposta esperada:

```json
{
  "mensagem": "Login realizado com sucesso.",
  "token": "SEU_TOKEN",
  "usuario": {
    "id": 1,
    "nome": "Victor Furbringer",
    "email": "victor@email.com",
    "tipo": "CLIENTE"
  }
}
```

### Rota protegida

```http
GET /auth/me
```

Headers:

```http
Authorization: Bearer SEU_TOKEN
```

---

## Rotas principais

### Autenticação
- POST /auth/register
- POST /auth/login
- GET /auth/me

### Clientes
- GET /clientes
- POST /clientes
- GET /clientes/:id
- PUT /clientes/:id
- DELETE /clientes/:id

### Barbeiros
- GET /barbeiros
- POST /barbeiros
- GET /barbeiros/:id
- PUT /barbeiros/:id
- DELETE /barbeiros/:id

### Serviços
- GET /servicos
- POST /servicos
- GET /servicos/:id
- PUT /servicos/:id
- DELETE /servicos/:id

### Agendamentos
- GET /agendamentos
- POST /agendamentos
- GET /agendamentos/:id
- PUT /agendamentos/:id
- DELETE /agendamentos/:id

---

## Permissões

Tipos de usuário:
- CLIENTE
- BARBEIRO
- ADMIN

Autorização implementada por middleware:
- verificarToken
- permitirTipos(...tiposPermitidos)

Exemplo:

```js
router.get("/financeiro", verificarToken, permitirTipos("ADMIN"), handler);
```

---

## O que precisa ser concluído para o projeto ficar entregue

### 1. Banco PostgreSQL
- Subir o PostgreSQL local
- Garantir o banco barbershopp existindo
- Aplicar as migrações

### 2. Regras de negócio
- Impedir conflito de horários para o mesmo barbeiro
- Validar se o profissional está disponível
- Validar a existência de cliente, barbeiro e serviço antes de agendar
- Validar horários e status do agendamento

### 3. Segurança
- Criptografar senhas com bcrypt (já implementado)
- Não expor senha no retorno
- Usar JWT somente com claims essenciais
- Controlar permissões por route

### 4. Melhorias de produção
- Logs estruturados
- Tratamento específico de erros por módulo
- Testes automatizados
- Seed de usuários administrador
- Documentação de endpoints com Swagger ou Insomnia collection

---

## Observações importantes

- O Prisma CLI foi validado com sucesso no schema atual.
- A API já sobe em modo desenvolvimento.
- O banco PostgreSQL está funcionando neste ambiente e a autenticação real foi validada.
- O arquivo .env e os dados sensíveis não devem ser enviados para o GitHub.

---

## Próximos passos recomendados

1. Implementar regras de conflito de horário para o mesmo barbeiro.
2. Validar disponibilidade de cliente, barbeiro e serviço antes do agendamento.
3. Criar regras de negócio adicionais para status e cancelamento.
4. Adicionar rotas administrativas e relatórios.
5. Validar o sistema completo com testes manuais e automatizados.

---

## Dica final

O projeto já está com a base funcional validada: banco, Prisma, autenticação e rota protegida funcionando corretamente. O próximo foco é fortalecer as regras de negócio de agendamento e expandir a API com os módulos administrativos.
