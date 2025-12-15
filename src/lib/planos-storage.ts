// Gerenciamento de planos no localStorage
import { DEFAULT_PLANOS } from "@/types";

const STORAGE_KEY = "goon-planos";

export function getPlanos(): string[] {
  if (typeof window === "undefined") return DEFAULT_PLANOS;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PLANOS;
    }
  }
  return DEFAULT_PLANOS;
}

export function savePlanos(planos: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(planos));
}

export function addPlano(plano: string): string[] {
  const planos = getPlanos();
  if (!planos.includes(plano)) {
    planos.push(plano);
    savePlanos(planos);
  }
  return planos;
}

export function removePlano(plano: string): string[] {
  const planos = getPlanos().filter((p) => p !== plano);
  savePlanos(planos);
  return planos;
}

export function updatePlano(oldPlano: string, newPlano: string): string[] {
  const planos = getPlanos().map((p) => (p === oldPlano ? newPlano : p));
  savePlanos(planos);
  return planos;
}
