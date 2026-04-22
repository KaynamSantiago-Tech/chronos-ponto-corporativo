import { describe, expect, it } from "vitest";

import { AuditLogInterceptor } from "./audit-log.interceptor";

// Instância sem dependências — testamos o método privado via cast.
const interceptor = new AuditLogInterceptor({} as never);
const safe = (body: unknown) =>
  (interceptor as unknown as { safePayload: (b: unknown) => unknown }).safePayload(body);

describe("AuditLogInterceptor.safePayload", () => {
  it("redige campos sensíveis no topo", () => {
    expect(safe({ senha: "abc", nome: "Alice" })).toEqual({
      senha: "[redacted]",
      nome: "Alice",
    });
  });

  it("redige múltiplas chaves conhecidas (password/token/secret/cpf/authorization)", () => {
    const out = safe({
      password: "x",
      token: "y",
      secret: "z",
      authorization: "Bearer foo",
      cpf: "123.456.789-00",
      email: "a@b.com",
    });
    expect(out).toEqual({
      password: "[redacted]",
      token: "[redacted]",
      secret: "[redacted]",
      authorization: "[redacted]",
      cpf: "[redacted]",
      email: "a@b.com",
    });
  });

  it("redige recursivamente em objetos aninhados", () => {
    const out = safe({
      user: { nome: "Alice", senha: "segredo", nested: { token: "t" } },
    });
    expect(out).toEqual({
      user: { nome: "Alice", senha: "[redacted]", nested: { token: "[redacted]" } },
    });
  });

  it("trata arrays corretamente, redigindo objetos dentro", () => {
    const out = safe({
      usuarios: [
        { nome: "A", senha: "a" },
        { nome: "B", password: "b" },
      ],
    });
    expect(out).toEqual({
      usuarios: [
        { nome: "A", senha: "[redacted]" },
        { nome: "B", password: "[redacted]" },
      ],
    });
  });

  it("retorna null para valores não-objeto", () => {
    expect(safe(null)).toBeNull();
    expect(safe(undefined)).toBeNull();
    expect(safe("string")).toBeNull();
    expect(safe(42)).toBeNull();
  });

  it("limita profundidade de recursão para evitar loops/abusos", () => {
    // Monta estrutura com 6 níveis.
    const deep: Record<string, unknown> = { v: 1 };
    let ref = deep;
    for (let i = 0; i < 6; i++) {
      const next: Record<string, unknown> = { v: i + 2 };
      ref.nest = next;
      ref = next;
    }
    const out = safe(deep) as Record<string, unknown>;
    // Segue descendo até encontrar o marcador de profundidade.
    let cur: Record<string, unknown> = out;
    let viuMarcador = false;
    for (let i = 0; i < 10 && cur; i++) {
      if ("[redacted]" in cur) {
        viuMarcador = true;
        break;
      }
      cur = cur.nest as Record<string, unknown>;
    }
    expect(viuMarcador).toBe(true);
  });

  it("não compartilha referência com o body original (não muta input)", () => {
    const body = { senha: "a", nome: "B" };
    safe(body);
    expect(body.senha).toBe("a");
  });
});
