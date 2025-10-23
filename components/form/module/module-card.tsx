"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteModule } from "@/lib/actions/module";
import { 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  Clock,
  Loader2,
  BookOpen,
  GraduationCap,
  Building2,
  Award
} from "lucide-react";

interface ModuleCardProps {
  module: {
    id: string;
    nom: string;
    code: string;
    description?: string | null;
    credits?: number | null;
    heures?: number | null;
    createdAt: Date;
    filiere: {
      id: string;
      nom: string;
      departement: {
        id: string;
        nom: string;
      };
    };
    _count?: {
      users: number;
      seances: number;
    };
    users?: Array<{
      id: string;
      nom: string;
      prenom: string;
      email: string;
    }>;
    seances?: Array<{
      id: string;
      titre: string;
      dateseance: Date;
      type: string;
    }>;
  };
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ModuleCard({ 
  module, 
  showActions = true, 
  onEdit, 
  onDelete 
}: ModuleCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(module.id);
    } else {
      router.push(`/modules/${module.id}/edit`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(module.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteModule(module.id);
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

  const userCount = module._count?.users || module.users?.length || 0;
  const seanceCount = module._count?.seances || module.seances?.length || 0;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{module.nom}</CardTitle>
              <CardDescription className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1 w-fit">
                {module.code}
              </CardDescription>
              <CardDescription className="flex items-center gap-1 mt-1">
                <GraduationCap className="w-3 h-3" />
                {module.filiere.nom}
              </CardDescription>
              <CardDescription className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {module.filiere.departement.nom}
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
        {module.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {module.description}
          </p>
        )}

        {/* Informations du module */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {module.credits && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
              <Award className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs font-medium text-orange-900">Crédits</p>
                <p className="text-sm font-bold text-orange-600">{module.credits}</p>
              </div>
            </div>
          )}
          
          {module.heures && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-blue-900">Heures</p>
                <p className="text-sm font-bold text-blue-600">{module.heures}h</p>
              </div>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Users className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Enseignants</p>
              <p className="text-lg font-bold text-green-600">{userCount}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-indigo-900">Séances</p>
              <p className="text-lg font-bold text-indigo-600">{seanceCount}</p>
            </div>
          </div>
        </div>

        {/* Séances récentes */}
        {module.seances && module.seances.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Séances récentes:</p>
            <div className="space-y-1">
              {module.seances.slice(0, 2).map((seance) => (
                <div
                  key={seance.id}
                  className="text-xs p-2 bg-gray-50 rounded flex justify-between items-center"
                >
                  <span className="font-medium">{seance.titre}</span>
                  <span className="text-gray-500">
                    {new Date(seance.dateseance).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
              {module.seances.length > 2 && (
                <p className="text-xs text-gray-500 text-center">
                  +{module.seances.length - 2} autres séances
                </p>
              )}
            </div>
          </div>
        )}

        <CardDescription className="flex items-center gap-1 mt-4 text-xs">
          <Calendar className="w-3 h-3" />
          Créé le {new Date(module.createdAt).toLocaleDateString("fr-FR")}
        </CardDescription>
      </CardContent>

      {showDeleteConfirm && (
        <CardFooter className="border-t bg-red-50">
          <div className="w-full">
            <p className="text-sm text-red-800 mb-3">
              Êtes-vous sûr de vouloir supprimer ce module ? Cette action est irréversible.
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
