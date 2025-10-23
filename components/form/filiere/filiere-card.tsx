"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteFiliere } from "@/lib/actions/filiere";
import { 
  Edit, 
  Trash2, 
  Users, 
  BookOpen, 
  Calendar,
  Loader2,
  GraduationCap,
  Building2
} from "lucide-react";

interface FiliereCardProps {
  filiere: {
    id: string;
    nom: string;
    description?: string | null;
    createdAt: Date;
    departement: {
      id: string;
      nom: string;
    };
    _count?: {
      modules: number;
      users: number;
    };
    modules?: Array<{
      id: string;
      nom: string;
      code: string;
    }>;
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

export function FiliereCard({ 
  filiere, 
  showActions = true, 
  onEdit, 
  onDelete 
}: FiliereCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(filiere.id);
    } else {
      router.push(`/filieres/${filiere.id}/edit`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(filiere.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteFiliere(filiere.id);
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

  const moduleCount = filiere._count?.modules || filiere.modules?.length || 0;
  const userCount = filiere._count?.users || filiere.users?.length || 0;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{filiere.nom}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3" />
                {filiere.departement.nom}
              </CardDescription>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                Créé le {new Date(filiere.createdAt).toLocaleDateString("fr-FR")}
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
        {filiere.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {filiere.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900">Modules</p>
              <p className="text-lg font-bold text-purple-600">{moduleCount}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Users className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Utilisateurs</p>
              <p className="text-lg font-bold text-green-600">{userCount}</p>
            </div>
          </div>
        </div>

        {filiere.modules && filiere.modules.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Modules associés:</p>
            <div className="flex flex-wrap gap-2">
              {filiere.modules.slice(0, 3).map((module) => (
                <span
                  key={module.id}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {module.code} - {module.nom}
                </span>
              ))}
              {filiere.modules.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  +{filiere.modules.length - 3} autres
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {showDeleteConfirm && (
        <CardFooter className="border-t bg-red-50">
          <div className="w-full">
            <p className="text-sm text-red-800 mb-3">
              Êtes-vous sûr de vouloir supprimer cette filière ? Cette action est irréversible.
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
