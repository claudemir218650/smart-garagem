import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { ProprietarioCombobox } from "@/components/ProprietarioCombobox";

const onlyAlnum = (v: string) => v.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
const maskPlaca = (v: string) => onlyAlnum(v).slice(0, 7).replace(/^([A-Z]{0,3})(\d?[A-Z0-9]?\d{0,2})$/i, (_, a, b) => b ? `${a}-${b}` : a);

const COMBUSTIVEIS = ["Flex", "Gasolina", "Etanol", "Diesel", "GNV", "Híbrido", "Elétrico"];

const TIPOS = ["Carro", "Motocicleta", "Motoneta", "Camionete", "Utilitário", "Caminhão", "Ônibus", "Outro"];

export const MARCAS = [
  "Audi","BMW","BYD","Chery","Chevrolet","Citroën","Dodge","Fiat","Ford","Honda",
  "Hyundai","Iveco","Jaguar","Jeep","Kia","Land Rover","Mercedes-Benz","Mitsubishi",
  "Nissan","Peugeot","Porsche","Renault","Subaru","Suzuki","Toyota","Volkswagen","Volvo","Outra",
];

const yearMax = new Date().getFullYear() + 1;
const anoSchema = z.coerce.number().int().min(1900, "Ano inválido").max(yearMax, "Ano inválido");

const schema = z.object({
  placa: z.string().refine((v) => /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/.test(v.replace("-", "")), "Placa inválida"),
  marca: z.string().trim().min(1, "Selecione a marca").max(40),
  modelo: z.string().trim().min(1, "Informe o modelo").max(60),
  tipo: z.string().min(1, "Selecione o tipo"),
  anoFabricacao: anoSchema,
  anoModelo: anoSchema,
  cor: z.string().trim().min(1, "Informe a cor").max(30),
  combustivel: z.string().min(1, "Selecione o combustível"),
  chassi: z.string().trim().length(17, "Chassi deve ter 17 caracteres"),
  renavam: z.string().refine((v) => /^\d{9,11}$/.test(v), "RENAVAM inválido"),
  proprietario: z.string().trim().min(2, "Selecione o proprietário").max(120),
}).refine((d) => d.anoModelo >= d.anoFabricacao, {
  message: "Ano modelo deve ser ≥ ano fabricação",
  path: ["anoModelo"],
});

type FormValues = z.infer<typeof schema>;

export function VeiculoForm() {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      placa: "", marca: "", modelo: "", tipo: "",
      anoFabricacao: new Date().getFullYear(), anoModelo: new Date().getFullYear(),
      cor: "", combustivel: "", chassi: "", renavam: "", proprietario: "",
    },
  });

  const m = useMutation({
    mutationFn: (values: FormValues) => api.createVeiculo({
      ...values,
      placa: values.placa.replace("-", ""),
    }),
    onSuccess: (v) => {
      toast.success(`Veículo ${v.placa} cadastrado`);
      qc.invalidateQueries({ queryKey: ["veiculos"] });
      form.reset();
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? `${e.message}${(e.payload as any)?.field ? ` (${(e.payload as any).field})` : ""}` : "Erro ao salvar";
      toast.error(msg);
    },
  });

  const { register, formState: { errors }, watch, setValue } = form;

  return (
    <form onSubmit={form.handleSubmit((v) => m.mutate(v))} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="placa">Placa *</Label>
          <Input
            id="placa"
            placeholder="ABC-1D23"
            value={watch("placa") ?? ""}
            onChange={(e) => setValue("placa", maskPlaca(e.target.value), { shouldValidate: true })}
          />
          {errors.placa && <p className="text-sm text-destructive mt-1">{errors.placa.message}</p>}
        </div>
        <div>
          <Label>Tipo *</Label>
          <Select
            value={watch("tipo") ?? ""}
            onValueChange={(v) => setValue("tipo", v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.tipo && <p className="text-sm text-destructive mt-1">{errors.tipo.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="anoFabricacao">Ano fabricação *</Label>
          <Input id="anoFabricacao" type="number" min={1900} max={yearMax} {...register("anoFabricacao")} />
          {errors.anoFabricacao && <p className="text-sm text-destructive mt-1">{errors.anoFabricacao.message}</p>}
        </div>
        <div>
          <Label htmlFor="anoModelo">Ano modelo *</Label>
          <Input id="anoModelo" type="number" min={1900} max={yearMax} {...register("anoModelo")} />
          {errors.anoModelo && <p className="text-sm text-destructive mt-1">{errors.anoModelo.message}</p>}
        </div>
        <div>
          <Label htmlFor="cor">Cor *</Label>
          <Input id="cor" maxLength={30} {...register("cor")} />
          {errors.cor && <p className="text-sm text-destructive mt-1">{errors.cor.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Marca *</Label>
          <Select
            value={watch("marca") ?? ""}
            onValueChange={(v) => setValue("marca", v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
            <SelectContent>
              {MARCAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.marca && <p className="text-sm text-destructive mt-1">{errors.marca.message}</p>}
        </div>
        <div>
          <Label htmlFor="modelo">Modelo *</Label>
          <Input id="modelo" maxLength={60} {...register("modelo")} />
          {errors.modelo && <p className="text-sm text-destructive mt-1">{errors.modelo.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="proprietario">Proprietário *</Label>
          <ProprietarioCombobox
            value={watch("proprietario") ?? ""}
            onChange={(v) => setValue("proprietario", v, { shouldValidate: true })}
            error={errors.proprietario?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Combustível *</Label>
          <Select
            value={watch("combustivel") ?? ""}
            onValueChange={(v) => setValue("combustivel", v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {COMBUSTIVEIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.combustivel && <p className="text-sm text-destructive mt-1">{errors.combustivel.message}</p>}
        </div>
        <div>
          <Label htmlFor="chassi">Chassi *</Label>
          <Input
            id="chassi"
            maxLength={17}
            placeholder="17 caracteres"
            value={watch("chassi") ?? ""}
            onChange={(e) => setValue("chassi", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17), { shouldValidate: true })}
          />
          {errors.chassi && <p className="text-sm text-destructive mt-1">{errors.chassi.message}</p>}
        </div>
        <div>
          <Label htmlFor="renavam">RENAVAM *</Label>
          <Input
            id="renavam"
            maxLength={11}
            value={watch("renavam") ?? ""}
            onChange={(e) => setValue("renavam", e.target.value.replace(/\D/g, "").slice(0, 11), { shouldValidate: true })}
          />
          {errors.renavam && <p className="text-sm text-destructive mt-1">{errors.renavam.message}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button type="submit" disabled={m.isPending}>{m.isPending ? "Salvando..." : "Cadastrar veículo"}</Button>
      </div>
    </form>
  );
}
