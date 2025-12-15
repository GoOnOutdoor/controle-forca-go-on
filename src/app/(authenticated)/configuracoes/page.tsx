"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { getPlanos, addPlano, removePlano, updatePlano } from "@/lib/planos-storage";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { isMasterEmail } from "@/lib/permissions";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConfiguracoesPage() {
  const { user, isLoaded } = useUser();
  const [planos, setPlanos] = useState<string[]>([]);
  const [novoPlano, setNovoPlano] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [valorEditando, setValorEditando] = useState("");

  const userEmail =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ||
    null;
  const isMaster = isMasterEmail(userEmail);

  useEffect(() => {
    setPlanos(getPlanos());
  }, []);

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isMaster) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const handleAddPlano = () => {
    if (!novoPlano.trim()) return;
    if (planos.includes(novoPlano.trim().toUpperCase())) {
      toast.error("Este plano já existe!");
      return;
    }
    const novosPlanos = addPlano(novoPlano.trim().toUpperCase());
    setPlanos(novosPlanos);
    setNovoPlano("");
    toast.success("Plano adicionado com sucesso!");
  };

  const handleRemovePlano = (plano: string) => {
    if (confirm(`Tem certeza que deseja remover o plano "${plano}"?`)) {
      const novosPlanos = removePlano(plano);
      setPlanos(novosPlanos);
      toast.success("Plano removido com sucesso!");
    }
  };

  const handleStartEdit = (plano: string) => {
    setEditando(plano);
    setValorEditando(plano);
  };

  const handleSaveEdit = () => {
    if (!valorEditando.trim() || !editando) return;
    if (valorEditando !== editando && planos.includes(valorEditando.trim().toUpperCase())) {
      toast.error("Este plano já existe!");
      return;
    }
    const novosPlanos = updatePlano(editando, valorEditando.trim().toUpperCase());
    setPlanos(novosPlanos);
    setEditando(null);
    setValorEditando("");
    toast.success("Plano atualizado com sucesso!");
  };

  const handleCancelEdit = () => {
    setEditando(null);
    setValorEditando("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie os planos disponíveis no sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={novoPlano}
              onChange={(e) => setNovoPlano(e.target.value)}
              placeholder="Nome do novo plano"
              onKeyDown={(e) => e.key === "Enter" && handleAddPlano()}
            />
            <Button onClick={handleAddPlano} disabled={!novoPlano.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {planos.map((plano) => (
              <div
                key={plano}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                {editando === plano ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={valorEditando}
                      onChange={(e) => setValorEditando(e.target.value)}
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{plano}</span>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartEdit(plano)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemovePlano(plano)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {planos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum plano cadastrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
