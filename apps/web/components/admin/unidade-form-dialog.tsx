"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch, ApiRequestError } from "@/lib/api";

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  endereco: z.string().trim().max(200).optional().or(z.literal("")),
  ativo: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface UnidadeRecord {
  id: string;
  nome: string;
  endereco: string | null;
  ativo: boolean;
}

interface UnidadeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade?: UnidadeRecord | null;
}

export function UnidadeFormDialog({ open, onOpenChange, unidade }: UnidadeFormDialogProps) {
  const isEdit = Boolean(unidade);
  const qc = useQueryClient();
  const toast = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", endereco: "", ativo: true },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      nome: unidade?.nome ?? "",
      endereco: unidade?.endereco ?? "",
      ativo: unidade?.ativo ?? true,
    });
  }, [open, unidade, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        nome: values.nome,
        endereco: values.endereco ? values.endereco : undefined,
        ...(isEdit ? { ativo: values.ativo } : {}),
      };
      return apiFetch<UnidadeRecord>(
        isEdit ? `/unidades/${unidade!.id}` : "/unidades",
        { method: isEdit ? "PATCH" : "POST", body },
      );
    },
    onSuccess: () => {
      toast.success(isEdit ? "Unidade atualizada" : "Unidade criada");
      qc.invalidateQueries({ queryKey: ["unidades"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiRequestError ? err.message : "Erro desconhecido";
      toast.error("Falha ao salvar unidade", msg);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar unidade" : "Nova unidade"}
      description={
        isEdit
          ? "Atualize os dados da unidade selecionada."
          : "Cadastre uma filial ou localização da empresa."
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
            disabled={mutation.isPending}
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
          htmlFor="unidade-nome"
          required
          error={form.formState.errors.nome?.message}
        >
          <Input
            id="unidade-nome"
            placeholder="Ex.: Matriz São Paulo"
            {...form.register("nome")}
          />
        </FormField>

        <FormField
          label="Endereço"
          htmlFor="unidade-endereco"
          hint="Opcional. Rua, número, cidade."
          error={form.formState.errors.endereco?.message}
        >
          <Input
            id="unidade-endereco"
            placeholder="Av. Paulista, 1000 — São Paulo/SP"
            {...form.register("endereco")}
          />
        </FormField>

        {isEdit ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              {...form.register("ativo")}
            />
            Ativa
          </label>
        ) : null}

        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Dialog>
  );
}
