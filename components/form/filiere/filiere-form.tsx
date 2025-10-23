"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFiliere, updateFiliere } from "@/lib/actions/filiere";
import { getAllDepartements } from "@/lib/actions/departement";
import { CreateFiliere, UpdateFiliere } from "@/lib/zodshema";
import { Save, Loader2 } from "lucide-react";

interface FiliereFormProps {
  initialData?: {
    id: string;
    nom: string;
    description?: string | null;
    departementId: string;
  };
  mode: "create" | "edit";
}

export function FiliereForm({ initialData, mode }: FiliereFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departements, setDepartements] = useState<Array<{id: string; nom: string}>>([]);
  const [formData, setFormData] = useState({
    nom: initialData?.nom || "",
    description: initialData?.description || "",
    departementId: initialData?.departementId || "",
  });

  useEffect(() => {
    const loadDepartements = async () => {
      const result = await getAllDepartements();
      if (result.success) {
        setDepartements(result.data || []);
      }
    };
    loadDepartements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.departementId) {
      setErrors({ departementId: "Veuillez sélectionner un département" });
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const data: CreateFiliere = {
            nom: formData.nom,
            description: formData.description || null,
            departementId: formData.departementId,
          };
          
          const result = await createFiliere(data);
          
          if (result.success) {
            router.push("/filieres");
            router.refresh();
          } else {
            setErrors({ general: result.error || "Une erreur est survenue" });
          }
        } else if (mode === "edit" && initialData?.id) {
          const data: UpdateFiliere = {
            nom: formData.nom,
            description: formData.description || null,
            departementId: formData.departementId,
          };
          
          const result = await updateFiliere(initialData.id, data);
          
          if (result.success) {
            router.push("/filieres");
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
          {mode === "create" ? "Créer une filière" : "Modifier la filière"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nom">
              Nom de la filière <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nom"
              type="text"
              value={formData.nom}
              onChange={(e) => handleInputChange("nom", e.target.value)}
              placeholder="Entrez le nom de la filière"
              required
              className={errors.nom ? "border-red-500" : ""}
            />
            {errors.nom && (
              <p className="text-sm text-red-600">{errors.nom}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="departementId">
              Département <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.departementId}
              onValueChange={(value) => handleInputChange("departementId", value)}
            >
              <SelectTrigger className={errors.departementId ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionnez un département" />
              </SelectTrigger>
              <SelectContent>
                {departements.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departementId && (
              <p className="text-sm text-red-600">{errors.departementId}</p>
            )}
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
              disabled={isPending || !formData.nom.trim() || !formData.departementId}
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
