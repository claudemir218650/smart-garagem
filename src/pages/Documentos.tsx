import { Upload, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function Documentos() {
  return (
    <>
      <PageHeader title="Documentos" subtitle="CRLV, comprovantes e demais arquivos" />
      <div className="mb-6 rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
        <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
        <div className="text-sm font-medium">Arraste arquivos aqui</div>
        <div className="text-xs text-muted-foreground">ou clique para selecionar PDFs e imagens</div>
      </div>
      <EmptyState icon={FolderOpen} title="Sem documentos ainda"
        description="Faça upload do seu primeiro CRLV ou comprovante."
        action={<Button><Upload className="mr-1.5 size-4" /> Enviar arquivo</Button>} />
    </>
  );
}