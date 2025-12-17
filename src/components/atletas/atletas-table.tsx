"use client";

import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  AlertTriangle,
  Clock,
  AlertCircle,
  Pencil,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AtletaComCalculos,
  Treinador,
  Status,
  Plano,
  Ambiente,
  FiltrosAtleta,
} from "@/types";
import {
  STATUS_OPTIONS,
  AMBIENTE_OPTIONS,
  DIAS_TREINA_OPTIONS,
} from "@/types";
import { cn } from "@/lib/utils";
import { getPlanos } from "@/lib/planos-storage";

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

type SortField =
  | "nome"
  | "dias"
  | "pronto_ate"
  | "bloco_mfit"
  | "status"
  | "professor_nome"
  | "treinador_corrida_nome"
  | "plano"
  | "ambiente"
  | "dias_treina"
  | "prova_alvo"
  | "tempo_ate_prova"
  | "whatsapp"
  | "conversou_semana";
type SortDirection = "asc" | "desc";

const statusColors: Record<Status, string> = {
  aguardando_treino: "bg-yellow-100 text-yellow-800 border-yellow-200",
  treino_montado: "bg-green-100 text-green-800 border-green-200",
  atrasado: "bg-red-100 text-red-800 border-red-200",
  precisa_ajuste: "bg-orange-100 text-orange-800 border-orange-200",
};

const statusLabels: Record<Status, string> = {
  aguardando_treino: "Aguardando",
  treino_montado: "Montado",
  atrasado: "Atrasado",
  precisa_ajuste: "Ajuste",
};

// Função para determinar a urgência da linha
function getRowUrgency(atleta: AtletaComCalculos): "critical" | "warning" | "attention" | "normal" {
  // Crítico: atrasado ou precisa de ajuste
  if (atleta.status === "atrasado" || atleta.dias < 0) return "critical";
  if (atleta.status === "precisa_ajuste") return "warning";
  // Atenção: próximo de vencer (0-3 dias) e ainda não montado
  if (atleta.dias >= 0 && atleta.dias <= 3 && atleta.status !== "treino_montado") return "attention";
  // Normal
  return "normal";
}

const rowUrgencyStyles: Record<string, string> = {
  critical: "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500",
  warning: "bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-500",
  attention: "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-500",
  normal: "hover:bg-muted/50",
};

const defaultColumnWidths = {
  select: 50,
  nome: 220,
  dias: 80,
  pronto_ate: 130,
  bloco_mfit: 160,
  status: 160,
  professor_nome: 160,
  treinador_corrida_nome: 160,
  plano: 120,
  ambiente: 130,
  dias_treina: 90,
  prova_alvo: 160,
  tempo_ate_prova: 150,
  whatsapp: 90,
  conversa: 70,
} as const;

type ColumnKey = keyof typeof defaultColumnWidths;
const COLUMN_WIDTHS_STORAGE_KEY = "atletas-table-column-widths";

// Componente para edição inline de status
function InlineStatusSelect({
  value,
  onChange,
  onCancel,
}: {
  value: Status;
  onChange: (value: Status) => void;
  onCancel: () => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as Status)}
      defaultOpen
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <SelectTrigger className="h-8 w-[150px] text-xs">
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
  );
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
  const [sortField, setSortField] = useState<SortField>("dias");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(() => ({
    ...defaultColumnWidths,
  }));
  const [planos, setPlanos] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProfessor, setBulkProfessor] = useState<string | "none" | "keep">("keep");
  const [bulkStatus, setBulkStatus] = useState<Status | "keep">("keep");
  const [bulkAmbiente, setBulkAmbiente] = useState<Ambiente | "keep">("keep");
  const [bulkPlano, setBulkPlano] = useState<string | "keep">("keep");
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  useEffect(() => {
    try {
      const savedWidths = localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY);
      if (savedWidths) {
        const parsed = JSON.parse(savedWidths) as Partial<Record<ColumnKey, number>>;
        setColumnWidths((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch (error) {
      console.error("Não foi possível carregar larguras da tabela", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    setPlanos(getPlanos());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "goon-planos") {
        setPlanos(getPlanos());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    // Se mudar filtro, limpa seleção para evitar aplicar em itens ocultos
    setSelectedIds(new Set());
  }, [filtros]);

  const handleInlineEdit = async (atletaId: string, field: string, value: unknown) => {
    try {
      await onUpdateAtleta(atletaId, { [field]: value });
      setEditingCell(null);
    } catch {
      setEditingCell(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const startResizing = (
    column: ColumnKey,
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = columnWidths[column];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setColumnWidths((prev) => ({
        ...prev,
        [column]: Math.max(60, startWidth + delta),
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const getColumnStyle = (column: ColumnKey) => ({
    width: `${columnWidths[column]}px`,
    minWidth: `${columnWidths[column]}px`,
  });

  const renderResizeHandle = (column: ColumnKey) => (
    <div
      className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-border/60"
      onMouseDown={(event) => startResizing(column, event)}
      aria-hidden="true"
    />
  );

  const sortedAtletas = useMemo(() => {
    return [...atletas].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "nome":
          comparison = a.nome.localeCompare(b.nome);
          break;
        case "dias":
          comparison = (a.dias ?? 999) - (b.dias ?? 999);
          break;
        case "pronto_ate":
          comparison = (a.pronto_ate || "").localeCompare(b.pronto_ate || "");
          break;
        case "bloco_mfit":
          comparison = (a.bloco_mfit || "").localeCompare(b.bloco_mfit || "");
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "professor_nome":
          comparison = (a.professor_nome || "").localeCompare(
            b.professor_nome || ""
          );
          break;
        case "treinador_corrida_nome":
          comparison = (a.treinador_corrida_nome || "").localeCompare(
            b.treinador_corrida_nome || ""
          );
          break;
        case "plano":
          comparison = (a.plano || "").localeCompare(b.plano || "");
          break;
        case "ambiente":
          comparison = (a.ambiente || "").localeCompare(b.ambiente || "");
          break;
        case "dias_treina":
          comparison = (a.dias_treina || 0) - (b.dias_treina || 0);
          break;
        case "prova_alvo":
          comparison = (a.prova_alvo || "").localeCompare(b.prova_alvo || "");
          break;
        case "tempo_ate_prova":
          comparison = (a.tempo_ate_prova || "zzz").localeCompare(
            b.tempo_ate_prova || "zzz"
          );
          break;
        case "whatsapp": {
          const aHasPhone = Boolean(a.telefone);
          const bHasPhone = Boolean(b.telefone);
          if (aHasPhone !== bHasPhone) {
            comparison = Number(aHasPhone) - Number(bHasPhone);
          } else {
            comparison = (a.telefone || "").localeCompare(b.telefone || "");
          }
          break;
        }
        case "conversou_semana":
          comparison = Number(a.conversou_semana) - Number(b.conversou_semana);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [atletas, sortDirection, sortField]);

  const allVisibleSelected =
    sortedAtletas.length > 0 && sortedAtletas.every((a) => selectedIds.has(a.id));
  const someVisibleSelected =
    sortedAtletas.some((a) => selectedIds.has(a.id)) && !allVisibleSelected;

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    const next = new Set<string>();
    sortedAtletas.forEach((a) => next.add(a.id));
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkProfessor("keep");
    setBulkStatus("keep");
    setBulkAmbiente("keep");
    setBulkPlano("keep");
  };

  const handleApplyBulk = async () => {
    if (selectedIds.size === 0) {
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

    setIsApplyingBulk(true);
    try {
      await onBulkUpdate(Array.from(selectedIds), payload);
      toast.success("Alterações aplicadas nos selecionados.");
      clearSelection();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível aplicar as alterações.");
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => {
    const isActive = sortField === field;
    const Icon = !isActive
      ? ArrowUpDown
      : sortDirection === "asc"
        ? ArrowUp
        : ArrowDown;

    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => handleSort(field)}
        aria-pressed={isActive}
      >
        {children}
        <Icon className="ml-2 h-4 w-4" />
      </Button>
    );
  };

  const clearFiltros = () => {
    onFiltrosChange({});
  };

  const hasFiltros =
    filtros.busca ||
    filtros.professor_id ||
    filtros.status ||
    filtros.plano ||
    filtros.ambiente;

  const handleRowKeyDown = (atleta: AtletaComCalculos, event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onAtletaClick(atleta);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
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
              plano: value === "all" ? undefined : (value as Plano),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            {planos.map((p) => (
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

      {selectedIds.size > 0 && (
        <div className="rounded-md border bg-muted/40 p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-medium">
            {selectedIds.size} selecionado{selectedIds.size > 1 ? "s" : ""}
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
                {planos.map((p) => (
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
            <Button size="sm" onClick={handleApplyBulk} disabled={isApplyingBulk}>
              {isApplyingBulk ? "Aplicando..." : "Aplicar em selecionados"}
            </Button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-md border overflow-x-auto hidden md:block">
        <Table className="min-w-[1200px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[50px] relative"
                style={getColumnStyle("select")}
              >
                <input
                  type="checkbox"
                  aria-label="Selecionar todos"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someVisibleSelected;
                }}
                onChange={toggleSelectAll}
                className="h-4 w-4 accent-primary"
              />
                {renderResizeHandle("select")}
              </TableHead>
              <TableHead
                className="w-[220px] relative"
                style={getColumnStyle("nome")}
                aria-sort={
                  sortField === "nome"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="nome">Nome</SortButton>
                {renderResizeHandle("nome")}
              </TableHead>
              <TableHead
                className="w-[80px] relative"
                style={getColumnStyle("dias")}
                aria-sort={
                  sortField === "dias"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="dias">Dias</SortButton>
                {renderResizeHandle("dias")}
              </TableHead>
              <TableHead
                className="w-[130px] relative"
                style={getColumnStyle("pronto_ate")}
                aria-sort={
                  sortField === "pronto_ate"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="pronto_ate">Pronto até</SortButton>
                {renderResizeHandle("pronto_ate")}
              </TableHead>
              <TableHead
                className="w-[160px] relative"
                style={getColumnStyle("bloco_mfit")}
                aria-sort={
                  sortField === "bloco_mfit"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="bloco_mfit">Bloco Mfit</SortButton>
                {renderResizeHandle("bloco_mfit")}
              </TableHead>
              <TableHead
                className="w-[160px] relative"
                style={getColumnStyle("status")}
                aria-sort={
                  sortField === "status"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="status">Status</SortButton>
                {renderResizeHandle("status")}
              </TableHead>
              <TableHead
                className="w-[160px] relative"
                style={getColumnStyle("professor_nome")}
                aria-sort={
                  sortField === "professor_nome"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="professor_nome">Professor</SortButton>
                {renderResizeHandle("professor_nome")}
              </TableHead>
              <TableHead
                className="w-[160px] relative"
                style={getColumnStyle("treinador_corrida_nome")}
                aria-sort={
                  sortField === "treinador_corrida_nome"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="treinador_corrida_nome">
                  Treinador Corrida
                </SortButton>
                {renderResizeHandle("treinador_corrida_nome")}
              </TableHead>
              <TableHead
                className="w-[120px] relative"
                style={getColumnStyle("plano")}
                aria-sort={
                  sortField === "plano"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="plano">Plano</SortButton>
                {renderResizeHandle("plano")}
              </TableHead>
              <TableHead
                className="w-[130px] relative"
                style={getColumnStyle("ambiente")}
                aria-sort={
                  sortField === "ambiente"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="ambiente">Ambiente</SortButton>
                {renderResizeHandle("ambiente")}
              </TableHead>
              <TableHead
                className="w-[90px] relative"
                style={getColumnStyle("dias_treina")}
                aria-sort={
                  sortField === "dias_treina"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="dias_treina">Dias/Sem</SortButton>
                {renderResizeHandle("dias_treina")}
              </TableHead>
              <TableHead
                className="w-[160px] relative"
                style={getColumnStyle("prova_alvo")}
                aria-sort={
                  sortField === "prova_alvo"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="prova_alvo">Prova Alvo</SortButton>
                {renderResizeHandle("prova_alvo")}
              </TableHead>
              <TableHead
                className="w-[150px] relative"
                style={getColumnStyle("tempo_ate_prova")}
                aria-sort={
                  sortField === "tempo_ate_prova"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="tempo_ate_prova">Tempo até Prova</SortButton>
                {renderResizeHandle("tempo_ate_prova")}
              </TableHead>
              <TableHead
                className="w-[90px] text-center relative"
                style={getColumnStyle("whatsapp")}
                aria-sort={
                  sortField === "whatsapp"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="whatsapp">WhatsApp</SortButton>
                {renderResizeHandle("whatsapp")}
              </TableHead>
              <TableHead
                className="w-[70px] text-center relative"
                style={getColumnStyle("conversa")}
                aria-sort={
                  sortField === "conversou_semana"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortButton field="conversou_semana">Conversa</SortButton>
                {renderResizeHandle("conversa")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAtletas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-8">
                  Nenhum atleta encontrado
                </TableCell>
              </TableRow>
            ) : (
              sortedAtletas.map((atleta) => {
                const urgency = getRowUrgency(atleta);
                return (
                  <TableRow
                    key={atleta.id}
                    className={cn("cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/60", rowUrgencyStyles[urgency])}
                    onClick={() => onAtletaClick(atleta)}
                    tabIndex={0}
                    onKeyDown={(event) => handleRowKeyDown(atleta, event)}
                  >
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="w-[50px]"
                      style={getColumnStyle("select")}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${atleta.nome}`}
                        checked={selectedIds.has(atleta.id)}
                        onChange={() => toggleSelectOne(atleta.id)}
                        className="h-4 w-4 accent-primary"
                      />
                    </TableCell>
                  <TableCell
                    className="font-medium w-[220px] truncate"
                    style={getColumnStyle("nome")}
                  >
                    <div className="flex items-center gap-2">
                      {urgency === "critical" && (
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      {urgency === "warning" && (
                        <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      )}
                      {urgency === "attention" && (
                        <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      )}
                      {atleta.nome}
                    </div>
                  </TableCell>
                  <TableCell className="w-[80px]" style={getColumnStyle("dias")}>
                    <span
                      className={cn(
                        "font-semibold px-2 py-1 rounded",
                        atleta.dias < 0 && "bg-red-100 text-red-700",
                        atleta.dias >= 0 && atleta.dias <= 3 && "bg-orange-100 text-orange-700",
                        atleta.dias > 3 && atleta.dias <= 7 && "bg-yellow-100 text-yellow-700",
                        atleta.dias > 7 && "bg-green-100 text-green-700"
                      )}
                    >
                      {atleta.dias}
                    </span>
                  </TableCell>
                  <TableCell
                    className="w-[130px]"
                    style={getColumnStyle("pronto_ate")}
                  >
                    {atleta.pronto_ate
                      ? new Date(atleta.pronto_ate).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell
                    className="w-[160px] truncate"
                    title={atleta.bloco_mfit || "-"}
                    style={getColumnStyle("bloco_mfit")}
                  >
                    {atleta.bloco_mfit || "-"}
                  </TableCell>
                  <TableCell
                    className="w-[160px]"
                    style={getColumnStyle("status")}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCell({ id: atleta.id, field: "status" });
                    }}
                  >
                    {editingCell?.id === atleta.id && editingCell?.field === "status" ? (
                      <InlineStatusSelect
                        value={atleta.status}
                        onChange={(v) => handleInlineEdit(atleta.id, "status", v)}
                        onCancel={() => setEditingCell(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-1 group"
                        aria-label={`Editar status de ${atleta.nome}`}
                      >
                        <Badge
                          variant="outline"
                          className={cn(statusColors[atleta.status], "cursor-pointer")}
                          title="Clique para editar status"
                          aria-label={`Status: ${statusLabels[atleta.status]}`}
                        >
                          {statusLabels[atleta.status]}
                        </Badge>
                        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </TableCell>
                  <TableCell
                    className="w-[160px] truncate"
                    title={atleta.professor_nome || "-"}
                    style={getColumnStyle("professor_nome")}
                  >
                    {atleta.professor_nome || "-"}
                  </TableCell>
                  <TableCell
                    className="w-[160px] truncate"
                    title={atleta.treinador_corrida_nome || "-"}
                    style={getColumnStyle("treinador_corrida_nome")}
                  >
                    {atleta.treinador_corrida_nome || "-"}
                  </TableCell>
                  <TableCell
                    className="w-[120px] truncate"
                    title={atleta.plano}
                    style={getColumnStyle("plano")}
                  >
                    {atleta.plano}
                  </TableCell>
                  <TableCell
                    className="w-[130px] truncate"
                    style={getColumnStyle("ambiente")}
                  >
                    {atleta.ambiente}
                  </TableCell>
                  <TableCell className="w-[90px]" style={getColumnStyle("dias_treina")}>
                    {atleta.dias_treina} dias
                  </TableCell>
                  <TableCell
                    className="w-[160px] truncate"
                    title={atleta.prova_alvo || "-"}
                    style={getColumnStyle("prova_alvo")}
                  >
                    {atleta.prova_alvo || "-"}
                  </TableCell>
                  <TableCell
                    className="w-[150px] truncate"
                    style={getColumnStyle("tempo_ate_prova")}
                  >
                    {atleta.tempo_ate_prova || "Sem prova definida"}
                  </TableCell>
                  <TableCell
                    className="text-center w-[90px]"
                    style={getColumnStyle("whatsapp")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mx-auto"
                      onClick={() => onOpenWhatsapp(atleta)}
                      disabled={!atleta.telefone}
                    aria-label={
                      atleta.telefone
                        ? `Conversar com ${atleta.nome} no WhatsApp`
                        : "Telefone não informado"
                    }
                  >
                      <Image
                        src="/icons/whatsapp.svg"
                        alt="WhatsApp"
                        width={20}
                        height={20}
                        className={cn(
                          "h-5 w-5",
                          atleta.telefone ? "opacity-100" : "opacity-40"
                        )}
                      />
                    </Button>
                  </TableCell>
                  <TableCell
                    className="text-center w-[70px]"
                    style={getColumnStyle("conversa")}
                  >
                    {atleta.conversou_semana ? (
                      <CheckCircle2
                        className="h-5 w-5 text-green-600 mx-auto"
                        aria-label="Conversa registrada na semana"
                      />
                    ) : (
                      <XCircle
                        className="h-5 w-5 text-red-500 mx-auto"
                        aria-label="Sem conversa registrada na semana"
                      />
                    )}
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Versão mobile em cards */}
      <div className="grid gap-3 md:hidden">
        {sortedAtletas.length === 0 ? (
          <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            Nenhum atleta encontrado
          </div>
        ) : (
          sortedAtletas.map((atleta) => {
            const urgency = getRowUrgency(atleta);
            return (
              <div
                key={atleta.id}
                className={cn(
                  "w-full rounded-lg border p-4 text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  rowUrgencyStyles[urgency]
                )}
                role="button"
                tabIndex={0}
                onClick={() => onAtletaClick(atleta)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onAtletaClick(atleta);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      {urgency === "critical" && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      {urgency === "warning" && (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      )}
                      {urgency === "attention" && (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="block truncate">{atleta.nome}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {atleta.professor_nome || "Sem professor"} • {atleta.plano}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${atleta.nome}`}
                    checked={selectedIds.has(atleta.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelectOne(atleta.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <Badge
                    variant="outline"
                    className={cn(statusColors[atleta.status], "whitespace-nowrap")}
                  >
                    {statusLabels[atleta.status]}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-muted/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Dias</p>
                    <p className="font-semibold">{atleta.dias}</p>
                  </div>
                  <div className="rounded-md bg-muted/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Pronto até</p>
                    <p className="font-semibold">
                      {atleta.pronto_ate ? new Date(atleta.pronto_ate).toLocaleDateString("pt-BR") : "-"}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Bloco</p>
                    <p className="block font-semibold truncate">{atleta.bloco_mfit || "-"}</p>
                  </div>
                  <div className="rounded-md bg-muted/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Ambiente</p>
                    <p className="font-semibold">{atleta.ambiente}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenWhatsapp(atleta);
                  }}
                  disabled={!atleta.telefone}
                >
                    <Image
                      src="/icons/whatsapp.svg"
                      alt="WhatsApp"
                      width={18}
                      height={18}
                      className="mr-2"
                    />
                  WhatsApp
                </Button>
                {!atleta.telefone && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Adicione telefone para liberar o WhatsApp.
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{atleta.prova_alvo || "Sem prova alvo"}</span>
                  <span className="flex items-center gap-1">
                    {atleta.conversou_semana ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                        Conversou
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                        Sem conversa
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {sortedAtletas.length} atleta{sortedAtletas.length !== 1 ? "s" : ""}{" "}
        encontrado{sortedAtletas.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
