"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Colaborador } from "@midrah/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
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

const PERFIS = ["admin", "rh", "gestor", "colaborador"] as const;
const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

const schema = z.object({
  matricula: z.string().trim().min(1, "Obrigatório").max(20),
  nome: z.string().trim().min(3, "Mínimo 3 caracteres").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  cpf: z.string().trim().regex(cpfRegex, "CPF inválido (use 000.000.000-00)"),
  telefone: z.string().trim().max(20).optional().or(z.literal("")),
  perfil: z.enum(PERFIS),
  cargo_id: z.string().uuid("Selecione um cargo"),
  setor_id: z.string().uuid("Selecione um setor"),
  unidade_id: z.string().uuid("Selecione uma unidade"),
  ativo: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Option {
  id: string;
  nome: string;
  ativo: boolean;
}

interface SetorOption extends Option {
  unidade_id: string;
}

interface ColaboradorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador?: Colaborador | null;
}

export function ColaboradorFormDialog({
  open,
  onOpenChange,
  colaborador,
}: ColaboradorFormDialogProps) {
  const isEdit = Boolean(colaborador);
  const qc = useQueryClient();
  const toast = useToast();

  const cargosQuery = useQuery({
    queryKey: ["cargos", "options"],
    queryFn: () =>
      apiFetch<{ items: Option[] }>("/cargos", { query: { page: 1, page_size: 200 } }),
    enabled: open,
  });

  const unidadesQuery = useQuery({
    queryKey: ["unidades", "options"],
    queryFn: () =>
      apiFetch<{ items: Option[] }>("/unidades", { query: { page: 1, page_size: 200 } }),
    enabled: open,
  });

  const setoresQuery = useQuery({
    queryKey: ["setores", "options"],
    queryFn: () =>
      apiFetch<{ items: SetorOption[] }>("/setores", {
        query: { page: 1, page_size: 500 },
      }),
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      matricula: "",
      nome: "",
      email: "",
      cpf: "",
      telefone: "",
      perfil: "colaborador",
      cargo_id: "",
      setor_id: "",
      unidade_id: "",
      ativo: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      matricula: colaborador?.matricula ?? "",
      nome: colaborador?.nome ?? "",
      email: colaborador?.email ?? "",
      cpf: colaborador?.cpf ?? "",
      telefone: colaborador?.telefone ?? "",
      perfil: (colaborador?.perfil ?? "colaborador") as FormValues["perfil"],
      cargo_id: colaborador?.cargo_id ?? "",
      setor_id: colaborador?.setor_id ?? "",
      unidade_id: colaborador?.unidade_id ?? "",
      ativo: colaborador?.ativo ?? true,
    });
  }, [open, colaborador, form]);

  const unidadeSelecionada = form.watch("unidade_id");

  const setoresFiltrados = useMemo(() => {
    const all = setoresQuery.data?.items ?? [];
    if (!unidadeSelecionada) return all.filter((s) => s.ativo);
    return all.filter(
      (s) => s.unidade_id === unidadeSelecionada && (s.ativo || s.id === colaborador?.setor_id),
    );
  }, [setoresQuery.data, unidadeSelecionada, colaborador?.setor_id]);

  useEffect(() => {
    const setorAtual = form.getValues("setor_id");
    if (!setorAtual) return;
    const aindaValido = setoresFiltrados.some((s) => s.id === setorAtual);
    if (!aindaValido) form.setValue("setor_id", "");
  }, [setoresFiltrados, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        matricula: values.matricula,
        nome: values.nome,
        email: values.email,
        cpf: values.cpf,
        telefone: values.telefone ? values.telefone : undefined,
        perfil: values.perfil,
        cargo_id: values.cargo_id,
        setor_id: values.setor_id,
        unidade_id: values.unidade_id,
        ...(isEdit ? { ativo: values.ativo } : {}),
      };
      return apiFetch<Colaborador>(
        isEdit ? `/colaboradores/${colaborador!.id}` : "/colaboradores",
        { method: isEdit ? "PATCH" : "POST", body },
      );
    },
    onSuccess: () => {
      toast.success(
        isEdit ? "Colaborador atualizado" : "Colaborador criado",
        isEdit ? undefined : "Convite enviado por email.",
      );
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiRequestError
          ? err.code === "CONFLITO"
            ? "Matrícula, email ou CPF já cadastrado."
            : err.message
          : "Erro desconhecido";
      toast.error("Falha ao salvar colaborador", msg);
    },
  });

  const carregando =
    cargosQuery.isLoading || unidadesQuery.isLoading || setoresQuery.isLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Editar colaborador" : "Novo colaborador"}
      description={
        isEdit
          ? "Atualize os dados do colaborador."
          : "Cadastre um novo colaborador. Um convite será enviado por email."
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
            disabled={mutation.isPending || carregando}
          >
            {mutation.isPending ? "Salvando…" : isEdit ? "Salvar" : "Criar e convidar"}
          </Button>
        </>
      }
    >
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <FormField
          label="Matrícula"
          htmlFor="col-matricula"
          required
          error={form.formState.errors.matricula?.message}
        >
          <Input id="col-matricula" {...form.register("matricula")} />
        </FormField>

        <FormField
          label="Nome completo"
          htmlFor="col-nome"
          required
          className="sm:col-span-1"
          error={form.formState.errors.nome?.message}
        >
          <Input id="col-nome" {...form.register("nome")} />
        </FormField>

        <FormField
          label="Email"
          htmlFor="col-email"
          required
          error={form.formState.errors.email?.message}
        >
          <Input
            id="col-email"
            type="email"
            autoComplete="off"
            {...form.register("email")}
            disabled={isEdit}
          />
        </FormField>

        <FormField
          label="CPF"
          htmlFor="col-cpf"
          required
          hint="Formato: 000.000.000-00"
          error={form.formState.errors.cpf?.message}
        >
          <Input id="col-cpf" {...form.register("cpf")} />
        </FormField>

        <FormField
          label="Telefone"
          htmlFor="col-telefone"
          error={form.formState.errors.telefone?.message}
        >
          <Input id="col-telefone" placeholder="(11) 91234-5678" {...form.register("telefone")} />
        </FormField>

        <FormField
          label="Perfil"
          htmlFor="col-perfil"
          required
          error={form.formState.errors.perfil?.message}
        >
          <Select id="col-perfil" {...form.register("perfil")}>
            <option value="colaborador">Colaborador</option>
            <option value="gestor">Gestor</option>
            <option value="rh">RH</option>
            <option value="admin">Administrador</option>
          </Select>
        </FormField>

        <FormField
          label="Cargo"
          htmlFor="col-cargo"
          required
          error={form.formState.errors.cargo_id?.message}
        >
          <Select id="col-cargo" {...form.register("cargo_id")}>
            <option value="">Selecione um cargo</option>
            {(cargosQuery.data?.items ?? [])
              .filter((c) => c.ativo || c.id === colaborador?.cargo_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
          </Select>
        </FormField>

        <FormField
          label="Unidade"
          htmlFor="col-unidade"
          required
          error={form.formState.errors.unidade_id?.message}
        >
          <Select id="col-unidade" {...form.register("unidade_id")}>
            <option value="">Selecione uma unidade</option>
            {(unidadesQuery.data?.items ?? [])
              .filter((u) => u.ativo || u.id === colaborador?.unidade_id)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
          </Select>
        </FormField>

        <FormField
          label="Setor"
          htmlFor="col-setor"
          required
          hint={
            unidadeSelecionada
              ? setoresFiltrados.length === 0
                ? "Nenhum setor ativo nesta unidade."
                : undefined
              : "Selecione uma unidade primeiro."
          }
          error={form.formState.errors.setor_id?.message}
          className="sm:col-span-2"
        >
          <Select
            id="col-setor"
            disabled={!unidadeSelecionada}
            {...form.register("setor_id")}
          >
            <option value="">Selecione um setor</option>
            {setoresFiltrados.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </Select>
        </FormField>

        {isEdit ? (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
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
