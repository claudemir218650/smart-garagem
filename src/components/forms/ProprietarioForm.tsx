import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { TipoPessoa } from "@/types";
import { api, ApiError } from "@/lib/api";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const onlyDigits = (v: string) => v.replace(/\D/g, "");

function isValidCPF(value: string): boolean {
  const c = onlyDigits(value);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const calc = (slice: number) => {
    let sum = 0;
    for (let i = 0; i < slice; i++) sum += Number(c[i]) * (slice + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
}

function isValidCNPJ(value: string): boolean {
  const c = onlyDigits(value);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (len: number) => {
    const weights = len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(c[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}
const maskCPF = (v: string) => onlyDigits(v).slice(0, 11)
  .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskCNPJ = (v: string) => onlyDigits(v).slice(0, 14)
  .replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
const maskCEP = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
const maskTelefone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
};

const enderecoSchema = z.object({
  cep: z.string().refine((v) => onlyDigits(v).length === 8, "CEP inválido"),
  logradouro: z.string().trim().min(1, "Informe o logradouro").max(120),
  numero: z.string().trim().min(1, "Informe o número").max(10),
  bairro: z.string().trim().min(1, "Informe o bairro").max(80),
  cidade: z.string().trim().min(1, "Informe a cidade").max(80),
  uf: z.string().length(2, "UF inválida"),
});

const baseSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  telefone: z.string().refine((v) => !v || onlyDigits(v).length >= 10, "Telefone inválido").optional().or(z.literal("")),
  endereco: enderecoSchema,
});

const pfSchema = baseSchema.extend({
  tipoPessoa: z.literal("PF"),
  nomeCompleto: z.string().trim().min(3, "Informe o nome completo").max(120),
  cpf: z.string().refine(isValidCPF, "CPF inválido"),
  dataNascimento: z.string().min(1, "Informe a data de nascimento").refine((v) => {
    const d = new Date(v); return !isNaN(d.getTime()) && d <= new Date();
  }, "Data inválida"),
});

const pjSchema = baseSchema.extend({
  tipoPessoa: z.literal("PJ"),
  razaoSocial: z.string().trim().min(2, "Informe a razão social").max(150),
  nomeFantasia: z.string().trim().max(150).optional().or(z.literal("")),
  cnpj: z.string().refine(isValidCNPJ, "CNPJ inválido"),
});

const schema = z.discriminatedUnion("tipoPessoa", [pfSchema, pjSchema]);
type FormValues = z.infer<typeof schema>;

const defaultEndereco = { cep: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "" };

export function ProprietarioForm({ defaultEmail, defaultNome }: { defaultEmail?: string; defaultNome?: string }) {
  const [tipo, setTipo] = useState<TipoPessoa>("PF");
  const [cepLoading, setCepLoading] = useState(false);
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipoPessoa: "PF",
      nomeCompleto: defaultNome ?? "",
      cpf: "",
      dataNascimento: "",
      email: defaultEmail ?? "",
      telefone: "",
      endereco: defaultEndereco,
    } as FormValues,
  });

  const createMut = useMutation({
    mutationFn: (values: FormValues) => api.createProprietario(values as any),
    onSuccess: () => {
      toast.success("Proprietário cadastrado");
      qc.invalidateQueries({ queryKey: ["proprietarios"] });
      setTipo("PF");
      form.reset({
        tipoPessoa: "PF", nomeCompleto: "", cpf: "", dataNascimento: "",
        email: "", telefone: "", endereco: defaultEndereco,
      } as FormValues);
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? `${e.message}${(e.payload as any)?.field ? ` (${(e.payload as any).field})` : ""}` : "Erro ao salvar";
      toast.error(msg);
    },
  });

  const handleTipoChange = (novo: TipoPessoa) => {
    setTipo(novo);
    const current = form.getValues();
    if (novo === "PF") {
      form.reset({
        tipoPessoa: "PF", nomeCompleto: "", cpf: "", dataNascimento: "",
        email: current.email ?? "", telefone: current.telefone ?? "",
        endereco: current.endereco ?? defaultEndereco,
      });
    } else {
      form.reset({
        tipoPessoa: "PJ", razaoSocial: "", nomeFantasia: "", cnpj: "",
        email: current.email ?? "", telefone: current.telefone ?? "",
        endereco: current.endereco ?? defaultEndereco,
      });
    }
  };

  const onSubmit = (values: FormValues) => createMut.mutate(values);

  const errors = form.formState.errors;

  const lookupCep = async (raw: string) => {
    const cep = onlyDigits(raw);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data?.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      const opts = { shouldValidate: true, shouldDirty: true, shouldTouch: true } as const;
      form.setValue("endereco.logradouro", data.logradouro ?? "", opts);
      form.setValue("endereco.bairro", data.bairro ?? "", opts);
      form.setValue("endereco.cidade", data.localidade ?? "", opts);
      form.setValue("endereco.uf", String(data.uf ?? "").toUpperCase(), opts);
    } catch {
      toast.error("Falha ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <Tabs value={tipo} onValueChange={(v) => handleTipoChange(v as TipoPessoa)}>
      <TabsList className="mb-6">
        <TabsTrigger value="PF">Pessoa Física</TabsTrigger>
        <TabsTrigger value="PJ">Pessoa Jurídica</TabsTrigger>
      </TabsList>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <TabsContent value="PF" className="space-y-4 mt-0">
          <div>
            <Label htmlFor="nomeCompleto">Nome completo *</Label>
            <Input id="nomeCompleto" maxLength={120} {...form.register("nomeCompleto" as const)} />
            {"nomeCompleto" in errors && errors.nomeCompleto && (
              <p className="text-sm text-destructive mt-1">{errors.nomeCompleto.message as string}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={(form.watch("cpf" as const) as string) ?? ""}
                onChange={(e) => {
                  form.setValue("cpf" as const, maskCPF(e.target.value), { shouldValidate: false });
                  if ("cpf" in errors) form.clearErrors("cpf" as const);
                }}
                onBlur={() => form.trigger("cpf" as const)}
              />
              {"cpf" in errors && errors.cpf && (
                <p className="text-sm text-destructive mt-1">{errors.cpf.message as string}</p>
              )}
            </div>
            <div>
              <Label htmlFor="dataNascimento">Data de nascimento *</Label>
              <Input id="dataNascimento" type="date" {...form.register("dataNascimento" as const)} />
              {"dataNascimento" in errors && errors.dataNascimento && (
                <p className="text-sm text-destructive mt-1">{errors.dataNascimento.message as string}</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="PJ" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="razaoSocial">Razão social *</Label>
              <Input id="razaoSocial" maxLength={150} {...form.register("razaoSocial" as const)} />
              {"razaoSocial" in errors && errors.razaoSocial && (
                <p className="text-sm text-destructive mt-1">{errors.razaoSocial.message as string}</p>
              )}
            </div>
            <div>
              <Label htmlFor="nomeFantasia">Nome fantasia</Label>
              <Input id="nomeFantasia" maxLength={150} {...form.register("nomeFantasia" as const)} />
            </div>
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={(form.watch("cnpj" as const) as string) ?? ""}
              onChange={(e) => {
                form.setValue("cnpj" as const, maskCNPJ(e.target.value), { shouldValidate: false });
                if ("cnpj" in errors) form.clearErrors("cnpj" as const);
              }}
              onBlur={() => form.trigger("cnpj" as const)}
            />
            {"cnpj" in errors && errors.cnpj && (
              <p className="text-sm text-destructive mt-1">{errors.cnpj.message as string}</p>
            )}
          </div>
        </TabsContent>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="md:pt-4">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" maxLength={255} {...form.register("email")} />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div className="md:pt-4">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              placeholder="(00) 00000-0000"
              value={form.watch("telefone") ?? ""}
              onChange={(e) => form.setValue("telefone", maskTelefone(e.target.value), { shouldValidate: true })}
            />
            {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone.message}</p>}
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <h3 className="font-medium">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={form.watch("endereco.cep") ?? ""}
                onChange={(e) => form.setValue("endereco.cep", maskCEP(e.target.value), { shouldValidate: false })}
                onBlur={(e) => lookupCep(e.target.value)}
                disabled={cepLoading}
              />
              {cepLoading && <p className="text-xs text-muted-foreground mt-1">Buscando endereço…</p>}
              {!cepLoading && errors.endereco?.cep && <p className="text-sm text-destructive mt-1">{errors.endereco.cep.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="logradouro">Logradouro *</Label>
              <Input id="logradouro" maxLength={120} {...form.register("endereco.logradouro")} />
              {errors.endereco?.logradouro && <p className="text-sm text-destructive mt-1">{errors.endereco.logradouro.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="numero">Número *</Label>
              <Input id="numero" maxLength={10} {...form.register("endereco.numero")} />
              {errors.endereco?.numero && <p className="text-sm text-destructive mt-1">{errors.endereco.numero.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bairro">Bairro *</Label>
              <Input id="bairro" maxLength={80} {...form.register("endereco.bairro")} />
              {errors.endereco?.bairro && <p className="text-sm text-destructive mt-1">{errors.endereco.bairro.message}</p>}
            </div>
            <div>
              <Label htmlFor="cidade">Cidade *</Label>
              <Input id="cidade" maxLength={80} {...form.register("endereco.cidade")} />
              {errors.endereco?.cidade && <p className="text-sm text-destructive mt-1">{errors.endereco.cidade.message}</p>}
            </div>
            <div>
              <Label>UF *</Label>
              <Select
                value={form.watch("endereco.uf") ?? ""}
                onValueChange={(v) => form.setValue("endereco.uf", v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.endereco?.uf && <p className="text-sm text-destructive mt-1">{errors.endereco.uf.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Salvando..." : "Salvar proprietário"}</Button>
        </div>
      </form>
    </Tabs>
  );
}