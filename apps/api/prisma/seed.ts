import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const unidade = await prisma.unidade.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      nome: "Matriz",
      endereco: "Sede — Midrah",
    },
  });

  const setor = await prisma.setor.upsert({
    where: { unidade_id_nome: { unidade_id: unidade.id, nome: "TI" } },
    update: {},
    create: {
      nome: "TI",
      unidade_id: unidade.id,
    },
  });

  const cargo = await prisma.cargo.upsert({
    where: { nome: "Administrador" },
    update: {},
    create: {
      nome: "Administrador",
      descricao: "Perfil administrativo do sistema",
    },
  });

  await prisma.colaborador.upsert({
    where: { email: "admin@midrah.com.br" },
    update: {},
    create: {
      matricula: "0001",
      nome: "Administrador",
      email: "admin@midrah.com.br",
      cpf: "000.000.000-00",
      perfil: "admin",
      cargo_id: cargo.id,
      setor_id: setor.id,
      unidade_id: unidade.id,
    },
  });

  console.log("Seed executado com sucesso.");
  console.log(
    "Próximo passo: crie no Supabase Auth um usuário com o email admin@midrah.com.br " +
      "(mesmo email do colaborador). No primeiro login, POST /auth/sync vincula o auth_user_id automaticamente.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
