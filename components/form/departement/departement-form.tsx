"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDepartement, updateDepartement } from "@/lib/actions/departement";
import { CreateDepartement, UpdateDepartement } from "@/lib/zodshema";
import { Save, Loader2 } from "lucide-react";

interface DepartementFormProps {
  initialData?: {
    id: string;
    nom: string;
    description?: string | null;
  };
  mode: "create" | "edit";
}

export function DepartementForm({ initialData, mode }: DepartementFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nom: initialData?.nom || "",
    description: initialData?.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    startTransition(async () => {
      try {
        if (mode === "create") {
          const data: CreateDepartement = {
            nom: formData.nom,
            description: formData.description || null,
          };
          
          const result = await createDepartement(data);
          
          if (result.success) {
            router.push("/departements");
            router.refresh();
          } else {
            setErrors({ general: result.error || "Une erreur est survenue" });
          }
        } else if (mode === "edit" && initialData?.id) {
          const data: UpdateDepartement = {
            nom: formData.nom,
            description: formData.description || null,
          };
          
          const result = await updateDepartement(initialData.id, data);
          
          if (result.success) {
            router.push("/departements");
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
          {mode === "create" ? "Créer un département" : "Modifier le département"}
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
              Nom du département <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nom"
              type="text"
              value={formData.nom}
              onChange={(e) => handleInputChange("nom", e.target.value)}
              placeholder="Entrez le nom du département"
              required
              className={errors.nom ? "border-red-500" : ""}
            />
            {errors.nom && (
              <p className="text-sm text-red-600">{errors.nom}</p>
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
              disabled={isPending || !formData.nom.trim()}
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
