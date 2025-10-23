"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteRole } from "@/lib/actions/role";
import { 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  Loader2,
  Shield,
  Crown,
  User,
  GraduationCap,
  Building2,
  Settings
} from "lucide-react";

interface RoleCardProps {
  role: {
    id: string;
    nom: string;
    type: string;
    description?: string | null;
    createdAt: Date;
    users?: Array<{
      id: string;
      nom: string;
      prenom: string;
      email: string;
    }>;
  };
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function RoleCard({ 
  role, 
  showActions = true, 
  onEdit, 
  onDelete 
}: RoleCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(role.id);
    } else {
      router.push(`/roles/${role.id}/edit`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(role.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteRole(role.id);
        if (result.success) {
          router.refresh();
        } else {
          console.error("Erreur lors de la suppression:", result.error);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      } finally {
        setShowDeleteConfirm(false);
      }
    });
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      ENSEIGNANT: <User className="w-5 h-5 text-blue-600" />,
      ADMINISTRATEUR: <Settings className="w-5 h-5 text-purple-600" />,
      CHEF_DE_FILIERE: <GraduationCap className="w-5 h-5 text-orange-600" />,
      CHEF_DE_DEPARTEMENT: <Building2 className="w-5 h-5 text-indigo-600" />,
      DIRECTEUR_GENERAL: <Crown className="w-5 h-5 text-red-600" />,
    };
    return icons[type as keyof typeof icons] || <Shield className="w-5 h-5 text-gray-600" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      ENSEIGNANT: "bg-blue-100 text-blue-800 border-blue-200",
      ADMINISTRATEUR: "bg-purple-100 text-purple-800 border-purple-200",
      CHEF_DE_FILIERE: "bg-orange-100 text-orange-800 border-orange-200",
      CHEF_DE_DEPARTEMENT: "bg-indigo-100 text-indigo-800 border-indigo-200",
      DIRECTEUR_GENERAL: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeDescription = (type: string) => {
    const descriptions = {
      ENSEIGNANT: "Peut enseigner des modules et gérer ses séances",
      ADMINISTRATEUR: "Accès complet à l'administration du système",
      CHEF_DE_FILIERE: "Gère une filière spécifique et ses modules",
      CHEF_DE_DEPARTEMENT: "Gère un département et ses filières",
      DIRECTEUR_GENERAL: "Accès complet à tous les départements",
    };
    return descriptions[type as keyof typeof descriptions] || "";
  };

  const userCount = role.users?.length || 0;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {getTypeIcon(role.type)}
            </div>
            <div>
              <CardTitle className="text-lg">{role.nom}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(role.type)}`}>
                  {role.type}
                </span>
              </div>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                Créé le {new Date(role.createdAt).toLocaleDateString("fr-FR")}
              </CardDescription>
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleEdit}
                disabled={isPending}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Description du type */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {getTypeDescription(role.type)}
          </p>
        </div>

        {/* Description personnalisée */}
        {role.description && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Description :</p>
            <p className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
              {role.description}
            </p>
          </div>
        )}

        {/* Statistiques */}
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <Users className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">Utilisateurs assignés</p>
            <p className="text-lg font-bold text-green-600">{userCount}</p>
          </div>
        </div>

        {/* Utilisateurs assignés */}
        {role.users && role.users.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Utilisateurs :</p>
            <div className="space-y-1">
              {role.users.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="text-xs p-2 bg-gray-50 rounded flex justify-between items-center"
                >
                  <span className="font-medium">{user.prenom} {user.nom}</span>
                  <span className="text-gray-500">{user.email}</span>
                </div>
              ))}
              {role.users.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{role.users.length - 3} autres utilisateurs
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {showDeleteConfirm && (
        <CardFooter className="border-t bg-red-50">
          <div className="w-full">
            <p className="text-sm text-red-800 mb-3">
              Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.
              {userCount > 0 && (
                <span className="block mt-1 font-medium">
                  Attention : {userCount} utilisateur(s) sont assignés à ce rôle.
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirmer"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
