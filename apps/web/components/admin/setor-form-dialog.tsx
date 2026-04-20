"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { formatarErroApi } from "@/lib/api-errors";

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  unidade_id: z.string().uuid("Selecione uma unidade"),
  ativo: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface SetorRecord {
  id: string;
  nome: string;
  unidade_id: string;
  ativo: boolean;
}

interface UnidadeOption {
  id: string;
  nome: string;
  ativo: boolean;
}

interface SetorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setor?: SetorRecord | null;
}

export function SetorFormDialog({ open, onOpenChange, setor }: SetorFormDialogProps) {
  const isEdit = Boolean(setor);
  const qc = useQueryClient();
  const toast = useToast();

  const unidadesQuery = useQuery({
    queryKey: ["unidades", "options"],
    queryFn: () =>
      apiFetch<{ items: UnidadeOption[] }>("/unidades", {
        query: { page: 1, page_size: 200 },
      }),
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", unidade_id: "", ativo: true },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      nome: setor?.nome ?? "",
      unidade_id: setor?.unidade_id ?? "",
      ativo: setor?.ativo ?? true,
    });
  }, [open, setor, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        nome: values.nome,
        unidade_id: values.unidade_id,
        ...(isEdit ? { ativo: values.ativo } : {}),
      };
      return apiFetch<SetorRecord>(isEdit ? `/setores/${setor!.id}` : "/setores", {
        method: isEdit ? "PATCH" : "POST",
        body,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Setor atualizado" : "Setor criado");
      qc.invalidateQueries({ queryKey: ["setores"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiRequestError ? err.message : "Erro desconhecido";
      toast.error("Falha ao salvar setor", msg);
    },
  });

  const unidadesAtivas = (unidadesQuery.data?.items ?? []).filter(
    (u) => u.ativo || u.id === setor?.unidade_id,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar setor" : "Novo setor"}
      description={
        isEdit
          ? "Atualize o setor selecionado."
          : "Cadastre uma divisão dentro de uma unidade."
      }
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
            disabled={mutation.isPending || unidadesQuery.isLoading}
          >
            {mutation.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <FormField
          label="Nome"
          htmlFor="setor-nome"
          required
          error={form.formState.errors.nome?.message}
        >
          <Input
            id="setor-nome"
            placeholder="Ex.: Tecnologia da Informação"
            {...form.register("nome")}
          />
        </FormField>

        <FormField
          label="Unidade"
          htmlFor="setor-unidade"
          required
          hint={
            unidadesQuery.isLoading
              ? "Carregando unidades…"
              : unidadesAtivas.length === 0
                ? "Cadastre ao menos uma unidade antes."
                : undefined
          }
          error={form.formState.errors.unidade_id?.message}
        >
          <Select id="setor-unidade" {...form.register("unidade_id")}>
            <option value="">Selecione uma unidade</option>
            {unidadesAtivas.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </Select>
        </FormField>

        {isEdit ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              {...form.register("ativo")}
            />
            Ativo
          </label>
        ) : null}

        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Dialog>
  );
}
