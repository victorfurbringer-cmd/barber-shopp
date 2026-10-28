CREATE TABLE "TokenRedefinicaoSenha" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRedefinicaoSenha_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TokenRedefinicaoSenha_tokenHash_key" ON "TokenRedefinicaoSenha"("tokenHash");
CREATE INDEX "TokenRedefinicaoSenha_usuarioId_idx" ON "TokenRedefinicaoSenha"("usuarioId");
CREATE INDEX "TokenRedefinicaoSenha_expiraEm_idx" ON "TokenRedefinicaoSenha"("expiraEm");

ALTER TABLE "TokenRedefinicaoSenha"
ADD CONSTRAINT "TokenRedefinicaoSenha_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;