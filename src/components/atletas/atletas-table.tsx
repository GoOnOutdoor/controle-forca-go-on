"use client";

import { useState, useMemo } from "react";
import { SortingState, VisibilityState, ColumnFiltersState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, X, Undo2, Settings2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  AtletaComCalculos,
  Treinador,
  Status,
  Ambiente,
  FiltrosAtleta,
} from "@/types";
import {
  STATUS_OPTIONS,
  AMBIENTE_OPTIONS,
} from "@/types";
import { getPlanos } from "@/lib/planos-storage";
import { DataTable } from "./data-table";
import { columns } from "./columns";

interface AtletasTableProps {
  atletas: AtletaComCalculos[];
  treinadores: Treinador[];
  filtros: FiltrosAtleta;
  onFiltrosChange: (filtros: FiltrosAtleta) => void;
  onAtletaClick: (atleta: AtletaComCalculos) => void;
  onOpenWhatsapp: (atleta: AtletaComCalculos) => void;
  onUpdateAtleta: (id: string, data: Partial<AtletaComCalculos>) => void;
  onBulkUpdate: (ids: string[], data: Partial<AtletaComCalculos>) => Promise<void>;
}

export function AtletasTable({
  atletas,
  treinadores,
  filtros,
  onFiltrosChange,
  onAtletaClick,
  onOpenWhatsapp,
  onUpdateAtleta,
  onBulkUpdate,
}: AtletasTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "dias", desc: false },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Esconder por padrão para reduzir sobrecarga visual
    // pronto_ate e bloco_mfit ficam visíveis (removidos daqui)
    treinador_corrida_nome: false,
    ambiente: false,
    dias_treina: false,
    prova_alvo: false,
    tempo_ate_prova: false,
    conversa: false,
  });
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const [bulkProfessor, setBulkProfessor] = useState<string | "none" | "keep">("keep");
  const [bulkStatus, setBulkStatus] = useState<Status | "keep">("keep");
  const [bulkAmbiente, setBulkAmbiente] = useState<Ambiente | "keep">("keep");
  const [bulkPlano, setBulkPlano] = useState<string | "keep">("keep");
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);
  const [quickFilter, setQuickFilter] = useState<"all" | "urgent" | "late">("all");
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);

  const planoOptions = useMemo(() => {
    const planos = getPlanos();
    const unique = new Set(planos);
    atletas.forEach((atleta) => unique.add(atleta.plano));
    return Array.from(unique);
  }, [atletas]);

  const selectedAtletas = useMemo(() => {
    return atletas.filter((_, index) => rowSelection[index]);
  }, [atletas, rowSelection]);

  const clearSelection = () => {
    setRowSelection({});
    setBulkProfessor("keep");
    setBulkStatus("keep");
    setBulkAmbiente("keep");
    setBulkPlano("keep");
  };

  const handleOpenBulkConfirm = () => {
    if (selectedAtletas.length === 0) {
      toast.error("Selecione pelo menos um atleta.");
      return;
    }

    const payload: Partial<AtletaComCalculos> = {};
    if (bulkProfessor === "none") payload.professor_id = null;
    else if (bulkProfessor !== "keep") payload.professor_id = bulkProfessor;
    if (bulkStatus !== "keep") payload.status = bulkStatus;
    if (bulkAmbiente !== "keep") payload.ambiente = bulkAmbiente;
    if (bulkPlano !== "keep") payload.plano = bulkPlano;

    if (Object.keys(payload).length === 0) {
      toast.error("Escolha pelo menos um campo para alterar.");
      return;
    }

    setShowBulkConfirmDialog(true);
  };

  const handleConfirmBulkApply = async () => {
    const payload: Partial<AtletaComCalculos> = {};
    if (bulkProfessor === "none") payload.professor_id = null;
    else if (bulkProfessor !== "keep") payload.professor_id = bulkProfessor;
    if (bulkStatus !== "keep") payload.status = bulkStatus;
    if (bulkAmbiente !== "keep") payload.ambiente = bulkAmbiente;
    if (bulkPlano !== "keep") payload.plano = bulkPlano;

    setIsApplyingBulk(true);
    try {
      const ids = selectedAtletas.map((a) => a.id);
      await onBulkUpdate(ids, payload);
      toast.success(`${selectedAtletas.length} atleta(s) atualizado(s) com sucesso!`);
      setShowBulkConfirmDialog(false);
      clearSelection();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível aplicar as alterações.");
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const getBulkChangesPreview = () => {
    const changes: string[] = [];
    if (bulkProfessor !== "keep") {
      const professorNome =
        bulkProfessor === "none"
          ? "Sem professor"
          : treinadores.find((t) => t.id === bulkProfessor)?.nome || "Professor";
      changes.push(`Professor: ${professorNome}`);
    }
    if (bulkStatus !== "keep") {
      const statusLabels = {
        aguardando_treino: "Aguardando",
        treino_montado: "Montado",
        atrasado: "Atrasado",
        precisa_ajuste: "Ajuste",
      };
      changes.push(`Status: ${statusLabels[bulkStatus]}`);
    }
    if (bulkAmbiente !== "keep") {
      const ambienteLabel =
        AMBIENTE_OPTIONS.find((a) => a.value === bulkAmbiente)?.label || bulkAmbiente;
      changes.push(`Ambiente: ${ambienteLabel}`);
    }
    if (bulkPlano !== "keep") {
      changes.push(`Plano: ${bulkPlano}`);
    }
    return changes;
  };

  const clearFiltros = () => {
    onFiltrosChange({});
    setQuickFilter("all");
  };

  const handleQuickFilter = (filter: "all" | "urgent" | "late") => {
    setQuickFilter(filter);
    if (filter === "all") {
      onFiltrosChange({});
    } else if (filter === "urgent") {
      onFiltrosChange({ status: "aguardando_treino" });
    } else if (filter === "late") {
      onFiltrosChange({ status: "atrasado" });
    }
  };

  const hasFiltros =
    filtros.busca ||
    filtros.professor_id ||
    filtros.status ||
    filtros.plano ||
    filtros.ambiente;

  // Quick Actions handlers
  const handleMarcarMontado = (atleta: AtletaComCalculos) => {
    onUpdateAtleta(atleta.id, { status: "treino_montado" });
    toast.success(`Treino de ${atleta.nome} marcado como montado!`);
  };

  const handleRegistrarConversa = (atleta: AtletaComCalculos) => {
    // Esta função será implementada na página principal, mas por enquanto mostramos um toast
    toast.info(`Registrar conversa com ${atleta.nome}`);
    // TODO: Implementar registro de conversa
  };

  const handleWhatsAppConversa = (atleta: AtletaComCalculos) => {
    onOpenWhatsapp(atleta);
    // Após abrir WhatsApp, também registra a conversa
    setTimeout(() => {
      toast.info("Não esqueça de registrar a conversa após!");
    }, 1000);
  };

  const handleVerDetalhes = (atleta: AtletaComCalculos) => {
    onAtletaClick(atleta);
  };

  // Inline edit handler for Status
  const handleUpdateStatus = (atletaId: string, newStatus: Status) => {
    onUpdateAtleta(atletaId, { status: newStatus });
    const statusLabels = {
      aguardando_treino: "Aguardando",
      treino_montado: "Montado",
      atrasado: "Atrasado",
      precisa_ajuste: "Ajuste",
    };
    toast.success(`Status alterado para: ${statusLabels[newStatus]}`);
  };

  // Inline edit handler for Professor
  const handleUpdateProfessor = (atletaId: string, professorId: string | null) => {
    onUpdateAtleta(atletaId, { professor_id: professorId });
    const professorNome = professorId
      ? treinadores.find((t) => t.id === professorId)?.nome || "Professor"
      : "Sem professor";
    toast.success(`Professor alterado para: ${professorNome}`);
  };

  // Inline edit handler for Bloco Mfit
  const handleUpdateBlocoMfit = (atletaId: string, blocoMfit: string) => {
    onUpdateAtleta(atletaId, { bloco_mfit: blocoMfit });
    toast.success(`Bloco Mfit atualizado: ${blocoMfit || "removido"}`);
  };

  // Inline edit handler for Pronto até
  const handleUpdateProntoAte = (atletaId: string, prontoAte: string | null) => {
    onUpdateAtleta(atletaId, { pronto_ate: prontoAte || undefined });
    const dataFormatada = prontoAte
      ? new Date(prontoAte).toLocaleDateString("pt-BR")
      : "removida";
    toast.success(`Data "Pronto até" atualizada: ${dataFormatada}`);
  };

  return (
    <div className="space-y-4">
      {/* Quick Filters + Column Visibility */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm font-medium text-muted-foreground">Mostrar:</span>
          <Button
            variant={quickFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleQuickFilter("all")}
          >
            Todos
          </Button>
          <Button
            variant={quickFilter === "urgent" ? "default" : "outline"}
            size="sm"
            onClick={() => handleQuickFilter("urgent")}
          >
            🔥 Urgentes
          </Button>
          <Button
            variant={quickFilter === "late" ? "default" : "outline"}
            size="sm"
            onClick={() => handleQuickFilter("late")}
          >
            Atrasados
          </Button>
        </div>

        {/* Column Visibility Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Settings2 className="mr-2 h-4 w-4" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={columnVisibility.pronto_ate !== false}
              onCheckedChange={(value) =>
                setColumnVisibility({ ...columnVisibility, pronto_ate: value })
              }
            >
              Pronto até
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.bloco_mfit !== false}
              onCheckedChange={(value) =>
                setColumnVisibility({ ...columnVisibility, bloco_mfit: value })
              }
            >
              Bloco Mfit
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.treinador_corrida_nome !== false}
              onCheckedChange={(value) =>
                setColumnVisibility({ ...columnVisibility, treinador_corrida_nome: value })
              }
            >
              Treinador Corrida
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.ambiente !== false}
              onCheckedChange={(value) =>
                setColumnVisibility({ ...columnVisibility, ambiente: value })
              }
            >
              Ambiente
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.dias_treina !== false}
              onCheckedChange={(value) =>
                setColumnVisibility({ ...columnVisibility, dias_treina: value })
              }
            >
              Dias/Semana
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.prova_alvo !== false}
              onCheckedChange={(value) =>
                setColumnVisibility({ ...columnVisibility, prova_alvo: value })
              }
            >
              Prova Alvo
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.tempo_ate_prova !== false}
              onCheckedChange={(value) =>
                setColumnVisibility({ ...columnVisibility, tempo_ate_prova: value })
              }
            >
              Tempo até Prova
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.conversa !== false}
              onCheckedChange={(value) =>
                setColumnVisibility({ ...columnVisibility, conversa: value })
              }
            >
              Conversa
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filtros Detalhados */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-end">
        <div className="md:col-span-2 xl:col-span-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              aria-label="Buscar atleta por nome"
              value={filtros.busca || ""}
              onChange={(e) =>
                onFiltrosChange({ ...filtros, busca: e.target.value })
              }
              className="pl-8"
            />
          </div>
        </div>

        <Select
          value={filtros.professor_id || "all"}
          onValueChange={(value) =>
            onFiltrosChange({
              ...filtros,
              professor_id: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Professor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os professores</SelectItem>
            {treinadores.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.status || "all"}
          onValueChange={(value) =>
            onFiltrosChange({
              ...filtros,
              status: value === "all" ? undefined : (value as Status),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.plano || "all"}
          onValueChange={(value) =>
            onFiltrosChange({
              ...filtros,
              plano: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            {planoOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.ambiente || "all"}
          onValueChange={(value) =>
            onFiltrosChange({
              ...filtros,
              ambiente: value === "all" ? undefined : (value as Ambiente),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Ambiente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ambientes</SelectItem>
            {AMBIENTE_OPTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFiltros && (
          <Button variant="ghost" size="sm" onClick={clearFiltros}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Bulk Edit Bar */}
      {selectedAtletas.length > 0 && (
        <div className="rounded-md border bg-muted/40 p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-medium">
            {selectedAtletas.length} selecionado{selectedAtletas.length > 1 ? "s" : ""}
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 w-full">
            <Select value={bulkProfessor} onValueChange={setBulkProfessor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alterar professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Não alterar</SelectItem>
                <SelectItem value="none">Sem professor</SelectItem>
                {treinadores.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as Status | "keep")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alterar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Não alterar</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={bulkAmbiente} onValueChange={(v) => setBulkAmbiente(v as Ambiente | "keep")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alterar ambiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Não alterar</SelectItem>
                {AMBIENTE_OPTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={bulkPlano} onValueChange={(v) => setBulkPlano(v as string | "keep")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alterar plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Não alterar</SelectItem>
                {planoOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Limpar seleção
            </Button>
            <Button size="sm" onClick={handleOpenBulkConfirm} disabled={isApplyingBulk}>
              <Users className="h-4 w-4 mr-2" />
              Aplicar em {selectedAtletas.length}
            </Button>
          </div>
        </div>
      )}

      {/* DataTable */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={atletas}
          sorting={sorting}
          setSorting={setSorting}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          onRowClick={onAtletaClick}
          meta={{
            onOpenWhatsapp,
            onMarcarMontado: handleMarcarMontado,
            onRegistrarConversa: handleRegistrarConversa,
            onWhatsAppConversa: handleWhatsAppConversa,
            onVerDetalhes: handleVerDetalhes,
            onUpdateStatus: handleUpdateStatus,
            onUpdateProfessor: handleUpdateProfessor,
            onUpdateBlocoMfit: handleUpdateBlocoMfit,
            onUpdateProntoAte: handleUpdateProntoAte,
            treinadores,
          }}
        />
      </div>

      {/* Mobile Cards - Melhorado com quick actions e urgência visual */}
      <div className="grid gap-3 md:hidden">
        {atletas.length === 0 ? (
          <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            Nenhum atleta encontrado
          </div>
        ) : (
          atletas.map((atleta) => {
            // Determinar urgência
            const isAtrasado = atleta.dias < 0;
            const isUrgente = atleta.dias >= 0 && atleta.dias <= 3;
            const borderColor = isAtrasado
              ? "border-l-red-500 border-l-6"
              : isUrgente
                ? "border-l-orange-500 border-l-6"
                : "";

            return (
              <div
                key={atleta.id}
                className={`rounded-lg border p-4 shadow-sm ${borderColor}`}
              >
                {/* Header com nome e badge de urgência */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="text-base font-semibold">{atleta.nome}</div>
                    <p className="text-sm text-muted-foreground">
                      {atleta.professor_nome || "Sem professor"} • {atleta.plano}
                    </p>
                  </div>
                  {isAtrasado && (
                    <Badge variant="destructive" className="text-xs font-bold">
                      🔥 ATRASADO
                    </Badge>
                  )}
                  {isUrgente && !isAtrasado && (
                    <Badge variant="default" className="bg-orange-500 text-xs font-bold">
                      ⚡ URGENTE
                    </Badge>
                  )}
                </div>

                {/* Stats grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-muted/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Dias</p>
                    <p className={`font-semibold ${isAtrasado ? "text-red-600" : isUrgente ? "text-orange-600" : ""}`}>
                      {atleta.dias}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold text-xs truncate">
                      {atleta.status === "treino_montado"
                        ? "Montado"
                        : atleta.status === "atrasado"
                          ? "Atrasado"
                          : atleta.status === "precisa_ajuste"
                            ? "Ajuste"
                            : "Aguardando"}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-3 flex gap-2">
                  {atleta.status !== "treino_montado" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarcarMontado(atleta);
                      }}
                    >
                      ✓ Montado
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsAppConversa(atleta);
                    }}
                  >
                    💬 WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAtletaClick(atleta);
                    }}
                  >
                    📝 Detalhes
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {atletas.length} atleta{atletas.length !== 1 ? "s" : ""}{" "}
        encontrado{atletas.length !== 1 ? "s" : ""}
      </div>

      {/* Bulk Edit Confirmation Dialog */}
      <Dialog open={showBulkConfirmDialog} onOpenChange={setShowBulkConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Alterações em Massa</DialogTitle>
            <DialogDescription>
              Você está prestes a alterar <strong>{selectedAtletas.length} atleta(s)</strong>. Revise as mudanças antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview das mudanças */}
            <div className="rounded-lg border p-4 bg-muted/40">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Alterações que serão aplicadas:
              </h4>
              <div className="space-y-2">
                {getBulkChangesPreview().map((change, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline">{change}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de atletas */}
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3">
                Atletas selecionados ({selectedAtletas.length}):
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {selectedAtletas.map((atleta, index) => (
                  <div
                    key={atleta.id}
                    className="text-sm py-1.5 px-2 rounded hover:bg-muted/50 flex items-center justify-between"
                  >
                    <span className="font-medium">{atleta.nome}</span>
                    <Badge variant="outline" className="text-xs">
                      {atleta.status === "treino_montado"
                        ? "Montado"
                        : atleta.status === "atrasado"
                          ? "Atrasado"
                          : atleta.status === "precisa_ajuste"
                            ? "Ajuste"
                            : "Aguardando"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkConfirmDialog(false)}
              disabled={isApplyingBulk}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmBulkApply} disabled={isApplyingBulk}>
              {isApplyingBulk ? "Aplicando..." : `Confirmar alterações em ${selectedAtletas.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
