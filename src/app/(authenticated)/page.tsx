"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Dashboard } from "@/components/dashboard/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { AtletasTable } from "@/components/atletas/atletas-table";
import { AtletasTableSkeleton } from "@/components/atletas/atletas-table-skeleton";
import { AtletaModal } from "@/components/atletas/atleta-modal";
import { NovoAtletaModal } from "@/components/atletas/novo-atleta-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw } from "lucide-react";
import type {
  Atleta,
  AtletaComCalculos,
  Treinador,
  HandoffNote,
  LogConversa,
  DashboardStats,
  FiltrosAtleta,
} from "@/types";
import {
  getAtletas,
  getTreinadores,
  getHandoffNotes,
  getLogConversas,
  updateAtleta,
  createAtleta,
  createHandoffNote,
  createLogConversa,
  processarAtletasComCalculos,
} from "@/lib/api";
import { toast } from "sonner";
import { isMasterEmail } from "@/lib/permissions";

// Dados mock para desenvolvimento
const MOCK_TREINADORES: Treinador[] = [
  { id: "1", nome: "Wesley", email: "wesley@goon.com", created_at: new Date().toISOString() },
  { id: "2", nome: "Bonatto", email: "bonatto@goon.com", created_at: new Date().toISOString() },
  { id: "3", nome: "Carlos", email: "carlos@goon.com", created_at: new Date().toISOString() },
];

const MOCK_ATLETAS: Atleta[] = [
  {
    id: "1",
    nome: "João Silva",
    professor_id: "1",
    plano: "PRO",
    ambiente: "Academia",
    dias_treina: 3,
    bloco_mfit: "Força Base A",
    pronto_ate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "aguardando_treino",
    prova_alvo: "UTMB 2025",
    data_prova: "2025-08-25",
    lesoes_ativas: "Dor no joelho direito",
    limitacoes: "",
    perfil_comportamento: "Motivado, treina consistentemente",
    objetivos: "Completar UTMB",
    nivel_experiencia: "intermediario",
    equipamentos: "Completo",
    notas_treinador: "",
    observacao: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    nome: "Maria Santos",
    professor_id: "1",
    plano: "PRO+",
    ambiente: "Home Gym",
    dias_treina: 4,
    bloco_mfit: "Força Base B",
    pronto_ate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "atrasado",
    prova_alvo: "",
    data_prova: null,
    lesoes_ativas: "",
    limitacoes: "Não pode fazer exercícios de impacto",
    perfil_comportamento: "",
    objetivos: "Ganho de força geral",
    nivel_experiencia: "iniciante",
    equipamentos: "Básico - halteres e elásticos",
    notas_treinador: "",
    observacao: "Prefere treinos curtos",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    nome: "Pedro Costa",
    professor_id: "2",
    plano: "GOLD",
    ambiente: "Academia",
    dias_treina: 3,
    bloco_mfit: "Hipertrofia C",
    pronto_ate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "treino_montado",
    prova_alvo: "Ironman Brasil",
    data_prova: "2025-05-15",
    lesoes_ativas: "",
    limitacoes: "",
    perfil_comportamento: "Atleta experiente",
    objetivos: "Melhorar performance no Ironman",
    nivel_experiencia: "avancado",
    equipamentos: "Completo",
    notas_treinador: "Foco em posterior de coxa",
    observacao: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    nome: "Ana Oliveira",
    professor_id: null,
    plano: "PRO",
    ambiente: "No Equip",
    dias_treina: 2,
    bloco_mfit: "",
    pronto_ate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "aguardando_treino",
    prova_alvo: "",
    data_prova: null,
    lesoes_ativas: "",
    limitacoes: "",
    perfil_comportamento: "",
    objetivos: "",
    nivel_experiencia: "iniciante",
    equipamentos: "Nenhum",
    notas_treinador: "",
    observacao: "Novo atleta - precisa de professor",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    nome: "Lucas Ferreira",
    professor_id: "1",
    plano: "PRO_TEAM",
    ambiente: "Academia",
    dias_treina: 4,
    bloco_mfit: "Força Máxima",
    pronto_ate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "precisa_ajuste",
    prova_alvo: "Ultra Trail São Paulo",
    data_prova: "2025-06-20",
    lesoes_ativas: "Fascite plantar",
    limitacoes: "Evitar saltos",
    perfil_comportamento: "Muito dedicado",
    objetivos: "Pódio na UTSP",
    nivel_experiencia: "avancado",
    equipamentos: "Completo",
    notas_treinador: "Ajustar por conta da fascite",
    observacao: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_LOG_CONVERSAS: LogConversa[] = [
  { id: "1", atleta_id: "1", treinador_id: "1", created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "2", atleta_id: "3", treinador_id: "2", created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
];

const MOCK_HANDOFF_NOTES: HandoffNote[] = [
  { id: "1", atleta_id: "1", treinador_id: "1", conteudo: "Atleta está evoluindo bem, foco em posterior", created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "2", atleta_id: "3", treinador_id: "2", conteudo: "Aumentar carga nos exercícios de puxada", created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

export default function HomePage() {
  const { user } = useUser();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [treinadores, setTreinadores] = useState<Treinador[]>([]);
  const [logConversas, setLogConversas] = useState<LogConversa[]>([]);
  const [handoffNotes, setHandoffNotes] = useState<HandoffNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosAtleta>({});
  const [selectedAtleta, setSelectedAtleta] = useState<AtletaComCalculos | null>(null);
  const [novoAtletaModalOpen, setNovoAtletaModalOpen] = useState(false);
  const [useMockData] = useState(!process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL);

  const userEmail =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ||
    null;
  const isMaster = isMasterEmail(userEmail);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (useMockData) {
        // Usar dados mock enquanto não tem a API configurada
        setAtletas(MOCK_ATLETAS);
        setTreinadores(MOCK_TREINADORES);
        setLogConversas(MOCK_LOG_CONVERSAS);
        setHandoffNotes(MOCK_HANDOFF_NOTES);
      } else {
        const [atletasData, treinadoresData, logsData, notesData] = await Promise.all([
          getAtletas(),
          getTreinadores(),
          getLogConversas(),
          getHandoffNotes(),
        ]);
        setAtletas(atletasData);
        setTreinadores(treinadoresData);
        setLogConversas(logsData);
        setHandoffNotes(notesData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // Fallback para dados mock em caso de erro
      setAtletas(MOCK_ATLETAS);
      setTreinadores(MOCK_TREINADORES);
      setLogConversas(MOCK_LOG_CONVERSAS);
      setHandoffNotes(MOCK_HANDOFF_NOTES);
    } finally {
      setLoading(false);
    }
  }, [useMockData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const atletasComCalculos = useMemo(
    () => processarAtletasComCalculos(atletas, treinadores, logConversas),
    [atletas, treinadores, logConversas]
  );

  const treinadorAtual = useMemo(
    () => treinadores.find((t) => t.email?.toLowerCase() === userEmail),
    [treinadores, userEmail]
  );

  const atletasVisiveis = useMemo(() => {
    if (isMaster) return atletasComCalculos;
    if (!treinadorAtual) return [];
    return atletasComCalculos.filter((a) => a.professor_id === treinadorAtual.id);
  }, [isMaster, treinadorAtual, atletasComCalculos]);

  const atletasFiltrados = useMemo(() => {
    return atletasVisiveis.filter((atleta) => {
      // Filtros especiais do dashboard
      if (filtros.especial) {
        switch (filtros.especial) {
          case "para_montar_semana":
            if (!(atleta.dias >= 0 && atleta.dias <= 7 && atleta.status !== "treino_montado")) return false;
            break;
          case "ja_com_treino":
            if (!(atleta.status === "treino_montado" && atleta.dias >= 0)) return false;
            break;
          case "fecham_proxima_semana":
            if (!(atleta.dias >= 8 && atleta.dias <= 14)) return false;
            break;
          case "sem_treinador":
            if (atleta.professor_id) return false;
            break;
          case "atrasados":
            if (atleta.dias >= 0) return false;
            break;
          case "precisam_ajuste":
            if (atleta.status !== "precisa_ajuste") return false;
            break;
          case "sem_conversa_semana":
            if (atleta.conversou_semana) return false;
            break;
        }
      }

      // Filtros normais
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        if (!atleta.nome.toLowerCase().includes(busca)) return false;
      }
      if (filtros.professor_id && filtros.professor_id !== "none" && atleta.professor_id !== filtros.professor_id) return false;
      if (filtros.professor_id === "none" && atleta.professor_id) return false;
      if (filtros.status && atleta.status !== filtros.status) return false;
      if (filtros.plano && atleta.plano !== filtros.plano) return false;
      if (filtros.ambiente && atleta.ambiente !== filtros.ambiente) return false;
      if (filtros.dias_treina && atleta.dias_treina !== filtros.dias_treina) return false;
      return true;
    });
  }, [atletasVisiveis, filtros]);

  const dashboardStats: DashboardStats = useMemo(() => {
    return {
      para_montar_semana: atletasVisiveis.filter(
        (a) => a.dias >= 0 && a.dias <= 7 && a.status !== "treino_montado"
      ).length,
      ja_com_treino: atletasVisiveis.filter(
        (a) => a.status === "treino_montado" && a.dias >= 0
      ).length,
      fecham_proxima_semana: atletasVisiveis.filter(
        (a) => a.dias >= 8 && a.dias <= 14
      ).length,
      sem_treinador: atletasVisiveis.filter((a) => !a.professor_id).length,
      atrasados: atletasVisiveis.filter((a) => a.dias < 0).length,
      precisam_ajuste: atletasVisiveis.filter(
        (a) => a.status === "precisa_ajuste"
      ).length,
      sem_conversa_semana: atletasVisiveis.filter(
        (a) => !a.conversou_semana
      ).length,
    };
  }, [atletasVisiveis]);

  const handleFilterClick = (filter: string) => {
    // Se clicar no mesmo filtro, limpa
    if (filtros.especial === filter) {
      setFiltros({});
      return;
    }

    // Aplica o filtro especial
    setFiltros({ especial: filter as FiltrosAtleta["especial"] });
  };

  const handleUpdateAtleta = async (id: string, data: Partial<AtletaComCalculos>) => {
    try {
      if (useMockData) {
        setAtletas((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a))
        );
      } else {
        await updateAtleta(id, data);
        await loadData();
      }
      setSelectedAtleta(null);
      toast.success("Atleta atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar atleta:", error);
      toast.error("Erro ao atualizar atleta. Tente novamente.");
    }
  };

  const handleCreateAtleta = async (data: Partial<Atleta>) => {
    try {
      if (useMockData) {
        const novoAtleta: Atleta = {
          id: String(Date.now()),
          nome: data.nome || "",
          professor_id: data.professor_id || null,
          plano: data.plano || "PRO",
          ambiente: data.ambiente || "Academia",
          dias_treina: data.dias_treina || 3,
          bloco_mfit: data.bloco_mfit || "",
          pronto_ate: data.pronto_ate || "",
          status: data.status || "aguardando_treino",
          prova_alvo: "",
          data_prova: null,
          lesoes_ativas: "",
          limitacoes: "",
          perfil_comportamento: "",
          objetivos: "",
          nivel_experiencia: "intermediario",
          equipamentos: "",
          notas_treinador: "",
          observacao: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setAtletas((prev) => [...prev, novoAtleta]);
      } else {
        await createAtleta(data);
        await loadData();
      }
      toast.success("Atleta criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar atleta:", error);
      toast.error("Erro ao criar atleta. Tente novamente.");
    }
  };

  const handleAddHandoffNote = async (conteudo: string) => {
    if (!selectedAtleta || !user) return;

    try {
      const treinadorAtual = treinadores.find((t) => t.email === user.emailAddresses[0]?.emailAddress);
      const treinadorId = treinadorAtual?.id || "1";

      if (useMockData) {
        const newNote: HandoffNote = {
          id: String(Date.now()),
          atleta_id: selectedAtleta.id,
          treinador_id: treinadorId,
          conteudo,
          created_at: new Date().toISOString(),
        };
        setHandoffNotes((prev) => [...prev, newNote]);
      } else {
        await createHandoffNote({
          atleta_id: selectedAtleta.id,
          treinador_id: treinadorId,
          conteudo,
        });
        await loadData();
      }
      toast.success("Nota de handoff adicionada!");
    } catch (error) {
      console.error("Erro ao adicionar nota:", error);
      toast.error("Erro ao adicionar nota. Tente novamente.");
    }
  };

  const handleRegistrarConversa = async () => {
    if (!selectedAtleta || !user) return;

    try {
      const treinadorAtual = treinadores.find((t) => t.email === user.emailAddresses[0]?.emailAddress);
      const treinadorId = treinadorAtual?.id || "1";

      if (useMockData) {
        const newLog: LogConversa = {
          id: String(Date.now()),
          atleta_id: selectedAtleta.id,
          treinador_id: treinadorId,
          created_at: new Date().toISOString(),
        };
        setLogConversas((prev) => [...prev, newLog]);
      } else {
        await createLogConversa({
          atleta_id: selectedAtleta.id,
          treinador_id: treinadorId,
        });
        await loadData();
      }
      toast.success("Conversa registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar conversa:", error);
      toast.error("Erro ao registrar conversa. Tente novamente.");
    }
  };

  const selectedAtletaHandoffNotes = useMemo(
    () => handoffNotes.filter((n) => n.atleta_id === selectedAtleta?.id),
    [handoffNotes, selectedAtleta]
  );

  const selectedAtletaLogConversas = useMemo(
    () => logConversas.filter((l) => l.atleta_id === selectedAtleta?.id),
    [logConversas, selectedAtleta]
  );

  const handleBulkUpdateAtletas = async (ids: string[], data: Partial<AtletaComCalculos>) => {
    if (ids.length === 0) return;
    if (useMockData) {
      setAtletas((prev) =>
        prev.map((a) => (ids.includes(a.id) ? { ...a, ...data, updated_at: new Date().toISOString() } : a))
      );
      return;
    }

    try {
      await Promise.all(ids.map((id) => updateAtleta(id, data)));
      await loadData();
    } catch (error) {
      console.error("Erro ao atualizar em massa:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
          <DashboardSkeleton />
          <div>
            <Skeleton className="h-6 w-44 mb-3" />
            <AtletasTableSkeleton />
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Bem-vindo, {user?.firstName || "Treinador"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={loadData} aria-label="Atualizar dados">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={() => setNovoAtletaModalOpen(true)} aria-label="Adicionar novo atleta">
                <Plus className="h-4 w-4 mr-2" />
                Novo Atleta
              </Button>
            </div>
          </div>

          <Dashboard stats={dashboardStats} onFilterClick={handleFilterClick} />

          <div>
            <h2 className="text-xl font-semibold mb-4">Lista de Atletas</h2>
        <AtletasTable
          atletas={atletasFiltrados}
          treinadores={treinadores}
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onAtletaClick={setSelectedAtleta}
          onUpdateAtleta={handleUpdateAtleta}
          onBulkUpdate={handleBulkUpdateAtletas}
        />
      </div>

          <AtletaModal
            atleta={selectedAtleta}
            treinadores={treinadores}
            handoffNotes={selectedAtletaHandoffNotes}
            logConversas={selectedAtletaLogConversas}
            open={!!selectedAtleta}
            onClose={() => setSelectedAtleta(null)}
            onSave={(data) => handleUpdateAtleta(selectedAtleta!.id, data)}
            onAddHandoffNote={handleAddHandoffNote}
            onRegistrarConversa={handleRegistrarConversa}
          />

          <NovoAtletaModal
            open={novoAtletaModalOpen}
            onClose={() => setNovoAtletaModalOpen(false)}
            onSave={handleCreateAtleta}
            treinadores={treinadores}
          />
        </>
      )}
    </div>
  );
}
