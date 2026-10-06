import test from "node:test";
import assert from "node:assert/strict";

import {
  criarFiltroAgendamentosPorUsuario,
  usuarioPodeAcessarAgendamento,
} from "../src/utils/agendamentoAcesso.js";

test("cliente recebe filtro para visualizar apenas os próprios agendamentos", () => {
  const filtro = criarFiltroAgendamentosPorUsuario({
    tipo: "CLIENTE",
    usuarioId: 15,
    clienteId: 7,
    barbeiroId: 0,
  });

  assert.deepEqual(filtro, { clienteId: 7 });
});

test("barbeiro recebe filtro para visualizar apenas seus agendamentos", () => {
  const filtro = criarFiltroAgendamentosPorUsuario({
    tipo: "BARBEIRO",
    usuarioId: 22,
    clienteId: 0,
    barbeiroId: 9,
  });

  assert.deepEqual(filtro, { barbeiroId: 9 });
});

test("admin vê todos os agendamentos", () => {
  const filtro = criarFiltroAgendamentosPorUsuario({
    tipo: "ADMIN",
    usuarioId: 1,
    clienteId: 0,
    barbeiroId: 0,
  });

  assert.deepEqual(filtro, {});
});

test("cliente não pode acessar agendamento de outro cliente", () => {
  const podeAcessar = usuarioPodeAcessarAgendamento({
    tipo: "CLIENTE",
    usuarioId: 15,
    agendamentoClienteId: 7,
    agendamentoBarbeiroId: 3,
    clienteUsuarioId: 20,
    barbeiroUsuarioId: 9,
  });

  assert.equal(podeAcessar, false);
});

test("barbeiro pode acessar apenas seu próprio agendamento", () => {
  const podeAcessar = usuarioPodeAcessarAgendamento({
    tipo: "BARBEIRO",
    usuarioId: 22,
    barbeiroId: 9,
    agendamentoClienteId: 5,
    agendamentoBarbeiroId: 9,
    clienteUsuarioId: 15,
    barbeiroUsuarioId: 22,
  });

  assert.equal(podeAcessar, true);
});
