"use client";

import { StatsCard } from "./stats-card";
import {
  Calendar,
  CheckCircle2,
  Clock,
  UserX,
  AlertTriangle,
  Wrench,
  MessageSquareOff,
} from "lucide-react";
import type { DashboardStats } from "@/types";

interface DashboardProps {
  stats: DashboardStats;
  onFilterClick: (filter: string) => void;
}

export function Dashboard({ stats, onFilterClick }: DashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Para montar essa semana"
        value={stats.para_montar_semana}
        icon={Calendar}
        variant={stats.para_montar_semana > 0 ? "warning" : "default"}
        onClick={() => onFilterClick("para_montar_semana")}
      />
      <StatsCard
        title="Já com treino"
        value={stats.ja_com_treino}
        icon={CheckCircle2}
        variant="success"
        onClick={() => onFilterClick("ja_com_treino")}
      />
      <StatsCard
        title="Fecham próxima semana"
        value={stats.fecham_proxima_semana}
        icon={Clock}
        onClick={() => onFilterClick("fecham_proxima_semana")}
      />
      <StatsCard
        title="Sem treinador"
        value={stats.sem_treinador}
        icon={UserX}
        variant={stats.sem_treinador > 0 ? "danger" : "default"}
        onClick={() => onFilterClick("sem_treinador")}
      />
      <StatsCard
        title="Atrasados"
        value={stats.atrasados}
        icon={AlertTriangle}
        variant={stats.atrasados > 0 ? "danger" : "default"}
        onClick={() => onFilterClick("atrasados")}
      />
      <StatsCard
        title="Precisam de ajuste"
        value={stats.precisam_ajuste}
        icon={Wrench}
        variant={stats.precisam_ajuste > 0 ? "warning" : "default"}
        onClick={() => onFilterClick("precisam_ajuste")}
      />
      <StatsCard
        title="Sem conversa essa semana"
        value={stats.sem_conversa_semana}
        icon={MessageSquareOff}
        variant={stats.sem_conversa_semana > 0 ? "warning" : "default"}
        onClick={() => onFilterClick("sem_conversa_semana")}
      />
    </div>
  );
}
