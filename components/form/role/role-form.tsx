"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRole, updateRole } from "@/lib/actions/role";
import { CreateRole, UpdateRole, TypeRoleSchema } from "@/lib/zodshema";
import { Save, Loader2 } from "lucide-react";

interface RoleFormProps {
  initialData?: {
    id: string;
    nom: string;
    type: string;
    description?: string | null;
  };
  mode: "create" | "edit";
}

export function RoleForm({ initialData, mode }: RoleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    nom: initialData?.nom || "",
    type: initialData?.type || "",
    description: initialData?.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.type) {
      setErrors({ type: "Veuillez sélectionner un type de rôle" });
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const data: CreateRole = {
            nom: formData.nom,
            type: formData.type as any,
            description: formData.description || null,
          };
          
          const result = await createRole(data);
          
          if (result.success) {
            router.push("/roles");
            router.refresh();
          } else {
            setErrors({ general: result.error || "Une erreur est survenue" });
          }
        } else if (mode === "edit" && initialData?.id) {
          const data: UpdateRole = {
            nom: formData.nom,
            type: formData.type as any,
            description: formData.description || null,
          };
          
          const result = await updateRole(initialData.id, data);
          
          if (result.success) {
            router.push("/roles");
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

  const typeRoleOptions = TypeRoleSchema.options;

  const getTypeDescription = (type: string) => {
    const descriptions = {
      ENSEIGNANT: "Peut enseigner des modules et gérer ses séances",
      ADMINISTRATEUR: "Accès complet à l'administration du système",
      CHEF_DE_FILIERE: "Gère une filière spécifique et ses modules",
      CHEF_DE_DEPARTEMENT: "Gère un département et ses filières",
      DIRECTEUR_GENERAL: "Accès complet à tous les départements et fonctionnalités",
    };
    return descriptions[type as keyof typeof descriptions] || "";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Créer un rôle" : "Modifier le rôle"}
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
              Nom du rôle <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nom"
              type="text"
              value={formData.nom}
              onChange={(e) => handleInputChange("nom", e.target.value)}
              placeholder="Entrez le nom du rôle"
              required
              className={errors.nom ? "border-red-500" : ""}
            />
            {errors.nom && (
              <p className="text-sm text-red-600">{errors.nom}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Type de rôle <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionnez un type de rôle" />
              </SelectTrigger>
              <SelectContent>
                {typeRoleOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type}</span>
                      <span className="text-xs text-gray-500">{getTypeDescription(type)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type}</p>
            )}
            {formData.type && (
              <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                {getTypeDescription(formData.type)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Entrez une description détaillée du rôle (optionnel)"
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
              disabled={isPending || !formData.nom.trim() || !formData.type}
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
