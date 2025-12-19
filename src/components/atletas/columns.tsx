"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Check,
  MessageCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AtletaComCalculos, Status } from "@/types";

// Função para determinar a urgência da linha
export function getRowUrgency(
  atleta: AtletaComCalculos
): "critical" | "warning" | "attention" | "normal" {
  if (atleta.status === "atrasado" || atleta.dias < 0) return "critical";
  if (atleta.status === "precisa_ajuste") return "warning";
  if (
    atleta.dias >= 0 &&
    atleta.dias <= 3 &&
    atleta.status !== "treino_montado"
  )
    return "attention";
  return "normal";
}

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

// Componente para sort button nos headers
function SortButton({
  column,
  children,
}: {
  column: any;
  children: React.ReactNode;
}) {
  const isSorted = column.getIsSorted();
  const Icon = !isSorted
    ? ArrowUpDown
    : isSorted === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <Icon className="ml-2 h-4 w-4" />
    </Button>
  );
}

export const columns: ColumnDef<AtletaComCalculos>[] = [
  // Checkbox de seleção
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Selecionar ${row.original.nome}`}
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Nome
  {
    accessorKey: "nome",
    header: ({ column }) => <SortButton column={column}>Nome</SortButton>,
    cell: ({ row }) => {
      const atleta = row.original;
      const urgency = getRowUrgency(atleta);

      return (
        <div className="flex items-center gap-2 font-medium">
          {urgency === "critical" && (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          {urgency === "warning" && (
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          )}
          {urgency === "attention" && (
            <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          )}
          {atleta.nome}
        </div>
      );
    },
  },

  // Dias
  {
    accessorKey: "dias",
    header: ({ column }) => <SortButton column={column}>Dias</SortButton>,
    cell: ({ row }) => {
      const dias = row.original.dias;
      const atleta = row.original;
      const isUrgent = dias >= 0 && dias <= 3 && atleta.status !== "treino_montado";

      return (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-semibold px-2 py-1 rounded",
              dias < 0 && "bg-red-100 text-red-700",
              dias >= 0 && dias <= 3 && "bg-orange-100 text-orange-700",
              dias > 3 && dias <= 7 && "bg-yellow-100 text-yellow-700",
              dias > 7 && "bg-green-100 text-green-700"
            )}
          >
            {dias}
          </span>
          {isUrgent && (
            <Badge variant="destructive" className="text-xs font-bold animate-pulse">
              🔥 URGENTE
            </Badge>
          )}
        </div>
      );
    },
    sortingFn: "basic",
  },

  // Pronto até with inline editing
  {
    accessorKey: "pronto_ate",
    header: ({ column }) => (
      <SortButton column={column}>Pronto até</SortButton>
    ),
    cell: ({ row, table }) => {
      const date = row.original.pronto_ate;
      const atleta = row.original;
      const meta = table.options.meta as any;
      const [isEditing, setIsEditing] = useState(false);
      // Convert to YYYY-MM-DD format for input[type="date"]
      const formatDateForInput = (dateStr: string | null) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toISOString().split("T")[0];
      };
      const [value, setValue] = useState(formatDateForInput(date));

      const handleSave = () => {
        if (value !== formatDateForInput(date)) {
          meta?.onUpdateProntoAte?.(atleta.id, value || null);
        }
        setIsEditing(false);
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleSave();
        } else if (e.key === "Escape") {
          setValue(formatDateForInput(date));
          setIsEditing(false);
        }
      };

      if (isEditing) {
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        );
      }

      const displayDate = date
        ? new Date(date).toLocaleDateString("pt-BR")
        : "-";

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsEditing(true)}
            className="truncate block text-left hover:text-primary transition-colors cursor-pointer w-full"
            title={displayDate !== "-" ? displayDate : "Clique para definir data"}
          >
            {displayDate}
          </button>
        </div>
      );
    },
  },

  // Bloco Mfit
  {
    accessorKey: "bloco_mfit",
    header: ({ column }) => (
      <SortButton column={column}>Bloco Mfit</SortButton>
    ),
    cell: ({ row, table }) => {
      const bloco = row.original.bloco_mfit;
      const atleta = row.original;
      const meta = table.options.meta as any;
      const [isEditing, setIsEditing] = useState(false);
      const [value, setValue] = useState(bloco || "");

      const handleSave = () => {
        if (value !== bloco) {
          meta?.onUpdateBlocoMfit?.(atleta.id, value);
        }
        setIsEditing(false);
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleSave();
        } else if (e.key === "Escape") {
          setValue(bloco || "");
          setIsEditing(false);
        }
      };

      if (isEditing) {
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Bloco 1, Fase 2"
            />
          </div>
        );
      }

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsEditing(true)}
            className="truncate block text-left hover:text-primary transition-colors cursor-pointer w-full"
            title={bloco || "Clique para editar"}
          >
            {bloco || "-"}
          </button>
        </div>
      );
    },
  },

  // Status
  {
    accessorKey: "status",
    header: ({ column }) => <SortButton column={column}>Status</SortButton>,
    cell: ({ row, table }) => {
      const status = row.original.status;
      const atleta = row.original;
      const meta = table.options.meta as any;

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  statusColors[status],
                  "cursor-pointer hover:opacity-80 transition-opacity"
                )}
              >
                {statusLabels[status]}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  meta?.onUpdateStatus?.(atleta.id, "aguardando_treino")
                }
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    "bg-yellow-600"
                  )}
                />
                Aguardando
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  meta?.onUpdateStatus?.(atleta.id, "treino_montado")
                }
              >
                <div
                  className={cn("w-2 h-2 rounded-full mr-2", "bg-green-600")}
                />
                Montado
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => meta?.onUpdateStatus?.(atleta.id, "atrasado")}
              >
                <div
                  className={cn("w-2 h-2 rounded-full mr-2", "bg-red-600")}
                />
                Atrasado
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  meta?.onUpdateStatus?.(atleta.id, "precisa_ajuste")
                }
              >
                <div
                  className={cn("w-2 h-2 rounded-full mr-2", "bg-orange-600")}
                />
                Ajuste
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },

  // Professor
  {
    accessorKey: "professor_nome",
    header: ({ column }) => (
      <SortButton column={column}>Professor</SortButton>
    ),
    cell: ({ row, table }) => {
      const professor = row.original.professor_nome;
      const atleta = row.original;
      const meta = table.options.meta as any;
      const treinadores = meta?.treinadores || [];

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="truncate block text-left hover:text-primary transition-colors cursor-pointer">
                {professor || "-"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>Alterar Professor</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => meta?.onUpdateProfessor?.(atleta.id, null)}
              >
                <span className="text-muted-foreground">Sem professor</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {treinadores.map((t: any) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => meta?.onUpdateProfessor?.(atleta.id, t.id)}
                >
                  {t.nome}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },

  // Treinador Corrida
  {
    accessorKey: "treinador_corrida_nome",
    header: ({ column }) => (
      <SortButton column={column}>Treinador Corrida</SortButton>
    ),
    cell: ({ row }) => {
      const treinador = row.original.treinador_corrida_nome;
      return (
        <span className="truncate block" title={treinador || "-"}>
          {treinador || "-"}
        </span>
      );
    },
  },

  // Plano
  {
    accessorKey: "plano",
    header: ({ column }) => <SortButton column={column}>Plano</SortButton>,
    cell: ({ row }) => {
      const plano = row.original.plano;
      return <span className="truncate block" title={plano}>{plano}</span>;
    },
  },

  // Ambiente
  {
    accessorKey: "ambiente",
    header: ({ column }) => <SortButton column={column}>Ambiente</SortButton>,
    cell: ({ row }) => {
      const ambiente = row.original.ambiente;
      return <span className="truncate block">{ambiente}</span>;
    },
  },

  // Dias/Semana
  {
    accessorKey: "dias_treina",
    header: ({ column }) => (
      <SortButton column={column}>Dias/Sem</SortButton>
    ),
    cell: ({ row }) => {
      const dias = row.original.dias_treina;
      return <span>{dias} dias</span>;
    },
  },

  // Prova Alvo
  {
    accessorKey: "prova_alvo",
    header: ({ column }) => (
      <SortButton column={column}>Prova Alvo</SortButton>
    ),
    cell: ({ row }) => {
      const prova = row.original.prova_alvo;
      return (
        <span className="truncate block" title={prova || "-"}>
          {prova || "-"}
        </span>
      );
    },
  },

  // Tempo até Prova
  {
    accessorKey: "tempo_ate_prova",
    header: ({ column }) => (
      <SortButton column={column}>Tempo até Prova</SortButton>
    ),
    cell: ({ row }) => {
      const tempo = row.original.tempo_ate_prova;
      return (
        <span className="truncate block">
          {tempo || "Sem prova definida"}
        </span>
      );
    },
  },

  // WhatsApp
  {
    id: "whatsapp",
    header: "WhatsApp",
    cell: ({ row, table }) => {
      const atleta = row.original;
      const meta = table.options.meta as any;

      return (
        <div className="text-center" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto"
            onClick={() => meta?.onOpenWhatsapp?.(atleta)}
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
        </div>
      );
    },
    enableSorting: false,
  },

  // Conversa
  {
    id: "conversa",
    accessorKey: "conversou_semana",
    header: ({ column }) => (
      <SortButton column={column}>Conversa</SortButton>
    ),
    cell: ({ row }) => {
      const conversou = row.original.conversou_semana;
      return (
        <div className="text-center">
          {conversou ? (
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
        </div>
      );
    },
  },

  // Ações
  {
    id: "actions",
    header: "Ações",
    cell: ({ row, table }) => {
      const atleta = row.original;
      const meta = table.options.meta as any;

      return (
        <div className="text-center" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu de ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => meta?.onMarcarMontado?.(atleta)}
                disabled={atleta.status === "treino_montado"}
              >
                <Check className="mr-2 h-4 w-4" />
                Marcar como montado
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => meta?.onRegistrarConversa?.(atleta)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Registrar conversa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => meta?.onWhatsAppConversa?.(atleta)}
                disabled={!atleta.telefone}
              >
                <Image
                  src="/icons/whatsapp.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="mr-2"
                />
                WhatsApp + Conversa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => meta?.onVerDetalhes?.(atleta)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
  },
];
