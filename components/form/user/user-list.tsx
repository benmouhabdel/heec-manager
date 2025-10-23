"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserCard } from "./user-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from "@/lib/actions/user";
import { getAllDepartements } from "@/lib/actions/departement";
import { getAllFilieres } from "@/lib/actions/filiere";
import { getAllRoles } from "@/lib/actions/role";
import { TypeRoleSchema } from "@/lib/zodshema";
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Users,
  SortAsc,
  SortDesc,
  Filter
} from "lucide-react";

interface UserListProps {
  initialData?: {
    users: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function UserList({ initialData }: UserListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [users, setUsers] = useState(initialData?.users || []);
  const [departements, setDepartements] = useState<Array<{id: string; nom: string}>>([]);
  const [filieres, setFilieres] = useState<Array<{id: string; nom: string; departement: {nom: string}}>>([]);
  const [roles, setRoles] = useState<Array<{id: string; nom: string; type: string}>>([]);
  const [pagination, setPagination] = useState(initialData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    departementId: searchParams.get("departementId") || "",
    filiereId: searchParams.get("filiereId") || "",
    roleType: searchParams.get("roleType") || "",
    actif: searchParams.get("actif") || "",
    sortBy: searchParams.get("sortBy") || "nom",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
    page: parseInt(searchParams.get("page") || "1"),
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

  const loadUsers = () => {
    startTransition(async () => {
      try {
        const result = await getUsers({
          page: filters.page,
          limit: pagination.limit,
          search: filters.search || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        if (result.success) {
          setUsers(result.data || []);
          setPagination(result.pagination || pagination);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      }
    });
  };

  useEffect(() => {
    if (!initialData) {
      loadUsers();
    }
  }, [filters]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
    updateURL({ search: value, page: 1 });
  };

  const handleDepartementFilter = (value: string) => {
    setFilters(prev => ({ ...prev, departementId: value, filiereId: "", page: 1 }));
    updateURL({ departementId: value, filiereId: "", page: 1 });
  };

  const handleFiliereFilter = (value: string) => {
    setFilters(prev => ({ ...prev, filiereId: value, page: 1 }));
    updateURL({ filiereId: value, page: 1 });
  };

  const handleRoleTypeFilter = (value: string) => {
    setFilters(prev => ({ ...prev, roleType: value, page: 1 }));
    updateURL({ roleType: value, page: 1 });
  };

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, actif: value, page: 1 }));
    updateURL({ actif: value, page: 1 });
  };

  const handleSort = (field: string) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: newOrder, page: 1 }));
    updateURL({ sortBy: field, sortOrder: newOrder, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    updateURL({ page });
  };

  const updateURL = (params: Partial<typeof filters>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries({ ...filters, ...params }).forEach(([key, value]) => {
      if (value && value !== "") {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });

    router.push(`?${newParams.toString()}`);
  };

  const handleCreateNew = () => {
    router.push("/users/nouveau");
  };

  const handleEdit = (id: string) => {
    router.push(`/users/${id}/edit`);
  };

  const handleDelete = () => {
    loadUsers(); // Reload after delete
  };

  const filteredFilieres = filters.departementId 
    ? filieres.filter(f => f.departement.nom === departements.find(d => d.id === filters.departementId)?.nom)
    : filieres;

  const typeRoleOptions = TypeRoleSchema.options;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600">
            Gérez les utilisateurs de votre établissement
          </p>
        </div>
        <Button onClick={handleCreateNew} className="w-fit">
          <Plus className="w-4 h-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche et filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par nom, prénom ou email..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtres en ligne */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select
                value={filters.departementId}
                onValueChange={handleDepartementFilter}
              >
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tous les départements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les départements</SelectItem>
                  {departements.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.filiereId}
                onValueChange={handleFiliereFilter}
                disabled={!filters.departementId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={filters.departementId ? "Toutes les filières" : "Sélectionnez un département"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les filières</SelectItem>
                  {filteredFilieres.map((filiere) => (
                    <SelectItem key={filiere.id} value={filiere.id}>
                      {filiere.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.roleType}
                onValueChange={handleRoleTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les rôles</SelectItem>
                  {typeRoleOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.actif}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="true">Actifs</SelectItem>
                  <SelectItem value="false">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Tri */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("nom")}
                className="flex items-center gap-2"
              >
                Nom
                {filters.sortBy === "nom" && (
                  filters.sortOrder === "asc" ? 
                    <SortAsc className="w-4 h-4" /> : 
                    <SortDesc className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("email")}
                className="flex items-center gap-2"
              >
                Email
                {filters.sortBy === "email" && (
                  filters.sortOrder === "asc" ? 
                    <SortAsc className="w-4 h-4" /> : 
                    <SortDesc className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("createdAt")}
                className="flex items-center gap-2"
              >
                Date
                {filters.sortBy === "createdAt" && (
                  filters.sortOrder === "asc" ? 
                    <SortAsc className="w-4 h-4" /> : 
                    <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isPending && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Chargement des utilisateurs...</span>
        </div>
      )}

      {/* Results */}
      {!isPending && (
        <>
          {users.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
                    {pagination.total} utilisateurs
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Précédent
                    </Button>
                    
                    <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                      Page {pagination.page} sur {pagination.totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun utilisateur trouvé
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {filters.search 
                    ? "Aucun utilisateur ne correspond à votre recherche." 
                    : "Commencez par créer votre premier utilisateur."
                  }
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4" />
                  Créer un utilisateur
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
