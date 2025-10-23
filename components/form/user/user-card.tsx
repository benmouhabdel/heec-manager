"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteUser, toggleUserStatus } from "@/lib/actions/user";
import { 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Calendar,
  Loader2,
  Shield,
  Building2,
  GraduationCap,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX
} from "lucide-react";

interface UserCardProps {
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    actif: boolean;
    createdAt: Date;
    departement?: {
      id: string;
      nom: string;
    } | null;
    filiere?: {
      id: string;
      nom: string;
    } | null;
    roles?: Array<{
      id: string;
      nom: string;
      type: string;
    }>;
  };
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function UserCard({ 
  user, 
  showActions = true, 
  onEdit, 
  onDelete 
}: UserCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(user.id);
    } else {
      router.push(`/users/${user.id}/edit`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(user.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleToggleStatus = () => {
    startTransition(async () => {
      try {
        const result = await toggleUserStatus(user.id);
        if (result.success) {
          router.refresh();
        } else {
          console.error("Erreur lors du changement de statut:", result.error);
        }
      } catch (error) {
        console.error("Erreur lors du changement de statut:", error);
      }
    });
  };

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteUser(user.id);
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

  const getStatusColor = (actif: boolean) => {
    return actif 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getRoleTypeColor = (type: string) => {
    const colors = {
      ENSEIGNANT: "bg-blue-100 text-blue-800",
      ADMINISTRATEUR: "bg-purple-100 text-purple-800",
      CHEF_DE_FILIERE: "bg-orange-100 text-orange-800",
      CHEF_DE_DEPARTEMENT: "bg-indigo-100 text-indigo-800",
      DIRECTEUR_GENERAL: "bg-red-100 text-red-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${user.actif ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
              <User className={`w-5 h-5 ${user.actif ? 'text-green-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">
                {user.prenom} {user.nom}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </CardDescription>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user.actif)}`}>
                  {user.actif ? (
                    <>
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      Actif
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 inline mr-1" />
                      Inactif
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleToggleStatus}
                disabled={isPending}
                title={user.actif ? "Désactiver" : "Activer"}
              >
                {user.actif ? (
                  <UserX className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </Button>
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
        {/* Affiliation */}
        <div className="space-y-3 mb-4">
          {user.departement && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-blue-900">Département</p>
                <p className="text-sm text-blue-700">{user.departement.nom}</p>
              </div>
            </div>
          )}
          
          {user.filiere && (
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs font-medium text-purple-900">Filière</p>
                <p className="text-sm text-purple-700">{user.filiere.nom}</p>
              </div>
            </div>
          )}
        </div>

        {/* Rôles */}
        {user.roles && user.roles.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-gray-600" />
              <p className="text-sm font-medium">Rôles</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span
                  key={role.id}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleTypeColor(role.type)}`}
                >
                  {role.nom}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Date de création */}
        <CardDescription className="flex items-center gap-1 text-xs">
          <Calendar className="w-3 h-3" />
          Créé le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
        </CardDescription>
      </CardContent>

      {showDeleteConfirm && (
        <CardFooter className="border-t bg-red-50">
          <div className="w-full">
            <p className="text-sm text-red-800 mb-3">
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
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
