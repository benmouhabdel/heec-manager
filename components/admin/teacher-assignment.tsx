"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  assignTeacherToFiliere, 
  assignTeacherToModule, 
  unassignTeacherFromModule,
  getAllUsersForAdmin 
} from "@/lib/actions/admin";
import { getAllFilieres } from "@/lib/actions/filiere";
import { getAllModules } from "@/lib/actions/module";
import { User, TypeRole, Filiere, Module } from "@prisma/client";
import { UserCheck, Plus, Minus, BookOpen, MapPin } from "lucide-react";
import { toast } from "sonner";

interface UserWithRelations extends User {
  roles: Array<{ id: string; nom: string; type: TypeRole }>;
  departement?: { id: string; nom: string } | null;
  filiere?: { id: string; nom: string } | null;
  modules: Array<{ id: string; nom: string; code: string }>;
}

interface FiliereWithDepartement extends Filiere {
  departement: { id: string; nom: string };
}

interface ModuleWithFiliere extends Module {
  filiere: { id: string; nom: string };
}

interface TeacherAssignmentProps {
  adminUserId: string;
}

export function TeacherAssignment({ adminUserId }: TeacherAssignmentProps) {
  const [teachers, setTeachers] = useState<UserWithRelations[]>([]);
  const [filieres, setFilieres] = useState<FiliereWithDepartement[]>([]);
  const [modules, setModules] = useState<ModuleWithFiliere[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les affectations
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, [adminUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, filieresData, modulesData] = await Promise.all([
        getAllUsersForAdmin(adminUserId),
        getAllFilieres(),
        getAllModules()
      ]);

      // Filtrer uniquement les enseignants
      const teachersOnly = usersData.filter(user => 
        user.roles.some(role => role.type === TypeRole.ENSEIGNANT)
      );

      setTeachers(teachersOnly);
      setFilieres(filieresData.filieres);
      setModules(modulesData.modules);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToFiliere = async () => {
    if (!selectedTeacher || !selectedFiliere) {
      toast.error("Veuillez sélectionner un enseignant et une filière");
      return;
    }

    try {
      setAssigning(true);
      const result = await assignTeacherToFiliere(adminUserId, selectedTeacher, selectedFiliere);
      
      if (result.success) {
        toast.success(result.message);
        setSelectedTeacher("");
        setSelectedFiliere("");
        await loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors de l'affectation");
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignToModule = async () => {
    if (!selectedTeacher || !selectedModule) {
      toast.error("Veuillez sélectionner un enseignant et un module");
      return;
    }

    try {
      setAssigning(true);
      const result = await assignTeacherToModule(adminUserId, selectedTeacher, selectedModule);
      
      if (result.success) {
        toast.success(result.message);
        setSelectedTeacher("");
        setSelectedModule("");
        await loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors de l'affectation");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignFromModule = async (teacherId: string, moduleId: string) => {
    try {
      const result = await unassignTeacherFromModule(adminUserId, teacherId, moduleId);
      
      if (result.success) {
        toast.success(result.message);
        await loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la désaffectation");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Affectation des Enseignants
          </CardTitle>
          <CardDescription>
            Affectez les enseignants aux filières et modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Affectation à une filière */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Affectation à une Filière
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="teacher-filiere">Enseignant</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enseignant" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.prenom} {teacher.nom}
                        {teacher.filiere && (
                          <span className="text-muted-foreground ml-2">
                            ({teacher.filiere.nom})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="filiere">Filière</Label>
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une filière" />
                  </SelectTrigger>
                  <SelectContent>
                    {filieres.map((filiere) => (
                      <SelectItem key={filiere.id} value={filiere.id}>
                        {filiere.nom}
                        <span className="text-muted-foreground ml-2">
                          ({filiere.departement.nom})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleAssignToFiliere}
                  disabled={assigning || !selectedTeacher || !selectedFiliere}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Affecter
                </Button>
              </div>
            </div>
          </div>

          {/* Affectation à un module */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Affectation à un Module
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="teacher-module">Enseignant</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enseignant" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.prenom} {teacher.nom}
                        {teacher.filiere && (
                          <span className="text-muted-foreground ml-2">
                            ({teacher.filiere.nom})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="module">Module</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.code} - {module.nom}
                        <span className="text-muted-foreground ml-2">
                          ({module.filiere.nom})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleAssignToModule}
                  disabled={assigning || !selectedTeacher || !selectedModule}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Affecter
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des affectations actuelles */}
      <Card>
        <CardHeader>
          <CardTitle>Affectations Actuelles</CardTitle>
          <CardDescription>
            Vue d'ensemble des affectations des enseignants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teachers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun enseignant trouvé
              </p>
            ) : (
              teachers.map((teacher) => (
                <Card key={teacher.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">
                        {teacher.prenom} {teacher.nom}
                      </h4>
                      
                      <div className="space-y-2">
                        {teacher.filiere ? (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>Filière: </span>
                            <Badge variant="outline">
                              {teacher.filiere.nom}
                            </Badge>
                            {teacher.departement && (
                              <span className="text-muted-foreground">
                                ({teacher.departement.nom})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>Aucune filière affectée</span>
                          </div>
                        )}
                        
                        {teacher.modules.length > 0 ? (
                          <div className="flex items-start gap-2 text-sm">
                            <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>Modules: </span>
                            <div className="flex flex-wrap gap-1">
                              {teacher.modules.map((module) => (
                                <div key={module.id} className="flex items-center gap-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {module.code}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                    onClick={() => handleUnassignFromModule(teacher.id, module.id)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>Aucun module affecté</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
