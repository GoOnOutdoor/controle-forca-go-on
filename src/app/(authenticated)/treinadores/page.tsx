"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import type { Treinador } from "@/types";
import {
  getTreinadores,
  createTreinador,
  deleteTreinador,
} from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function TreinadoresPage() {
  const [treinadores, setTreinadores] = useState<Treinador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [novoTreinador, setNovoTreinador] = useState({ nome: "", email: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTreinadores();
      setTreinadores(data);
    } catch (error) {
      console.error("Erro ao carregar treinadores:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTreinador = async () => {
    if (!novoTreinador.nome || !novoTreinador.email) return;

    setSaving(true);
    try {
      await createTreinador({
        nome: novoTreinador.nome,
        email: novoTreinador.email,
      });
      await loadData();
      setNovoTreinador({ nome: "", email: "" });
      setModalOpen(false);
      toast.success("Treinador adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar treinador:", error);
      toast.error("Erro ao adicionar treinador. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTreinador = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este treinador?")) return;

    try {
      await deleteTreinador(id);
      await loadData();
      toast.success("Treinador removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover treinador:", error);
      toast.error("Erro ao remover treinador. Tente novamente.");
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <TableHead key={idx}>
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx}>
                    {Array.from({ length: 4 }).map((__, cellIdx) => (
                      <TableCell key={cellIdx}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Treinadores</h1>
              <p className="text-muted-foreground">
                Gerencie os treinadores da equipe
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={loadData} aria-label="Atualizar lista de treinadores">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Treinador
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treinadores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <p>Nenhum treinador cadastrado</p>
                        <p className="text-sm mt-2">
                          Adicione treinadores clicando no botão acima ou diretamente na planilha do Google Sheets
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  treinadores.map((treinador) => (
                    <TableRow key={treinador.id}>
                      <TableCell className="font-medium">{treinador.nome}</TableCell>
                      <TableCell>{treinador.email}</TableCell>
                      <TableCell>
                        {treinador.created_at
                          ? new Date(treinador.created_at).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover ${treinador.nome}`}
                          onClick={() => handleRemoveTreinador(treinador.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Treinador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={novoTreinador.nome}
                onChange={(e) =>
                  setNovoTreinador((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Nome do treinador"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={novoTreinador.email}
                onChange={(e) =>
                  setNovoTreinador((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddTreinador}
              disabled={!novoTreinador.nome || !novoTreinador.email || saving}
            >
              {saving ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
