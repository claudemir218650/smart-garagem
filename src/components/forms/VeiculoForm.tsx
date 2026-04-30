import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const onlyAlnum = (v: string) => v.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
const maskPlaca = (v: string) => onlyAlnum(v).slice(0, 7).replace(/^([A-Z]{0,3})(\d?[A-Z0-9]?\d{0,2})$/i, (_, a, b) => b ? `${a}-${b}` : a);

const COMBUSTIVEIS = ["Flex", "Gasolina", "Etanol", "Diesel", "GNV", "Híbrido", "Elétrico"];

const schema = z.object({
  placa: z.string().refine((v) => /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/.test(v.replace("-", "")), "Placa inválida"),
  marca: z.string().trim().min(1, "Informe a marca").max(40),
  modelo: z.string().trim().min(1, "Informe o modelo").max(60),
  ano: z.coerce.number().int().min(1900, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
  cor: z.string().trim().min(1, "Informe a cor").max(30),
  combustivel: z.string().min(1, "Selecione o combustível"),
  chassi: z.string().trim().length(17, "Chassi deve ter 17 caracteres"),
  renavam: z.string().refine((v) => /^\d{9,11}$/.test(v), "RENAVAM inválido"),
});

type FormValues = z.infer<typeof schema>;

const STORAGE_KEY = "garagem.veiculos";

export function VeiculoForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      placa: "", marca: "", modelo: "", ano: new Date().getFullYear(),
      cor: "", combustivel: "", chassi: "", renavam: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as FormValues[]) : [];
    list.push(values);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    toast.success(`Veículo ${values.placa} cadastrado`);
    form.reset();
  };

  const { register, formState: { errors }, watch, setValue } = form;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Label htmlFor="ano">Ano *</Label>
          <Input id="ano" type="number" min={1900} max={new Date().getFullYear() + 1} {...register("ano")} />
          {errors.ano && <p className="text-sm text-destructive mt-1">{errors.ano.message}</p>}
        </div>
        <div>
          <Label htmlFor="cor">Cor *</Label>
          <Input id="cor" maxLength={30} {...register("cor")} />
          {errors.cor && <p className="text-sm text-destructive mt-1">{errors.cor.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="marca">Marca *</Label>
          <Input id="marca" maxLength={40} {...register("marca")} />
          {errors.marca && <p className="text-sm text-destructive mt-1">{errors.marca.message}</p>}
        </div>
        <div>
          <Label htmlFor="modelo">Modelo *</Label>
          <Input id="modelo" maxLength={60} {...register("modelo")} />
          {errors.modelo && <p className="text-sm text-destructive mt-1">{errors.modelo.message}</p>}
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
        <Button type="submit" disabled={form.formState.isSubmitting}>Cadastrar veículo</Button>
      </div>
    </form>
  );
}