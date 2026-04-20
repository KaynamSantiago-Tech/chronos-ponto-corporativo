# Lifecycle de evidências (selfies)

Plano operacional para controlar custos e LGPD do bucket `evidencias` no Supabase Storage. **Status:** esboço — não implementado. Decisão de infra pendente.

## Contexto

- Cada marcação gera ~40 KB (JPEG 640×480 @ 0.7).
- Com 1.000 colaboradores × 4 marcações/dia × 22 dias úteis = **~88k objetos/mês** (~3,5 GB/mês).
- Em 12 meses sem limpeza: ~42 GB e ~1 M objetos.
- Supabase Storage cobra por GB armazenado + banda de egress quando a URL assinada é lida.

## Decisões de retenção

| Janela | Estado | Justificativa |
|---|---|---|
| **0–90 dias** | bucket `evidencias` (quente) | auditoria ativa, disputa trabalhista imediata, consulta no painel |
| **91–365 dias** | bucket `evidencias-cold` (frio, menor acesso) | prazo de contestação CLT estendido; ainda recuperável em minutos |
| **> 365 dias** | removido OU exportado p/ S3 Glacier | prazo legal atendido; LGPD pede minimização |

> Antes de ligar o job, RH/Jurídico precisa **confirmar** a janela de 365 dias. O padrão legal brasileiro para registro de ponto é 5 anos (art. 7º Port. 671/2021 MTP), mas a **selfie** é evidência acessória, não o registro em si — a linha em `marcacoes` fica preservada para sempre (soft delete). O que o job apaga é o binário.

## Contrato do job

**Nome:** `evidencias-lifecycle`
**Frequência sugerida:** diário às 03:00 America/Sao_Paulo (menor tráfego)
**Idempotente:** sim — reprocessar não duplica nem apaga além do necessário.
**Dry-run:** default em ambientes fora de produção; precisa de flag `--apply` em prod.

### Entrada

```ts
interface JobInput {
  modo: "dry-run" | "apply";
  janela_quente_dias: number;   // default 90
  janela_total_dias: number;    // default 365
}
```

### Passos

1. **Selecionar candidatos a frio** — `marcacoes` com `created_at` entre `hoje - janela_total_dias` e `hoje - janela_quente_dias` cujo `evidencia_url` aponta para `evidencias/...`.
2. **Para cada path:** `storage.move(evidencias → evidencias-cold)` e atualiza `evidencia_url` no Postgres em uma transação (Prisma `$transaction`) — se o move falha, o path antigo permanece íntegro.
3. **Selecionar candidatos a expurgo** — `marcacoes` com `created_at < hoje - janela_total_dias` cujo `evidencia_url` aponta para `evidencias-cold/...`.
4. **Expurgar** — `storage.remove()` + `evidencia_url = null` na marcação (mantém a linha). Loga em `logs_auditoria` com `acao = "evidencia.expurgo"`, `payload = { path, dias_retidos }`.
5. **Relatório final** — conta movidos/expurgados/erros, emite no Sentry como breadcrumb informativo e no log estruturado.

### Garantias

- **Nunca apaga a linha `marcacoes`.** Só o arquivo físico. Auditoria preservada.
- **Nunca apaga arquivos referenciados por mais de uma marcação** — hoje o upload gera UUID por evidência, então não há dedup; se no futuro houver, o job precisa conferir refcount.
- **Falha de rede** — o job precisa ser retry-safe: se `storage.move` sucede mas o update do DB falha, o próximo run detecta a inconsistência (arquivo em `-cold` mas url aponta para `evidencias`) e corrige.

## Implementação recomendada

**Opção A — Supabase Scheduled Function (edge function com cron)**
- Rodando em `sa-east-1`, zero egress para atingir o Postgres.
- Limite de 2 minutos por execução → processar em lotes de 500 com checkpoint em tabela `jobs_controle`.

**Opção B — Job NestJS com `@nestjs/schedule`**
- Rodando na instância da api Railway.
- Mais fácil de observar (mesmos logs pino/Sentry).
- Custa RAM no container 24/7.

**Recomendação:** A (edge function) quando o volume passar de ~200k objetos; até lá, B basta. Começar com B evita nova stack.

## Checklist antes de ligar

- [ ] RH/Jurídico confirma janelas (90d quente, 365d total).
- [ ] Bucket `evidencias-cold` criado (Private, mesma policy RLS do `evidencias`).
- [ ] Rodar o job 1 semana em `dry-run`, auditar o relatório.
- [ ] Monitorar primeiro expurgo real (ativar alerta Sentry para `acao = "evidencia.expurgo"` com volume anômalo).
- [ ] Atualizar README e política de privacidade da Midrah (LGPD exige divulgar retenção).

## Alternativa manual (ponte até o job)

Se o volume chegar a ~50 GB antes do job existir: `gsutil rsync` ou `aws s3 sync` do bucket Supabase para S3 Glacier via chave service_role + `pg_dump` da tabela `marcacoes` no mesmo dia, arquivando tudo como snapshot de auditoria. Não deletar do Supabase até confirmar Glacier.
