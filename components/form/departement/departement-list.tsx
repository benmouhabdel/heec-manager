"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DepartementCard } from "./departement-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDepartements } from "@/lib/actions/departement";
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Building2,
  SortAsc,
  SortDesc
} from "lucide-react";

interface DepartementListProps {
  initialData?: {
    departements: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function DepartementList({ initialData }: DepartementListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [departements, setDepartements] = useState(initialData?.departements || []);
  const [pagination, setPagination] = useState(initialData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    sortBy: searchParams.get("sortBy") || "nom",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
    page: parseInt(searchParams.get("page") || "1"),
  });

  const loadDepartements = () => {
    startTransition(async () => {
      try {
        const result = await getDepartements({
          page: filters.page,
          limit: pagination.limit,
          search: filters.search || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        if (result.success) {
          setDepartements(result.data || []);
          setPagination(result.pagination || pagination);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des départements:", error);
      }
    });
  };

  useEffect(() => {
    if (!initialData) {
      loadDepartements();
    }
  }, [filters]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
    updateURL({ search: value, page: 1 });
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
    router.push("/departements/nouveau");
  };

  const handleEdit = (id: string) => {
    router.push(`/departements/${id}/edit`);
  };

  const handleDelete = () => {
    loadDepartements(); // Reload after delete
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Départements</h1>
          <p className="text-gray-600">
            Gérez les départements de votre établissement
          </p>
        </div>
        <Button onClick={handleCreateNew} className="w-fit">
          <Plus className="w-4 h-4" />
          Nouveau département
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche et filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom ou description..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
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
          <span className="ml-2">Chargement des départements...</span>
        </div>
      )}

      {/* Results */}
      {!isPending && (
        <>
          {departements.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {departements.map((departement) => (
                  <DepartementCard
                    key={departement.id}
                    departement={departement}
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
                    {pagination.total} départements
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
                <Building2 className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun département trouvé
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {filters.search 
                    ? "Aucun département ne correspond à votre recherche." 
                    : "Commencez par créer votre premier département."
                  }
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4" />
                  Créer un département
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
