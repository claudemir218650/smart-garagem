import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProprietarioForm } from "@/components/forms/ProprietarioForm";
import { VeiculoForm } from "@/components/forms/VeiculoForm";
import { useAuth } from "@/contexts/AuthContext";

export default function Cadastros() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "veiculo" ? "veiculo" : "proprietario";
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title="Cadastros"
        subtitle="Cadastre o proprietário e os veículos da sua garagem"
      />

      <div className="max-w-4xl">
        <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
          <TabsList className="mb-6">
            <TabsTrigger value="proprietario">Proprietário</TabsTrigger>
            <TabsTrigger value="veiculo">Veículo</TabsTrigger>
          </TabsList>

          <TabsContent value="proprietario" className="mt-0">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-1">Cadastrar proprietário</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Pessoa física ou jurídica. Esses dados são usados em transferências e contratos.
              </p>
              <ProprietarioForm defaultEmail={user?.email} defaultNome={user?.nome} />
            </div>
          </TabsContent>

          <TabsContent value="veiculo" className="mt-0">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-1">Cadastrar veículo</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Informe os dados do CRLV-e do veículo.
              </p>
              <VeiculoForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}