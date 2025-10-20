"use server";

import { prisma } from "@/lib/prisma";
import { 
  CreateModuleSchema, 
  UpdateModuleSchema, 
  PaginationSchema,
  IdParamSchema,
  type CreateModule,
  type UpdateModule,
  type Pagination 
} from "@/lib/zodshema";
import { revalidatePath } from "next/cache";

// Créer un module
export async function createModule(data: CreateModule) {
  try {
    const validatedData = CreateModuleSchema.parse(data);
    
    const module = await prisma.module.create({
      data: validatedData,
      include: {
        filiere: {
          select: {
            id: true,
            nom: true,
            departement: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/modules");
    revalidatePath("/filieres");
    return { success: true, data: module };
  } catch (error) {
    console.error("Erreur lors de la création du module:", error);
    return { success: false, error: "Erreur lors de la création du module" };
  }
}

// Obtenir tous les modules avec pagination
export async function getModules(params: Pagination = {}) {
  try {
    const { page, limit, search, sortBy, sortOrder } = PaginationSchema.parse(params);
    
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { nom: { contains: search, mode: "insensitive" as const } },
        { code: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { filiere: { nom: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {};

    const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" as const };

    const [modules, total] = await Promise.all([
      prisma.module.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          filiere: {
            select: {
              id: true,
              nom: true,
              departement: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
          users: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
          seances: {
            select: {
              id: true,
              titre: true,
              dateseance: true,
              type: true,
            },
          },
          _count: {
            select: {
              users: true,
              seances: true,
            },
          },
        },
      }),
      prisma.module.count({ where }),
    ]);

    return {
      success: true,
      data: modules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des modules:", error);
    return { success: false, error: "Erreur lors de la récupération des modules" };
  }
}

// Obtenir un module par ID
export async function getModuleById(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const module = await prisma.module.findUnique({
      where: { id: validatedId },
      include: {
        filiere: {
          include: {
            departement: true,
          },
        },
        users: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            actif: true,
          },
        },
        seances: {
          include: {
            enseignant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
          orderBy: {
            dateseance: "asc",
          },
        },
        _count: {
          select: {
            users: true,
            seances: true,
          },
        },
      },
    });

    if (!module) {
      return { success: false, error: "Module non trouvé" };
    }

    return { success: true, data: module };
  } catch (error) {
    console.error("Erreur lors de la récupération du module:", error);
    return { success: false, error: "Erreur lors de la récupération du module" };
  }
}

// Mettre à jour un module
export async function updateModule(id: string, data: UpdateModule) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    const validatedData = UpdateModuleSchema.parse(data);

    const module = await prisma.module.update({
      where: { id: validatedId },
      data: validatedData,
      include: {
        filiere: {
          select: {
            id: true,
            nom: true,
            departement: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            seances: true,
          },
        },
      },
    });

    revalidatePath("/modules");
    revalidatePath(`/modules/${id}`);
    revalidatePath("/filieres");
    return { success: true, data: module };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du module:", error);
    return { success: false, error: "Erreur lors de la mise à jour du module" };
  }
}

// Supprimer un module
export async function deleteModule(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    // Vérifier s'il y a des séances liées
    const module = await prisma.module.findUnique({
      where: { id: validatedId },
      include: {
        _count: {
          select: {
            seances: true,
            users: true,
          },
        },
      },
    });

    if (!module) {
      return { success: false, error: "Module non trouvé" };
    }

    if (module._count.seances > 0) {
      return { 
        success: false, 
        error: "Impossible de supprimer ce module car il contient des séances" 
      };
    }

    // Les relations directes seront automatiquement supprimées par Prisma

    await prisma.module.delete({
      where: { id: validatedId },
    });

    revalidatePath("/modules");
    revalidatePath("/filieres");
    return { success: true, message: "Module supprimé avec succès" };
  } catch (error) {
    console.error("Erreur lors de la suppression du module:", error);
    return { success: false, error: "Erreur lors de la suppression du module" };
  }
}

// Obtenir tous les modules (pour les sélecteurs)
export async function getAllModules() {
  try {
    const modules = await prisma.module.findMany({
      select: {
        id: true,
        nom: true,
        code: true,
        credits: true,
        heures: true,
        filiere: {
          select: {
            id: true,
            nom: true,
            departement: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });

    return { success: true, data: modules };
  } catch (error) {
    console.error("Erreur lors de la récupération des modules:", error);
    return { success: false, error: "Erreur lors de la récupération des modules" };
  }
}

// Obtenir les modules par filière
export async function getModulesByFiliere(filiereId: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id: filiereId });
    
    const modules = await prisma.module.findMany({
      where: { filiereId: validatedId },
      include: {
        _count: {
          select: {
            users: true,
            seances: true,
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });

    return { success: true, data: modules };
  } catch (error) {
    console.error("Erreur lors de la récupération des modules par filière:", error);
    return { success: false, error: "Erreur lors de la récupération des modules" };
  }
}

// Obtenir les modules d'un enseignant
export async function getModulesByEnseignant(userId: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id: userId });
    
    const user = await prisma.user.findUnique({
      where: { id: validatedId },
      include: {
        modules: {
          include: {
            filiere: {
              select: {
                id: true,
                nom: true,
                departement: {
                  select: {
                    id: true,
                    nom: true,
                  },
                },
              },
            },
            _count: {
              select: {
                seances: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    return { success: true, data: user.modules };
  } catch (error) {
    console.error("Erreur lors de la récupération des modules de l'enseignant:", error);
    return { success: false, error: "Erreur lors de la récupération des modules" };
  }
}

// Obtenir les statistiques d'un module
export async function getModuleStats(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const stats = await prisma.module.findUnique({
      where: { id: validatedId },
      select: {
        id: true,
        nom: true,
        code: true,
        credits: true,
        heures: true,
        _count: {
          select: {
            users: true,
            seances: true,
          },
        },
        seances: {
          select: {
            type: true,
            heureDebut: true,
            heureFin: true,
          },
        },
      },
    });

    if (!stats) {
      return { success: false, error: "Module non trouvé" };
    }

    // Calculer les heures réellement dispensées
    const heuresDispensees = stats.seances.reduce((total, seance) => {
      const debut = new Date(seance.heureDebut);
      const fin = new Date(seance.heureFin);
      const duree = (fin.getTime() - debut.getTime()) / (1000 * 60 * 60); // en heures
      return total + duree;
    }, 0);

    // Compter les types de séances
    const typesSeances = stats.seances.reduce((acc, seance) => {
      acc[seance.type] = (acc[seance.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      success: true,
      data: {
        ...stats,
        heuresDispensees: Math.round(heuresDispensees * 100) / 100,
        typesSeances,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return { success: false, error: "Erreur lors de la récupération des statistiques" };
  }
}
