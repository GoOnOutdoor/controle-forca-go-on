"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MessageSquare,
  Calendar,
  Target,
  User,
  FileText,
  Clock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AtletaComCalculos,
  Treinador,
  HandoffNote,
  LogConversa,
} from "@/types";
import {
  STATUS_OPTIONS,
  AMBIENTE_OPTIONS,
  DIAS_TREINA_OPTIONS,
  NIVEL_OPTIONS,
} from "@/types";
import { getPlanos } from "@/lib/planos-storage";

interface AtletaModalProps {
  atleta: AtletaComCalculos | null;
  treinadores: Treinador[];
  handoffNotes: HandoffNote[];
  logConversas: LogConversa[];
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<AtletaComCalculos>) => void;
  onAddHandoffNote: (conteudo: string) => void;
  onRegistrarConversa: () => void;
}

// Componente auxiliar para seções colapsáveis
function CollapsibleSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  badge,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="h-4 w-4" />
            {title}
            {badge}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 border rounded-b-lg border-t-0 -mt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AtletaModal({
  atleta,
  treinadores,
  handoffNotes,
  logConversas,
  open,
  onClose,
  onSave,
  onAddHandoffNote,
  onRegistrarConversa,
}: AtletaModalProps) {
  const [formData, setFormData] = useState<Partial<AtletaComCalculos>>({});
  const [novaHandoffNote, setNovaHandoffNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [planos, setPlanos] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basico: true,
    treino: true,
    prova: false,
    perfil: false,
    handoff: false,
    conversas: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (atleta) {
      setFormData(atleta);
    }
    setPlanos(getPlanos());
  }, [atleta]);

  if (!atleta) return null;

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const handleAddNote = () => {
    if (novaHandoffNote.trim()) {
      onAddHandoffNote(novaHandoffNote);
      setNovaHandoffNote("");
    }
  };

  const getTreinadorNome = (id: string) => {
    const t = treinadores.find((t) => t.id === id);
    return t?.nome || "Desconhecido";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{atleta.nome}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          {/* Dados básicos */}
          <CollapsibleSection
            title="Dados Básicos"
            icon={User}
            isOpen={openSections.basico}
            onToggle={() => toggleSection("basico")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Professor</Label>
                <Select
                  value={formData.professor_id || "none"}
                  onValueChange={(v) =>
                    handleChange("professor_id", v === "none" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
              </div>

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
            </div>
          </CollapsibleSection>

          {/* Treino atual */}
          <CollapsibleSection
            title="Treino Atual"
            icon={Calendar}
              isOpen={openSections.treino}
              onToggle={() => toggleSection("treino")}
              badge={
                <Badge
                  variant={
                  atleta.dias < 0
                    ? "destructive"
                    : atleta.dias <= 7
                      ? "warning"
                      : "success"
                }
                className="ml-2"
              >
                {atleta.dias} dias
              </Badge>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bloco Mfit</Label>
                <Input
                  value={formData.bloco_mfit || ""}
                  onChange={(e) => handleChange("bloco_mfit", e.target.value)}
                />
              </div>

              <div>
                <Label>Pronto até</Label>
                <Input
                  type="date"
                  value={
                    formData.pronto_ate
                      ? formData.pronto_ate.split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleChange("pronto_ate", e.target.value)}
                />
              </div>

              <div>
                <Label>Dias restantes</Label>
                <div className="h-10 flex items-center">
                  <Badge
                    variant={
                      atleta.dias < 0
                        ? "destructive"
                        : atleta.dias <= 7
                          ? "warning"
                          : "success"
                    }
                  >
                    {atleta.dias} dias
                  </Badge>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Prova alvo */}
          <CollapsibleSection
            title="Prova Alvo"
            icon={Target}
            isOpen={openSections.prova}
            onToggle={() => toggleSection("prova")}
            badge={
              atleta.prova_alvo ? (
                <Badge variant="outline" className="ml-2">
                  {atleta.prova_alvo}
                </Badge>
              ) : null
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nome da prova</Label>
                <Input
                  value={formData.prova_alvo || ""}
                  onChange={(e) => handleChange("prova_alvo", e.target.value)}
                  placeholder="Ex: UTMB 2025"
                />
              </div>

              <div>
                <Label>Data da prova</Label>
                <Input
                  type="date"
                  value={
                    formData.data_prova
                      ? formData.data_prova.split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleChange("data_prova", e.target.value)}
                />
              </div>

              <div>
                <Label>Tempo até a prova</Label>
                <div className="h-10 flex items-center text-sm">
                  {atleta.tempo_ate_prova || "Sem prova definida"}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Perfil do atleta */}
          <CollapsibleSection
            title="Perfil do Atleta"
            icon={FileText}
            isOpen={openSections.perfil}
            onToggle={() => toggleSection("perfil")}
          >
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nível de experiência</Label>
                  <Select
                    value={formData.nivel_experiencia}
                    onValueChange={(v) =>
                      handleChange("nivel_experiencia", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NIVEL_OPTIONS.map((n) => (
                        <SelectItem key={n.value} value={n.value}>
                          {n.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Equipamentos disponíveis</Label>
                  <Input
                    value={formData.equipamentos || ""}
                    onChange={(e) =>
                      handleChange("equipamentos", e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Lesões ativas</Label>
                <Textarea
                  value={formData.lesoes_ativas || ""}
                  onChange={(e) =>
                    handleChange("lesoes_ativas", e.target.value)
                  }
                  rows={2}
                />
              </div>

              <div>
                <Label>Limitações</Label>
                <Textarea
                  value={formData.limitacoes || ""}
                  onChange={(e) => handleChange("limitacoes", e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label>Perfil de comportamento</Label>
                <Textarea
                  value={formData.perfil_comportamento || ""}
                  onChange={(e) =>
                    handleChange("perfil_comportamento", e.target.value)
                  }
                  rows={2}
                />
              </div>

              <div>
                <Label>Objetivos</Label>
                <Textarea
                  value={formData.objetivos || ""}
                  onChange={(e) => handleChange("objetivos", e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label>Observação</Label>
                <Textarea
                  value={formData.observacao || ""}
                  onChange={(e) => handleChange("observacao", e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label>Notas do treinador</Label>
                <Textarea
                  value={formData.notas_treinador || ""}
                  onChange={(e) =>
                    handleChange("notas_treinador", e.target.value)
                  }
                  rows={2}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Handoff Notes */}
          <CollapsibleSection
            title="Handoff Notes"
            icon={FileText}
            isOpen={openSections.handoff}
            onToggle={() => toggleSection("handoff")}
            badge={
              handoffNotes.length > 0 ? (
                <Badge variant="secondary" className="ml-2">
                  {handoffNotes.length}
                </Badge>
              ) : null
            }
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  value={novaHandoffNote}
                  onChange={(e) => setNovaHandoffNote(e.target.value)}
                  placeholder="Adicionar nota de handoff..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleAddNote} disabled={!novaHandoffNote.trim()}>
                  Adicionar
                </Button>
              </div>

              {handoffNotes.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {handoffNotes
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-muted rounded-md text-sm"
                      >
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{getTreinadorNome(note.treinador_id)}</span>
                          <span>
                            {new Date(note.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p>{note.conteudo}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma nota de handoff registrada.
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* Log de conversas */}
          <CollapsibleSection
            title="Log de Conversas"
            icon={MessageSquare}
            isOpen={openSections.conversas}
            onToggle={() => toggleSection("conversas")}
            badge={
              atleta.conversou_semana ? (
                <Badge variant="success" className="ml-2">
                  Conversou essa semana
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 text-muted-foreground">
                  Sem conversa
                </Badge>
              )
            }
          >
            <div className="space-y-4">
              <Button onClick={onRegistrarConversa}>
                <Clock className="h-4 w-4 mr-2" />
                Registrar Conversa
              </Button>

              {logConversas.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {logConversas
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between text-sm py-1 border-b last:border-0"
                      >
                        <span>{getTreinadorNome(log.treinador_id)}</span>
                        <span className="text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma conversa registrada.
                </p>
              )}
            </div>
          </CollapsibleSection>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
