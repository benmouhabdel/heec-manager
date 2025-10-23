"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ModuleCard } from "./module-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getModules } from "@/lib/actions/module";
import { getAllFilieres } from "@/lib/actions/filiere";
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  BookOpen,
  SortAsc,
  SortDesc,
  Filter
} from "lucide-react";

interface ModuleListProps {
  initialData?: {
    modules: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function ModuleList({ initialData }: ModuleListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [modules, setModules] = useState(initialData?.modules || []);
  const [filieres, setFilieres] = useState<Array<{id: string; nom: string; departement: {nom: string}}>>([]);
  const [pagination, setPagination] = useState(initialData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    filiereId: searchParams.get("filiereId") || "",
    sortBy: searchParams.get("sortBy") || "nom",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
    page: parseInt(searchParams.get("page") || "1"),
  });

  useEffect(() => {
    const loadFilieres = async () => {
      const result = await getAllFilieres();
      if (result.success) {
        setFilieres(result.data || []);
      }
    };
    loadFilieres();
  }, []);

  const loadModules = () => {
    startTransition(async () => {
      try {
        const result = await getModules({
          page: filters.page,
          limit: pagination.limit,
          search: filters.search || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        if (result.success) {
          setModules(result.data || []);
          setPagination(result.pagination || pagination);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des modules:", error);
      }
    });
  };

  useEffect(() => {
    if (!initialData) {
      loadModules();
    }
  }, [filters]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
    updateURL({ search: value, page: 1 });
  };

  const handleFiliereFilter = (value: string) => {
    setFilters(prev => ({ ...prev, filiereId: value, page: 1 }));
    updateURL({ filiereId: value, page: 1 });
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
    router.push("/modules/nouveau");
  };

  const handleEdit = (id: string) => {
    router.push(`/modules/${id}/edit`);
  };

  const handleDelete = () => {
    loadModules(); // Reload after delete
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
          <p className="text-gray-600">
            Gérez les modules de votre établissement
          </p>
        </div>
        <Button onClick={handleCreateNew} className="w-fit">
          <Plus className="w-4 h-4" />
          Nouveau module
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche et filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom, code, description ou filière..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full sm:w-64">
                <Select
                  value={filters.filiereId}
                  onValueChange={handleFiliereFilter}
                >
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Toutes les filières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les filières</SelectItem>
                    {filieres.map((filiere) => (
                      <SelectItem key={filiere.id} value={filiere.id}>
                        {filiere.nom} ({filiere.departement.nom})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
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
                onClick={() => handleSort("code")}
                className="flex items-center gap-2"
              >
                Code
                {filters.sortBy === "code" && (
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
          <span className="ml-2">Chargement des modules...</span>
        </div>
      )}

      {/* Results */}
      {!isPending && (
        <>
          {modules.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
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
                    {pagination.total} modules
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
                <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun module trouvé
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {filters.search 
                    ? "Aucun module ne correspond à votre recherche." 
                    : "Commencez par créer votre premier module."
                  }
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4" />
                  Créer un module
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
