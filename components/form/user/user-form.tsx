"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createUser, updateUser } from "@/lib/actions/user";
import { getAllDepartements } from "@/lib/actions/departement";
import { getAllFilieres } from "@/lib/actions/filiere";
import { getAllRoles } from "@/lib/actions/role";
import { CreateUser, UpdateUser } from "@/lib/zodshema";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";

interface UserFormProps {
  initialData?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    actif: boolean;
    departementId?: string | null;
    filiereId?: string | null;
    roles?: Array<{id: string; nom: string}>;
  };
  mode: "create" | "edit";
}

export function UserForm({ initialData, mode }: UserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [departements, setDepartements] = useState<Array<{id: string; nom: string}>>([]);
  const [filieres, setFilieres] = useState<Array<{id: string; nom: string; departement: {nom: string}}>>([]);
  const [roles, setRoles] = useState<Array<{id: string; nom: string; type: string}>>([]);
  const [filteredFilieres, setFilteredFilieres] = useState<Array<{id: string; nom: string}>>([]);
  
  const [formData, setFormData] = useState({
    nom: initialData?.nom || "",
    prenom: initialData?.prenom || "",
    email: initialData?.email || "",
    password: "",
    actif: initialData?.actif ?? true,
    departementId: initialData?.departementId || "",
    filiereId: initialData?.filiereId || "",
  });

  useEffect(() => {
    const loadData = async () => {
      const [deptsResult, filieresResult, rolesResult] = await Promise.all([
        getAllDepartements(),
        getAllFilieres(),
        getAllRoles()
      ]);
      
      if (deptsResult.success) setDepartements(deptsResult.data || []);
      if (filieresResult.success) setFilieres(filieresResult.data || []);
      if (rolesResult.success) setRoles(rolesResult.data || []);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (formData.departementId) {
      const filtered = filieres.filter(f => f.departement.nom === departements.find(d => d.id === formData.departementId)?.nom);
      setFilteredFilieres(filtered);
      // Reset filiere if not in the selected department
      if (formData.filiereId && !filtered.some(f => f.id === formData.filiereId)) {
        setFormData(prev => ({ ...prev, filiereId: "" }));
      }
    } else {
      setFilteredFilieres([]);
      setFormData(prev => ({ ...prev, filiereId: "" }));
    }
  }, [formData.departementId, filieres, departements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === "create" && !formData.password) {
      setErrors({ password: "Le mot de passe est requis pour créer un utilisateur" });
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const data: CreateUser = {
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            password: formData.password,
            actif: formData.actif,
            departementId: formData.departementId || null,
            filiereId: formData.filiereId || null,
          };
          
          const result = await createUser(data);
          
          if (result.success) {
            router.push("/users");
            router.refresh();
          } else {
            setErrors({ general: result.error || "Une erreur est survenue" });
          }
        } else if (mode === "edit" && initialData?.id) {
          const data: UpdateUser = {
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            actif: formData.actif,
            departementId: formData.departementId || null,
            filiereId: formData.filiereId || null,
          };
          
          // Add password only if provided
          if (formData.password) {
            data.password = formData.password;
          }
          
          const result = await updateUser(initialData.id, data);
          
          if (result.success) {
            router.push("/users");
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Créer un utilisateur" : "Modifier l'utilisateur"}
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
              <Label htmlFor="nom">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                placeholder="Entrez le nom"
                required
                className={errors.nom ? "border-red-500" : ""}
              />
              {errors.nom && (
                <p className="text-sm text-red-600">{errors.nom}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prenom">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prenom"
                type="text"
                value={formData.prenom}
                onChange={(e) => handleInputChange("prenom", e.target.value)}
                placeholder="Entrez le prénom"
                required
                className={errors.prenom ? "border-red-500" : ""}
              />
              {errors.prenom && (
                <p className="text-sm text-red-600">{errors.prenom}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Entrez l'adresse email"
              required
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Mot de passe {mode === "create" && <span className="text-red-500">*</span>}
              {mode === "edit" && <span className="text-sm text-gray-500">(laisser vide pour ne pas changer)</span>}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={mode === "create" ? "Entrez le mot de passe" : "Nouveau mot de passe (optionnel)"}
                required={mode === "create"}
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="departementId">Département</Label>
              <Select
                value={formData.departementId}
                onValueChange={(value) => handleInputChange("departementId", value)}
              >
                <SelectTrigger className={errors.departementId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionnez un département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun département</SelectItem>
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
              <Label htmlFor="filiereId">Filière</Label>
              <Select
                value={formData.filiereId}
                onValueChange={(value) => handleInputChange("filiereId", value)}
                disabled={!formData.departementId}
              >
                <SelectTrigger className={errors.filiereId ? "border-red-500" : ""}>
                  <SelectValue placeholder={formData.departementId ? "Sélectionnez une filière" : "Sélectionnez d'abord un département"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune filière</SelectItem>
                  {filteredFilieres.map((filiere) => (
                    <SelectItem key={filiere.id} value={filiere.id}>
                      {filiere.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.filiereId && (
                <p className="text-sm text-red-600">{errors.filiereId}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actif">Statut</Label>
            <Select
              value={formData.actif.toString()}
              onValueChange={(value) => handleInputChange("actif", value === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Actif</SelectItem>
                <SelectItem value="false">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isPending || !formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim()}
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
