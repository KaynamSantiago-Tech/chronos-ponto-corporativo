import PontoRegistrar from "@/components/ponto-registrar";

export default function PontoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Registrar ponto</h1>
        <p className="text-sm text-muted-foreground">
          Câmera e localização são obrigatórias para registrar sua marcação.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <PontoRegistrar />
      </div>
    </div>
  );
}
