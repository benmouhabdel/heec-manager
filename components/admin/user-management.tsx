"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllUsersForAdmin, adminToggleUserStatus } from "@/lib/actions/admin";
import { User, TypeRole } from "@prisma/client";
import { Search, Mail, MapPin, BookOpen, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface UserWithRelations extends User {
  roles: Array<{ id: string; nom: string; type: TypeRole }>;
  departement?: { id: string; nom: string } | null;
  filiere?: { id: string; nom: string } | null;
  modules: Array<{ id: string; nom: string; code: string }>;
  seancesEnseignees: Array<{
    id: string;
    titre: string;
    module: { nom: string };
  }>;
}

interface UserManagementProps {
  adminUserId: string;
}

const getRoleColor = (type: TypeRole) => {
  switch (type) {
    case TypeRole.ADMINISTRATEUR:
      return "bg-red-100 text-red-800 border-red-200";
    case TypeRole.DIRECTEUR_GENERAL:
      return "bg-purple-100 text-purple-800 border-purple-200";
    case TypeRole.CHEF_DE_DEPARTEMENT:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case TypeRole.CHEF_DE_FILIERE:
      return "bg-green-100 text-green-800 border-green-200";
    case TypeRole.ENSEIGNANT:
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function UserManagement({ adminUserId }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    loadUsers();
  }, [adminUserId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsersForAdmin(adminUserId);
      setUsers(usersData);
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const result = await adminToggleUserStatus(adminUserId, userId);
      if (result.success) {
        toast.success(result.message);
        await loadUsers(); // Recharger la liste
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && user.actif) ||
      (statusFilter === "inactive" && !user.actif);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des Utilisateurs
          </CardTitle>
          <CardDescription>
            Gérez les comptes utilisateurs, leurs statuts et leurs informations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom, prénom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className={`transition-all ${!user.actif ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {user.prenom} {user.nom}
                          </h3>
                          <div className="flex gap-1">
                            {user.roles.map((role) => (
                              <Badge
                                key={role.id}
                                variant="outline"
                                className={getRoleColor(role.type)}
                              >
                                {role.nom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                          
                          {user.departement && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {user.departement.nom}
                              {user.filiere && ` → ${user.filiere.nom}`}
                            </div>
                          )}
                          
                          {user.modules.length > 0 && (
                            <div className="flex items-center gap-2 md:col-span-2">
                              <BookOpen className="h-4 w-4" />
                              <span>Modules: </span>
                              <div className="flex flex-wrap gap-1">
                                {user.modules.map((module) => (
                                  <Badge key={module.id} variant="secondary" className="text-xs">
                                    {module.code}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`status-${user.id}`} className="text-sm">
                            {user.actif ? 'Actif' : 'Inactif'}
                          </Label>
                          <Switch
                            id={`status-${user.id}`}
                            checked={user.actif}
                            onCheckedChange={() => handleToggleStatus(user.id)}
                            disabled={user.id === adminUserId}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {user.seancesEnseignees.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          Séances récentes ({user.seancesEnseignees.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {user.seancesEnseignees.slice(0, 3).map((seance) => (
                            <Badge key={seance.id} variant="outline" className="text-xs">
                              {seance.module.nom}
                            </Badge>
                          ))}
                          {user.seancesEnseignees.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.seancesEnseignees.length - 3} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
