"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Colaborador, Paginated, TipoMarcacao } from "@midrah/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { apiFetch, ApiRequestError } from "@/lib/api";

const TIPOS: { value: TipoMarcacao; label: string }[] = [
  { value: "entrada", label: "Entrada" },
  { value: "pausa_inicio", label: "Início de pausa" },
  { value: "pausa_fim", label: "Retorno da pausa" },
  { value: "saida", label: "Saída" },
];

const schema = z.object({
  colaborador_id: z.string().uuid("Selecione um colaborador"),
  tipo: z.enum(["entrada", "saida", "pausa_inicio", "pausa_fim"]),
  registrada_em: z.string().optional(),
  observacao: z
    .string()
    .trim()
    .min(10, "Justificativa deve ter ao menos 10 caracteres")
    .max(500, "Máximo 500 caracteres"),
});

type FormValues = z.infer<typeof schema>;

interface MarcacaoManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarcacaoManualDialog({ open, onOpenChange }: MarcacaoManualDialogProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [busca, setBusca] = useState("");

  const colaboradoresQuery = useQuery({
    queryKey: ["colaboradores", "lookup", { ativo: true }],
    queryFn: () =>
      apiFetch<Paginated<Colaborador>>("/colaboradores", {
        query: { page: 1, page_size: 500, ativo: true },
      }),
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const colaboradores = colaboradoresQuery.data?.items ?? [];
  const filtrados = useMemo(() => {
    if (!busca.trim()) return colaboradores;
    const alvo = busca.trim().toLowerCase();
    return colaboradores.filter(
      (c) =>
        c.nome.toLowerCase().includes(alvo) ||
        c.matricula?.toLowerCase().includes(alvo) ||
        c.email.toLowerCase().includes(alvo),
    );
  }, [colaboradores, busca]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      colaborador_id: "",
      tipo: "entrada",
      registrada_em: "",
      observacao: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      colaborador_id: "",
      tipo: "entrada",
      registrada_em: "",
      observacao: "",
    });
    setBusca("");
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return apiFetch("/marcacoes/manual", {
        method: "POST",
        body: {
          colaborador_id: values.colaborador_id,
          tipo: values.tipo,
          registrada_em: values.registrada_em
            ? new Date(values.registrada_em).toISOString()
            : undefined,
          observacao: values.observacao,
        },
      });
    },
    onSuccess: () => {
      toast.success("Marcação registrada", "Origem: manual (auditada).");
      qc.invalidateQueries({ queryKey: ["admin-marcacoes"] });
      qc.invalidateQueries({ queryKey: ["admin-home"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiRequestError ? err.message : "Erro ao registrar marcação";
      toast.error("Falha ao registrar", msg);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Registro manual"
      description="Use quando o colaborador não conseguiu registrar pelo app (ex.: câmera ou GPS negados). Toda marcação manual fica auditada."
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit((v) => mutation.mutate(v))}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Registrando…" : "Registrar"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <FormField
          label="Buscar colaborador"
          htmlFor="manual-busca"
          hint="Filtra por nome, matrícula ou email."
        >
          <Input
            id="manual-busca"
            placeholder="Digite para filtrar…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </FormField>

        <FormField
          label="Colaborador"
          htmlFor="manual-colaborador"
          required
          error={form.formState.errors.colaborador_id?.message}
        >
          <Select id="manual-colaborador" {...form.register("colaborador_id")}>
            <option value="">— selecione —</option>
            {filtrados.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.matricula})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Tipo"
          htmlFor="manual-tipo"
          required
          error={form.formState.errors.tipo?.message}
        >
          <Select id="manual-tipo" {...form.register("tipo")}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Data e hora"
          htmlFor="manual-datetime"
          hint="Deixe em branco para usar o horário atual."
          error={form.formState.errors.registrada_em?.message}
        >
          <Input id="manual-datetime" type="datetime-local" {...form.register("registrada_em")} />
        </FormField>

        <FormField
          label="Justificativa"
          htmlFor="manual-observacao"
          required
          hint="Obrigatória. Ficará na trilha de auditoria."
          error={form.formState.errors.observacao?.message}
        >
          <Textarea
            id="manual-observacao"
            rows={3}
            placeholder="Ex.: Câmera do dispositivo quebrada, registrado presencialmente."
            {...form.register("observacao")}
          />
        </FormField>

        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Dialog>
  );
}
