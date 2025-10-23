"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSeance, updateSeance } from "@/lib/actions/seance";
import { getAllModules, getModuleById } from "@/lib/actions/module";
import { CreateSeance, UpdateSeance, TypeSeanceSchema } from "@/lib/zodshema";
import { Save, Loader2 } from "lucide-react";

interface SeanceFormProps {
  initialData?: {
    id: string;
    titre: string;
    contenu?: string | null;
    dateseance: Date;
    heureDebut: Date;
    heureFin: Date;
    salle?: string | null;
    type: string;
    complement?: string | null;
    moduleId: string;
    enseignantId: string;
  };
  mode: "create" | "edit";
}

export function SeanceForm({ initialData, mode }: SeanceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modules, setModules] = useState<Array<{
    id: string; 
    nom: string; 
    code: string;
    credits?: number | null;
    heures?: number | null;
    filiere: {
      id: string;
      nom: string; 
      departement: {
        id: string;
        nom: string;
      };
    };
  }>>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Array<{id: string; nom: string; prenom: string}>>([]);
  
  const [formData, setFormData] = useState({
    titre: initialData?.titre || "",
    contenu: initialData?.contenu || "",
    dateseance: initialData?.dateseance ? new Date(initialData.dateseance).toISOString().split('T')[0] : "",
    heureDebut: initialData?.heureDebut ? new Date(initialData.heureDebut).toTimeString().slice(0, 5) : "",
    heureFin: initialData?.heureFin ? new Date(initialData.heureFin).toTimeString().slice(0, 5) : "",
    salle: initialData?.salle || "",
    type: initialData?.type || "COURS",
    complement: initialData?.complement || "",
    moduleId: initialData?.moduleId || "",
    enseignantId: initialData?.enseignantId || "",
  });

  useEffect(() => {
    const loadModules = async () => {
      const result = await getAllModules();
      if (result.success) {
        setModules(result.data || []);
      }
    };
    loadModules();
  }, []);

  useEffect(() => {
    if (formData.moduleId) {
      const loadTeachers = async () => {
        try {
          const result = await getModuleById(formData.moduleId);
          if (result.success && result.data && result.data.users) {
            setAvailableTeachers(result.data.users);
            // Reset enseignant if not in the new module
            if (formData.enseignantId && !result.data.users.some((u: any) => u.id === formData.enseignantId)) {
              setFormData(prev => ({ ...prev, enseignantId: "" }));
            }
          } else {
            setAvailableTeachers([]);
          }
        } catch (error) {
          console.error("Erreur lors du chargement des enseignants:", error);
          setAvailableTeachers([]);
        }
      };
      loadTeachers();
    } else {
      setAvailableTeachers([]);
    }
  }, [formData.moduleId, formData.enseignantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.moduleId) {
      setErrors({ moduleId: "Veuillez sélectionner un module" });
      return;
    }
    if (!formData.enseignantId) {
      setErrors({ enseignantId: "Veuillez sélectionner un enseignant" });
      return;
    }
    if (!formData.dateseance) {
      setErrors({ dateseance: "Veuillez sélectionner une date" });
      return;
    }
    if (!formData.heureDebut || !formData.heureFin) {
      setErrors({ heureDebut: "Veuillez sélectionner les heures de début et fin" });
      return;
    }

    // Créer les objets Date
    const dateseance = new Date(formData.dateseance);
    const heureDebut = new Date(`${formData.dateseance}T${formData.heureDebut}:00`);
    const heureFin = new Date(`${formData.dateseance}T${formData.heureFin}:00`);

    if (heureFin <= heureDebut) {
      setErrors({ heureFin: "L'heure de fin doit être après l'heure de début" });
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const data: CreateSeance = {
            titre: formData.titre,
            contenu: formData.contenu || null,
            dateseance,
            heureDebut,
            heureFin,
            salle: formData.salle || null,
            type: formData.type as any,
            complement: formData.complement || null,
            moduleId: formData.moduleId,
            enseignantId: formData.enseignantId,
          };
          
          const result = await createSeance(data);
          
          if (result.success) {
            router.push("/seances");
            router.refresh();
          } else {
            setErrors({ general: result.error || "Une erreur est survenue" });
          }
        } else if (mode === "edit" && initialData?.id) {
          const data: UpdateSeance = {
            titre: formData.titre,
            contenu: formData.contenu || null,
            dateseance,
            heureDebut,
            heureFin,
            salle: formData.salle || null,
            type: formData.type as any,
            complement: formData.complement || null,
            moduleId: formData.moduleId,
            enseignantId: formData.enseignantId,
          };
          
          const result = await updateSeance(initialData.id, data);
          
          if (result.success) {
            router.push("/seances");
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

  const typeSeanceOptions = TypeSeanceSchema.options;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Créer une séance" : "Modifier la séance"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="titre">
                Titre de la séance <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titre"
                type="text"
                value={formData.titre}
                onChange={(e) => handleInputChange("titre", e.target.value)}
                placeholder="Entrez le titre de la séance"
                required
                className={errors.titre ? "border-red-500" : ""}
              />
              {errors.titre && (
                <p className="text-sm text-red-600">{errors.titre}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Type de séance <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {typeSeanceOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="moduleId">
                Module <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.moduleId}
                onValueChange={(value) => handleInputChange("moduleId", value)}
              >
                <SelectTrigger className={errors.moduleId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionnez un module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.code} - {module.nom} ({module.filiere.nom})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.moduleId && (
                <p className="text-sm text-red-600">{errors.moduleId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="enseignantId">
                Enseignant <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.enseignantId}
                onValueChange={(value) => handleInputChange("enseignantId", value)}
                disabled={!formData.moduleId}
              >
                <SelectTrigger className={errors.enseignantId ? "border-red-500" : ""}>
                  <SelectValue placeholder={formData.moduleId ? "Sélectionnez un enseignant" : "Sélectionnez d'abord un module"} />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.prenom} {teacher.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.enseignantId && (
                <p className="text-sm text-red-600">{errors.enseignantId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateseance">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateseance"
                type="date"
                value={formData.dateseance}
                onChange={(e) => handleInputChange("dateseance", e.target.value)}
                required
                className={errors.dateseance ? "border-red-500" : ""}
              />
              {errors.dateseance && (
                <p className="text-sm text-red-600">{errors.dateseance}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="heureDebut">
                Heure de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="heureDebut"
                type="time"
                value={formData.heureDebut}
                onChange={(e) => handleInputChange("heureDebut", e.target.value)}
                required
                className={errors.heureDebut ? "border-red-500" : ""}
              />
              {errors.heureDebut && (
                <p className="text-sm text-red-600">{errors.heureDebut}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="heureFin">
                Heure de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="heureFin"
                type="time"
                value={formData.heureFin}
                onChange={(e) => handleInputChange("heureFin", e.target.value)}
                required
                className={errors.heureFin ? "border-red-500" : ""}
              />
              {errors.heureFin && (
                <p className="text-sm text-red-600">{errors.heureFin}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salle">Salle</Label>
            <Input
              id="salle"
              type="text"
              value={formData.salle}
              onChange={(e) => handleInputChange("salle", e.target.value)}
              placeholder="Entrez la salle (optionnel)"
              className={errors.salle ? "border-red-500" : ""}
            />
            {errors.salle && (
              <p className="text-sm text-red-600">{errors.salle}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contenu">Contenu</Label>
            <Textarea
              id="contenu"
              value={formData.contenu}
              onChange={(e) => handleInputChange("contenu", e.target.value)}
              placeholder="Entrez le contenu de la séance (optionnel)"
              rows={4}
              className={errors.contenu ? "border-red-500" : ""}
            />
            {errors.contenu && (
              <p className="text-sm text-red-600">{errors.contenu}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="complement">Complément d'information</Label>
            <Textarea
              id="complement"
              value={formData.complement}
              onChange={(e) => handleInputChange("complement", e.target.value)}
              placeholder="Informations complémentaires (optionnel)"
              rows={2}
              className={errors.complement ? "border-red-500" : ""}
            />
            {errors.complement && (
              <p className="text-sm text-red-600">{errors.complement}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isPending || !formData.titre.trim() || !formData.moduleId || !formData.enseignantId}
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
