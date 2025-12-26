// Tipos do sistema Go On Força Manager

export type Status =
  | "aguardando_treino"
  | "treino_montado"
  | "atrasado"
  | "precisa_ajuste";

// Planos são dinâmicos agora - string livre
export type Plano = string;

export type Ambiente =
  | "Academia"
  | "Home Gym"
  | "No Equip"
  | "Corrida";

export type DiasTreina = 1 | 2 | 3 | 4 | 5 | 6;

export type NivelExperiencia =
  | "iniciante"
  | "intermediario"
  | "avancado";

export interface Treinador {
  id: string;
  nome: string;
  email: string;
  created_at: string;
}

export interface Atleta {
  id: string;
  nome: string;
  telefone: string;
  professor_id: string | null;
  treinador_corrida_id: string | null;
  plano: Plano;
  ambiente: Ambiente;
  dias_treina: DiasTreina;
  bloco_mfit: string;
  pronto_ate: string; // ISO date string
  status: Status;
  prova_alvo: string;
  data_prova: string | null; // ISO date string
  lesoes_ativas: string;
  limitacoes: string;
  perfil_comportamento: string;
  objetivos: string;
  nivel_experiencia: NivelExperiencia;
  equipamentos: string;
  notas_treinador: string;
  observacao: string;
  created_at: string;
  updated_at: string;
  // Sprint 11: Inativar Atleta
  ativo: boolean;
  data_inativacao: string | null;
  motivo_inativacao: string;
  // Sprint 13: Campo de Ajuste
  nota_ajuste: string;
}

export interface HandoffNote {
  id: string;
  atleta_id: string;
  treinador_id: string;
  conteudo: string;
  created_at: string;
}

export interface LogConversa {
  id: string;
  atleta_id: string;
  treinador_id: string;
  created_at: string;
}

// Sprint 12: Sistema de Lembretes
export interface Lembrete {
  id: string;
  atleta_id: string;
  treinador_id: string;
  conteudo: string;
  data_lembrete: string; // ISO date string
  realizado: boolean;
  data_realizado: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos derivados para a UI
export interface AtletaComCalculos extends Atleta {
  dias: number; // calculado: diferença entre pronto_ate e hoje
  tempo_ate_prova: string | null; // calculado: "X semanas e Y dias" ou null
  professor_nome: string | null;
  treinador_corrida_nome: string | null;
  conversou_semana: boolean;
  status_original?: Status;
  // Sprint 12: Lembretes
  tem_lembrete_ativo: boolean;
  lembretes_ativos: Lembrete[];
}

export interface DashboardStats {
  para_montar_semana: number;
  ja_com_treino: number;
  fecham_proxima_semana: number;
  sem_treinador: number;
  atrasados: number;
  precisam_ajuste: number;
  sem_conversa_semana: number;
  // Sprint 11: Inativar Atleta
  inativos: number;
}

// Tipos para filtros
// Filtros especiais do dashboard
export type FiltroEspecial =
  | "para_montar_semana"
  | "ja_com_treino"
  | "fecham_proxima_semana"
  | "sem_treinador"
  | "atrasados"
  | "precisam_ajuste"
  | "sem_conversa_semana";

export interface FiltrosAtleta {
  professor_id?: string;
  status?: Status;
  plano?: Plano;
  ambiente?: Ambiente;
  dias_treina?: DiasTreina;
  busca?: string;
  especial?: FiltroEspecial;
  // Sprint 11: Inativar Atleta
  mostrar_inativos?: boolean;
}

// Constantes para selects
export const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "aguardando_treino", label: "Aguardando Treino" },
  { value: "treino_montado", label: "Treino Montado" },
  { value: "atrasado", label: "Atrasado" },
  { value: "precisa_ajuste", label: "Precisa de Ajuste" },
];

// Planos padrão - podem ser customizados
export const DEFAULT_PLANOS = [
  "CORTESIA",
  "PRO",
  "PRO+",
  "PRO TEAM",
  "GOLD",
];

export const AMBIENTE_OPTIONS: { value: Ambiente; label: string }[] = [
  { value: "Academia", label: "Academia" },
  { value: "Home Gym", label: "Home Gym" },
  { value: "No Equip", label: "Sem Equipamento" },
  { value: "Corrida", label: "Corrida" },
];

export const DIAS_TREINA_OPTIONS: { value: DiasTreina; label: string }[] = [
  { value: 1, label: "1 dia" },
  { value: 2, label: "2 dias" },
  { value: 3, label: "3 dias" },
  { value: 4, label: "4 dias" },
  { value: 5, label: "5 dias" },
  { value: 6, label: "6 dias" },
];

export const NIVEL_OPTIONS: { value: NivelExperiencia; label: string }[] = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];
