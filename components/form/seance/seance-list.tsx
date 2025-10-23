"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SeanceCard } from "./seance-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSeances } from "@/lib/actions/seance";
import { getAllModules } from "@/lib/actions/module";
import { TypeSeanceSchema } from "@/lib/zodshema";
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Calendar,
  SortAsc,
  SortDesc,
  Filter
} from "lucide-react";

interface SeanceListProps {
  initialData?: {
    seances: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function SeanceList({ initialData }: SeanceListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [seances, setSeances] = useState(initialData?.seances || []);
  const [modules, setModules] = useState<Array<{
    id: string; 
    nom: string; 
    code: string;
    filiere: {nom: string; departement: {nom: string}};
  }>>([]);
  const [pagination, setPagination] = useState(initialData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    moduleId: searchParams.get("moduleId") || "",
    type: searchParams.get("type") || "",
    dateDebut: searchParams.get("dateDebut") || "",
    dateFin: searchParams.get("dateFin") || "",
    sortBy: searchParams.get("sortBy") || "dateseance",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    page: parseInt(searchParams.get("page") || "1"),
  });

  useEffect(() => {
    const loadModules = async () => {
      const result = await getAllModules();
      if (result.success) {
        setModules(result.data || []);
      }
    };
    loadModules();
  }, []);

  const loadSeances = () => {
    startTransition(async () => {
      try {
        const result = await getSeances({
          page: filters.page,
          limit: pagination.limit,
          search: filters.search || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        if (result.success) {
          setSeances(result.data || []);
          setPagination(result.pagination || pagination);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des séances:", error);
      }
    });
  };

  useEffect(() => {
    if (!initialData) {
      loadSeances();
    }
  }, [filters]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
    updateURL({ search: value, page: 1 });
  };

  const handleModuleFilter = (value: string) => {
    setFilters(prev => ({ ...prev, moduleId: value, page: 1 }));
    updateURL({ moduleId: value, page: 1 });
  };

  const handleTypeFilter = (value: string) => {
    setFilters(prev => ({ ...prev, type: value, page: 1 }));
    updateURL({ type: value, page: 1 });
  };

  const handleDateFilter = (field: "dateDebut" | "dateFin", value: string) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
    updateURL({ [field]: value, page: 1 });
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
    router.push("/seances/nouveau");
  };

  const handleEdit = (id: string) => {
    router.push(`/seances/${id}/edit`);
  };

  const handleDelete = () => {
    loadSeances(); // Reload after delete
  };

  const typeSeanceOptions = TypeSeanceSchema.options;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Séances</h1>
          <p className="text-gray-600">
            Gérez les séances de votre établissement
          </p>
        </div>
        <Button onClick={handleCreateNew} className="w-fit">
          <Plus className="w-4 h-4" />
          Nouvelle séance
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
                placeholder="Rechercher par titre, contenu, salle ou enseignant..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtres en ligne */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                value={filters.moduleId}
                onValueChange={handleModuleFilter}
              >
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tous les modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.code} - {module.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.type}
                onValueChange={handleTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les types</SelectItem>
                  {typeSeanceOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Date début"
                value={filters.dateDebut}
                onChange={(e) => handleDateFilter("dateDebut", e.target.value)}
              />

              <Input
                type="date"
                placeholder="Date fin"
                value={filters.dateFin}
                onChange={(e) => handleDateFilter("dateFin", e.target.value)}
              />
            </div>
            
            {/* Tri */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("dateseance")}
                className="flex items-center gap-2"
              >
                Date
                {filters.sortBy === "dateseance" && (
                  filters.sortOrder === "asc" ? 
                    <SortAsc className="w-4 h-4" /> : 
                    <SortDesc className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("titre")}
                className="flex items-center gap-2"
              >
                Titre
                {filters.sortBy === "titre" && (
                  filters.sortOrder === "asc" ? 
                    <SortAsc className="w-4 h-4" /> : 
                    <SortDesc className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("type")}
                className="flex items-center gap-2"
              >
                Type
                {filters.sortBy === "type" && (
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
          <span className="ml-2">Chargement des séances...</span>
        </div>
      )}

      {/* Results */}
      {!isPending && (
        <>
          {seances.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {seances.map((seance) => (
                  <SeanceCard
                    key={seance.id}
                    seance={seance}
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
                    {pagination.total} séances
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
                <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune séance trouvée
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {filters.search 
                    ? "Aucune séance ne correspond à votre recherche." 
                    : "Commencez par créer votre première séance."
                  }
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4" />
                  Créer une séance
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
