// API Client para comunicação com Google Apps Script
import type {
  Atleta,
  Treinador,
  HandoffNote,
  LogConversa,
  DashboardStats,
  AtletaComCalculos,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";

async function fetchApi<T>(
  action: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(API_URL);
  url.searchParams.set("action", action);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    redirect: "follow",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Erro desconhecido");
  }

  return result.data;
}

async function postApi<T>(
  action: string,
  data: Record<string, unknown>
): Promise<T> {
  const response = await fetch(API_URL, {
    method: "POST",
    redirect: "follow",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({ action, ...data }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Erro desconhecido");
  }

  return result.data;
}

// ============================================
// ATLETAS
// ============================================

export async function getAtletas(): Promise<Atleta[]> {
  return fetchApi<Atleta[]>("getAtletas");
}

export async function getAtleta(id: string): Promise<Atleta | null> {
  return fetchApi<Atleta | null>("getAtleta", { id });
}

export async function createAtleta(
  data: Partial<Atleta>
): Promise<Atleta> {
  return postApi<Atleta>("createAtleta", { data });
}

export async function updateAtleta(
  id: string,
  data: Partial<Atleta>
): Promise<Atleta> {
  return postApi<Atleta>("updateAtleta", { id, data });
}

export async function deleteAtleta(id: string): Promise<void> {
  await postApi("deleteAtleta", { id });
}

// ============================================
// TREINADORES
// ============================================

export async function getTreinadores(): Promise<Treinador[]> {
  return fetchApi<Treinador[]>("getTreinadores");
}

export async function createTreinador(
  data: Partial<Treinador>
): Promise<Treinador> {
  return postApi<Treinador>("createTreinador", { data });
}

export async function updateTreinador(
  id: string,
  data: Partial<Treinador>
): Promise<Treinador> {
  return postApi<Treinador>("updateTreinador", { id, data });
}

export async function deleteTreinador(id: string): Promise<void> {
  await postApi("deleteTreinador", { id });
}

// ============================================
// HANDOFF NOTES
// ============================================

export async function getHandoffNotes(
  atletaId?: string
): Promise<HandoffNote[]> {
  return fetchApi<HandoffNote[]>(
    "getHandoffNotes",
    atletaId ? { atleta_id: atletaId } : undefined
  );
}

export async function createHandoffNote(
  data: Omit<HandoffNote, "id" | "created_at">
): Promise<HandoffNote> {
  return postApi<HandoffNote>("createHandoffNote", { data });
}

// ============================================
// LOG DE CONVERSAS
// ============================================

export async function getLogConversas(
  atletaId?: string
): Promise<LogConversa[]> {
  return fetchApi<LogConversa[]>(
    "getLogConversas",
    atletaId ? { atleta_id: atletaId } : undefined
  );
}

export async function createLogConversa(
  data: Omit<LogConversa, "id" | "created_at">
): Promise<LogConversa> {
  return postApi<LogConversa>("createLogConversa", { data });
}

// ============================================
// DASHBOARD
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchApi<DashboardStats>("getDashboardStats");
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

export function calcularDias(prontoAte: string | null): number | null {
  if (!prontoAte) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataProonto = new Date(prontoAte);
  dataProonto.setHours(0, 0, 0, 0);

  return Math.ceil(
    (dataProonto.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function calcularTempoAteProva(dataProva: string | null): string | null {
  if (!dataProva) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const prova = new Date(dataProva);
  prova.setHours(0, 0, 0, 0);

  const diffDias = Math.ceil(
    (prova.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDias < 0) return "Prova já passou";

  const semanas = Math.floor(diffDias / 7);
  const dias = diffDias % 7;

  if (semanas === 0) return `${dias} dia${dias !== 1 ? "s" : ""}`;
  if (dias === 0) return `${semanas} semana${semanas !== 1 ? "s" : ""}`;

  return `${semanas} semana${semanas !== 1 ? "s" : ""} e ${dias} dia${dias !== 1 ? "s" : ""}`;
}

export function processarAtletasComCalculos(
  atletas: Atleta[],
  treinadores: Treinador[],
  logConversas: LogConversa[]
): AtletaComCalculos[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const umaSemanaAtras = new Date(hoje);
  umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

  const calcularStatusAutomatico = (atleta: Atleta, dias: number | null): Atleta["status"] => {
    const original = atleta.status;
    if (dias === null) return original;

    // 1) Se já passou do prazo: atrasado
    if (dias < 0) return "atrasado";

    // 2) Se o aluno pediu ajuste, mantemos enquanto não estiver atrasado
    if (original === "precisa_ajuste") return "precisa_ajuste";

    // 3) 0-7 dias: aguardando treino
    if (dias <= 7) return "aguardando_treino";

    // 4) Maior que 7 dias: treino montado
    return "treino_montado";
  };

  return atletas.map((atleta) => {
    const professor = treinadores.find((t) => t.id === atleta.professor_id);

    const conversouSemana = logConversas.some((log) => {
      if (log.atleta_id !== atleta.id) return false;
      const dataLog = new Date(log.created_at);
      return dataLog >= umaSemanaAtras;
    });

    const dias = calcularDias(atleta.pronto_ate) ?? 0;
    const statusCalculado = calcularStatusAutomatico(atleta, dias);

    return {
      ...atleta,
      dias,
      status_original: atleta.status,
      status: statusCalculado,
      tempo_ate_prova: calcularTempoAteProva(atleta.data_prova),
      professor_nome: professor?.nome || null,
      conversou_semana: conversouSemana,
    };
  });
}
