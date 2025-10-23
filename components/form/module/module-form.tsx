"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createModule, updateModule } from "@/lib/actions/module";
import { getAllFilieres } from "@/lib/actions/filiere";
import { CreateModule, UpdateModule } from "@/lib/zodshema";
import { Save, Loader2 } from "lucide-react";

interface ModuleFormProps {
  initialData?: {
    id: string;
    nom: string;
    code: string;
    description?: string | null;
    credits?: number | null;
    heures?: number | null;
    filiereId: string;
  };
  mode: "create" | "edit";
}

export function ModuleForm({ initialData, mode }: ModuleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filieres, setFilieres] = useState<Array<{id: string; nom: string; departement: {nom: string}}>>([]);
  const [formData, setFormData] = useState({
    nom: initialData?.nom || "",
    code: initialData?.code || "",
    description: initialData?.description || "",
    credits: initialData?.credits?.toString() || "",
    heures: initialData?.heures?.toString() || "",
    filiereId: initialData?.filiereId || "",
  });

  useEffect(() => {
    const loadFilieres = async () => {
      const result = await getAllFilieres();
      if (result.success) {
        setFilieres(result.data || []);
      }
    };
    loadFilieres();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.filiereId) {
      setErrors({ filiereId: "Veuillez sélectionner une filière" });
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const data: CreateModule = {
            nom: formData.nom,
            code: formData.code,
            description: formData.description || null,
            credits: formData.credits ? parseInt(formData.credits) : null,
            heures: formData.heures ? parseInt(formData.heures) : null,
            filiereId: formData.filiereId,
          };
          
          const result = await createModule(data);
          
          if (result.success) {
            router.push("/modules");
            router.refresh();
          } else {
            setErrors({ general: result.error || "Une erreur est survenue" });
          }
        } else if (mode === "edit" && initialData?.id) {
          const data: UpdateModule = {
            nom: formData.nom,
            code: formData.code,
            description: formData.description || null,
            credits: formData.credits ? parseInt(formData.credits) : null,
            heures: formData.heures ? parseInt(formData.heures) : null,
            filiereId: formData.filiereId,
          };
          
          const result = await updateModule(initialData.id, data);
          
          if (result.success) {
            router.push("/modules");
            router.refresh();
          } else {
            setErrors({ general: result.error || "Une erreur est survenue" });
          }
        }
      } catch (error) {
        console.error("Erreur lors de la soumission:", error);
        setErrors({ general: "Une erreur inattendue est survenue" });
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Créer un module" : "Modifier le module"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">
                Nom du module <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                placeholder="Entrez le nom du module"
                required
                className={errors.nom ? "border-red-500" : ""}
              />
              {errors.nom && (
                <p className="text-sm text-red-600">{errors.nom}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                Code du module <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                placeholder="Ex: INF101"
                required
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-sm text-red-600">{errors.code}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filiereId">
              Filière <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.filiereId}
              onValueChange={(value) => handleInputChange("filiereId", value)}
            >
              <SelectTrigger className={errors.filiereId ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionnez une filière" />
              </SelectTrigger>
              <SelectContent>
                {filieres.map((filiere) => (
                  <SelectItem key={filiere.id} value={filiere.id}>
                    {filiere.nom} ({filiere.departement.nom})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.filiereId && (
              <p className="text-sm text-red-600">{errors.filiereId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Crédits</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                value={formData.credits}
                onChange={(e) => handleInputChange("credits", e.target.value)}
                placeholder="Nombre de crédits"
                className={errors.credits ? "border-red-500" : ""}
              />
              {errors.credits && (
                <p className="text-sm text-red-600">{errors.credits}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="heures">Heures</Label>
              <Input
                id="heures"
                type="number"
                min="1"
                value={formData.heures}
                onChange={(e) => handleInputChange("heures", e.target.value)}
                placeholder="Nombre d'heures"
                className={errors.heures ? "border-red-500" : ""}
              />
              {errors.heures && (
                <p className="text-sm text-red-600">{errors.heures}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Entrez une description (optionnel)"
              rows={4}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isPending || !formData.nom.trim() || !formData.code.trim() || !formData.filiereId}
              className="flex-1"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mode === "create" ? "Créer" : "Mettre à jour"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
