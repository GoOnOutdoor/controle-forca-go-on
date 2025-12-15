"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Atleta, Treinador } from "@/types";
import { AMBIENTE_OPTIONS, DIAS_TREINA_OPTIONS } from "@/types";
import { getPlanos } from "@/lib/planos-storage";

interface NovoAtletaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Atleta>) => void;
  treinadores: Treinador[];
}

export function NovoAtletaModal({
  open,
  onClose,
  onSave,
  treinadores,
}: NovoAtletaModalProps) {
  const [saving, setSaving] = useState(false);
  const [planos, setPlanos] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<Atleta>>({
    nome: "",
    professor_id: null,
    treinador_corrida_id: null,
    plano: "PRO",
    ambiente: "Academia",
    dias_treina: 3,
    bloco_mfit: "",
    pronto_ate: "",
    status: "aguardando_treino",
  });

  useEffect(() => {
    setPlanos(getPlanos());
  }, [open]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.nome?.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    setSaving(true);
    await onSave(formData);
    setSaving(false);
    setFormData({
      nome: "",
      professor_id: null,
      treinador_corrida_id: null,
      plano: "PRO",
      ambiente: "Academia",
      dias_treina: 3,
      bloco_mfit: "",
      pronto_ate: "",
      status: "aguardando_treino",
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      nome: "",
      professor_id: null,
      plano: "PRO",
      ambiente: "Academia",
      dias_treina: 3,
      bloco_mfit: "",
      pronto_ate: "",
      status: "aguardando_treino",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Atleta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome || ""}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Nome completo do atleta"
            />
          </div>

          <div>
            <Label>Professor</Label>
            <Select
              value={formData.professor_id || "none"}
              onValueChange={(v) =>
                handleChange("professor_id", v === "none" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem professor</SelectItem>
                {treinadores.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {treinadores.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Cadastre treinadores na aba Treinadores primeiro
              </p>
            )}
          </div>

          <div>
            <Label>Treinador Corrida</Label>
            <Select
              value={formData.treinador_corrida_id || "none"}
              onValueChange={(v) =>
                handleChange("treinador_corrida_id", v === "none" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um treinador de corrida" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem treinador</SelectItem>
                {treinadores.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Plano</Label>
              <Select
                value={formData.plano}
                onValueChange={(v) => handleChange("plano", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planos.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ambiente</Label>
              <Select
                value={formData.ambiente}
                onValueChange={(v) => handleChange("ambiente", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AMBIENTE_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Dias que treina</Label>
              <Select
                value={String(formData.dias_treina)}
                onValueChange={(v) => handleChange("dias_treina", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_TREINA_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pronto até</Label>
              <Input
                type="date"
                value={formData.pronto_ate || ""}
                onChange={(e) => handleChange("pronto_ate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Bloco Mfit</Label>
            <Input
              value={formData.bloco_mfit || ""}
              onChange={(e) => handleChange("bloco_mfit", e.target.value)}
              placeholder="Nome do bloco"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.nome?.trim()}>
            {saving ? "Salvando..." : "Criar Atleta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
