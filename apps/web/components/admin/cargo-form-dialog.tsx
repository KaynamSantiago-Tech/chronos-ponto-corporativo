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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { formatarErroApi } from "@/lib/api-errors";

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  descricao: z
    .string()
    .trim()
    .max(240, "Máximo 240 caracteres")
    .optional()
    .or(z.literal("")),
  ativo: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CargoRecord {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

interface CargoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cargo?: CargoRecord | null;
}

export function CargoFormDialog({ open, onOpenChange, cargo }: CargoFormDialogProps) {
  const isEdit = Boolean(cargo);
  const qc = useQueryClient();
  const toast = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", descricao: "", ativo: true },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      nome: cargo?.nome ?? "",
      descricao: cargo?.descricao ?? "",
      ativo: cargo?.ativo ?? true,
    });
  }, [open, cargo, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        nome: values.nome,
        descricao: values.descricao ? values.descricao : undefined,
        ...(isEdit ? { ativo: values.ativo } : {}),
      };
      return apiFetch<CargoRecord>(isEdit ? `/cargos/${cargo!.id}` : "/cargos", {
        method: isEdit ? "PATCH" : "POST",
        body,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Cargo atualizado" : "Cargo criado");
      qc.invalidateQueries({ queryKey: ["cargos"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiRequestError
          ? err.code === "CONFLITO"
            ? "Já existe um cargo com esse nome."
            : err.message
          : "Erro desconhecido";
      toast.error("Falha ao salvar cargo", msg);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar cargo" : "Novo cargo"}
      description={
        isEdit
          ? "Atualize as informações do cargo selecionado."
          : "Cadastre uma nova função atribuível a colaboradores."
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
          htmlFor="cargo-nome"
          required
          error={form.formState.errors.nome?.message}
        >
          <Input
            id="cargo-nome"
            placeholder="Ex.: Analista de RH"
            {...form.register("nome")}
          />
        </FormField>

        <FormField
          label="Descrição"
          htmlFor="cargo-descricao"
          hint="Opcional. Uma frase curta sobre a função."
          error={form.formState.errors.descricao?.message}
        >
          <Textarea
            id="cargo-descricao"
            rows={3}
            {...form.register("descricao")}
          />
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
