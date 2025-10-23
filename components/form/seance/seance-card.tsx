"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteSeance } from "@/lib/actions/seance";
import { 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  Clock,
  MapPin,
  Loader2,
  BookOpen,
  GraduationCap,
  Building2
} from "lucide-react";

interface SeanceCardProps {
  seance: {
    id: string;
    titre: string;
    contenu?: string | null;
    dateseance: Date;
    heureDebut: Date;
    heureFin: Date;
    salle?: string | null;
    type: string;
    complement?: string | null;
    module: {
      id: string;
      nom: string;
      code: string;
      filiere: {
        id: string;
        nom: string;
        departement?: {
          id: string;
          nom: string;
        };
      };
    };
    enseignant: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
    };
  };
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SeanceCard({ 
  seance, 
  showActions = true, 
  onEdit, 
  onDelete 
}: SeanceCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(seance.id);
    } else {
      router.push(`/seances/${seance.id}/edit`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(seance.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteSeance(seance.id);
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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      COURS: "bg-blue-100 text-blue-800",
      TD: "bg-green-100 text-green-800",
      TP: "bg-purple-100 text-purple-800",
      EXAMEN: "bg-red-100 text-red-800",
      CONFERENCE: "bg-orange-100 text-orange-800",
      SEMINAIRE: "bg-indigo-100 text-indigo-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{seance.titre}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(seance.type)}`}>
                  {seance.type}
                </span>
              </div>
              <CardDescription className="flex items-center gap-1 mt-1">
                <BookOpen className="w-3 h-3" />
                {seance.module.code} - {seance.module.nom}
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
        {/* Date et heure */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Date</p>
              <p className="text-sm text-blue-700">{formatDate(seance.dateseance)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <Clock className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs font-medium text-green-900">Début</p>
                <p className="text-sm font-bold text-green-600">{formatTime(seance.heureDebut)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs font-medium text-orange-900">Fin</p>
                <p className="text-sm font-bold text-orange-600">{formatTime(seance.heureFin)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Salle */}
        {seance.salle && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-3">
            <MapPin className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs font-medium text-gray-700">Salle</p>
              <p className="text-sm font-bold text-gray-900">{seance.salle}</p>
            </div>
          </div>
        )}

        {/* Enseignant */}
        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg mb-4">
          <User className="w-4 h-4 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-purple-900">Enseignant</p>
            <p className="text-sm text-purple-700">
              {seance.enseignant.prenom} {seance.enseignant.nom}
            </p>
          </div>
        </div>

        {/* Contenu */}
        {seance.contenu && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Contenu:</p>
            <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
              {seance.contenu}
            </p>
          </div>
        )}

        {/* Complément */}
        {seance.complement && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Informations complémentaires:</p>
            <p className="text-sm text-muted-foreground bg-yellow-50 p-2 rounded">
              {seance.complement}
            </p>
          </div>
        )}

        {/* Filière et département */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-4 pt-3 border-t">
          <div className="flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            <span>{seance.module.filiere.nom}</span>
          </div>
          {seance.module.filiere.departement && (
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>{seance.module.filiere.departement.nom}</span>
            </div>
          )}
        </div>
      </CardContent>

      {showDeleteConfirm && (
        <CardFooter className="border-t bg-red-50">
          <div className="w-full">
            <p className="text-sm text-red-800 mb-3">
              Êtes-vous sûr de vouloir supprimer cette séance ? Cette action est irréversible.
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
