import test from "node:test";
import assert from "node:assert/strict";

import { validarAgendamento } from "../src/utils/agendamentoRules.js";

test("deve rejeitar agendamento sem cliente, barbeiro ou serviço válidos", () => {
  assert.throws(
    () =>
      validarAgendamento(
        {
          clienteId: 0,
          barbeiroId: 1,
          servicoId: 1,
          dataHora: "2026-10-01T09:00:00",
        },
        { agendamentos: [] }
      ),
    /cliente|barbeiro|serviço/i
  );
});

test("deve impedir conflito de horário para o mesmo barbeiro", () => {
  assert.throws(
    () =>
      validarAgendamento(
        {
          clienteId: 10,
          barbeiroId: 2,
          servicoId: 1,
          dataHora: "2026-10-01T09:00:00",
        },
        {
          agendamentos: [
            {
              barbeiroId: 2,
              dataHora: "2026-10-01T09:00:00",
              status: "PENDENTE",
            },
          ],
        }
      ),
    /horário|barbeiro/i
  );
});

test("deve impedir sobreposição de horário pela duração do serviço", () => {
  assert.throws(
    () =>
      validarAgendamento(
        {
          clienteId: 10,
          barbeiroId: 2,
          servicoId: 1,
          dataHora: "2026-10-01T09:30:00",
          status: "PENDENTE",
        },
        {
          agendamentos: [
            {
              barbeiroId: 2,
              dataHora: "2026-10-01T09:00:00",
              status: "PENDENTE",
              servico: { duracaoMinutos: 45 },
            },
          ],
        }
      ),
    /horário|barbeiro/i
  );
});

test("deve aceitar agendamento válido", () => {
  assert.doesNotThrow(() =>
    validarAgendamento(
      {
        clienteId: 10,
        barbeiroId: 2,
        servicoId: 1,
        dataHora: "2026-10-01T09:00:00",
        status: "PENDENTE",
      },
      {
        agendamentos: [
          {
            barbeiroId: 2,
            dataHora: "2026-10-01T10:00:00",
            status: "CONFIRMADO",
          },
        ],
      }
    )
  );
});
