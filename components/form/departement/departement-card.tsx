"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteDepartement } from "@/lib/actions/departement";
import { 
  Edit, 
  Trash2, 
  Users, 
  GraduationCap, 
  Calendar,
  Loader2,
  Building2
} from "lucide-react";

interface DepartementCardProps {
  departement: {
    id: string;
    nom: string;
    description?: string | null;
    createdAt: Date;
    _count?: {
      filieres: number;
      users: number;
    };
    filieres?: Array<{
      id: string;
      nom: string;
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

export function DepartementCard({ 
  departement, 
  showActions = true, 
  onEdit, 
  onDelete 
}: DepartementCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(departement.id);
    } else {
      router.push(`/departements/${departement.id}/edit`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(departement.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteDepartement(departement.id);
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

  const filiereCount = departement._count?.filieres || departement.filieres?.length || 0;
  const userCount = departement._count?.users || departement.users?.length || 0;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{departement.nom}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                Créé le {new Date(departement.createdAt).toLocaleDateString("fr-FR")}
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
        {departement.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {departement.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Filières</p>
              <p className="text-lg font-bold text-blue-600">{filiereCount}</p>
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

        {departement.filieres && departement.filieres.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Filières associées:</p>
            <div className="flex flex-wrap gap-2">
              {departement.filieres.slice(0, 3).map((filiere) => (
                <span
                  key={filiere.id}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {filiere.nom}
                </span>
              ))}
              {departement.filieres.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  +{departement.filieres.length - 3} autres
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
              Êtes-vous sûr de vouloir supprimer ce département ? Cette action est irréversible.
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
