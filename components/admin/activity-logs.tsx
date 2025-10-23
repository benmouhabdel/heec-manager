"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActivityLogs } from "@/lib/actions/admin";
import { Activity, Search, Calendar, User, Filter, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";

// Types et constantes temporaires jusqu'à ce que Prisma soit mis à jour
type ActionType = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "ASSIGN" | "UNASSIGN" | "ACTIVATE" | "DEACTIVATE";
type EntityType = "USER" | "ROLE" | "DEPARTEMENT" | "FILIERE" | "MODULE" | "SEANCE";

const ActionTypes: ActionType[] = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "ASSIGN", "UNASSIGN", "ACTIVATE", "DEACTIVATE"];
const EntityTypes: EntityType[] = ["USER", "ROLE", "DEPARTEMENT", "FILIERE", "MODULE", "SEANCE"];

interface ActivityLog {
  id: string;
  action: ActionType;
  entityType: EntityType;
  entityId?: string | null;
  entityName?: string | null;
  description: string;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
}

interface ActivityLogsProps {
  adminUserId: string;
}

const getActionColor = (action: ActionType) => {
  switch (action) {
    case ActionType.CREATE:
      return "bg-green-100 text-green-800 border-green-200";
    case ActionType.UPDATE:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case ActionType.DELETE:
      return "bg-red-100 text-red-800 border-red-200";
    case ActionType.LOGIN:
      return "bg-purple-100 text-purple-800 border-purple-200";
    case ActionType.LOGOUT:
      return "bg-gray-100 text-gray-800 border-gray-200";
    case ActionType.ASSIGN:
      return "bg-orange-100 text-orange-800 border-orange-200";
    case ActionType.UNASSIGN:
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case ActionType.ACTIVATE:
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case ActionType.DEACTIVATE:
      return "bg-slate-100 text-slate-800 border-slate-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getEntityColor = (entityType: EntityType) => {
  switch (entityType) {
    case EntityType.USER:
      return "bg-blue-50 text-blue-700";
    case EntityType.ROLE:
      return "bg-purple-50 text-purple-700";
    case EntityType.DEPARTEMENT:
      return "bg-green-50 text-green-700";
    case EntityType.FILIERE:
      return "bg-orange-50 text-orange-700";
    case EntityType.MODULE:
      return "bg-red-50 text-red-700";
    case EntityType.SEANCE:
      return "bg-yellow-50 text-yellow-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
};

export function ActivityLogs({ adminUserId }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    userId: "",
    dateFrom: "",
    dateTo: ""
  });

  useEffect(() => {
    loadLogs();
  }, [adminUserId, currentPage, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      const filterParams: any = {};
      if (filters.action) filterParams.action = filters.action as ActionType;
      if (filters.entityType) filterParams.entityType = filters.entityType as EntityType;
      if (filters.userId) filterParams.userId = filters.userId;
      if (filters.dateFrom) filterParams.dateFrom = new Date(filters.dateFrom);
      if (filters.dateTo) filterParams.dateTo = new Date(filters.dateTo);

      const result = await getActivityLogs(adminUserId, currentPage, 20, filterParams);
      
      setLogs(result.logs);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      toast.error("Erreur lors du chargement des logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      entityType: "",
      userId: "",
      dateFrom: "",
      dateTo: ""
    });
    setCurrentPage(1);
  };

  if (loading && logs.length === 0) {
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
            <Activity className="h-5 w-5" />
            Journal d'Activités
          </CardTitle>
          <CardDescription>
            Supervisez toutes les activités du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="action-filter">Action</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange("action", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  {ActionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="entity-filter">Entité</Label>
              <Select value={filters.entityType} onValueChange={(value) => handleFilterChange("entityType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  {EntityTypes.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-from">Date début</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date-to">Date fin</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            </div>

            <div className="flex items-end">
              <Button onClick={loadLogs} disabled={loading} className="flex-1">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Liste des logs */}
          <div className="space-y-3">
            {logs.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucune activité trouvée</p>
                </CardContent>
              </Card>
            ) : (
              logs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <Badge variant="secondary" className={getEntityColor(log.entityType)}>
                          {log.entityType}
                        </Badge>
                        {log.entityName && (
                          <span className="text-sm font-medium">{log.entityName}</span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user.prenom} {log.user.nom}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                        </div>
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                      </div>
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Détails techniques
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
