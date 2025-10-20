"use server";

import { prisma } from "@/lib/prisma";
import { 
  CreateFiliereSchema, 
  UpdateFiliereSchema, 
  PaginationSchema,
  IdParamSchema,
  type CreateFiliere,
  type UpdateFiliere,
  type Pagination 
} from "@/lib/zodshema";
import { revalidatePath } from "next/cache";

// Créer une filière
export async function createFiliere(data: CreateFiliere) {
  try {
    const validatedData = CreateFiliereSchema.parse(data);
    
    const filiere = await prisma.filiere.create({
      data: validatedData,
      include: {
        departement: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    revalidatePath("/filieres");
    revalidatePath("/departements");
    return { success: true, data: filiere };
  } catch (error) {
    console.error("Erreur lors de la création de la filière:", error);
    return { success: false, error: "Erreur lors de la création de la filière" };
  }
}

// Obtenir toutes les filières avec pagination
export async function getFilieres(params: Pagination = {}) {
  try {
    const { page, limit, search, sortBy, sortOrder } = PaginationSchema.parse(params);
    
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { nom: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { departement: { nom: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {};

    const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" as const };

    const [filieres, total] = await Promise.all([
      prisma.filiere.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          departement: {
            select: {
              id: true,
              nom: true,
            },
          },
          modules: {
            select: {
              id: true,
              nom: true,
              code: true,
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
          _count: {
            select: {
              modules: true,
              users: true,
            },
          },
        },
      }),
      prisma.filiere.count({ where }),
    ]);

    return {
      success: true,
      data: filieres,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des filières:", error);
    return { success: false, error: "Erreur lors de la récupération des filières" };
  }
}

// Obtenir une filière par ID
export async function getFiliereById(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const filiere = await prisma.filiere.findUnique({
      where: { id: validatedId },
      include: {
        departement: true,
        modules: {
          include: {
            userModules: {
              include: {
                user: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    email: true,
                  },
                },
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
                seances: true,
                userModules: true,
              },
            },
          },
        },
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            modules: true,
            users: true,
          },
        },
      },
    });

    if (!filiere) {
      return { success: false, error: "Filière non trouvée" };
    }

    return { success: true, data: filiere };
  } catch (error) {
    console.error("Erreur lors de la récupération de la filière:", error);
    return { success: false, error: "Erreur lors de la récupération de la filière" };
  }
}

// Mettre à jour une filière
export async function updateFiliere(id: string, data: UpdateFiliere) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    const validatedData = UpdateFiliereSchema.parse(data);

    const filiere = await prisma.filiere.update({
      where: { id: validatedId },
      data: validatedData,
      include: {
        departement: {
          select: {
            id: true,
            nom: true,
          },
        },
        _count: {
          select: {
            modules: true,
            users: true,
          },
        },
      },
    });

    revalidatePath("/filieres");
    revalidatePath(`/filieres/${id}`);
    revalidatePath("/departements");
    return { success: true, data: filiere };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la filière:", error);
    return { success: false, error: "Erreur lors de la mise à jour de la filière" };
  }
}

// Supprimer une filière
export async function deleteFiliere(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    // Vérifier s'il y a des modules ou des utilisateurs liés
    const filiere = await prisma.filiere.findUnique({
      where: { id: validatedId },
      include: {
        _count: {
          select: {
            modules: true,
            users: true,
          },
        },
      },
    });

    if (!filiere) {
      return { success: false, error: "Filière non trouvée" };
    }

    if (filiere._count.modules > 0) {
      return { 
        success: false, 
        error: "Impossible de supprimer cette filière car elle contient des modules" 
      };
    }

    if (filiere._count.users > 0) {
      return { 
        success: false, 
        error: "Impossible de supprimer cette filière car elle contient des utilisateurs" 
      };
    }

    await prisma.filiere.delete({
      where: { id: validatedId },
    });

    revalidatePath("/filieres");
    revalidatePath("/departements");
    return { success: true, message: "Filière supprimée avec succès" };
  } catch (error) {
    console.error("Erreur lors de la suppression de la filière:", error);
    return { success: false, error: "Erreur lors de la suppression de la filière" };
  }
}

// Obtenir toutes les filières (pour les sélecteurs)
export async function getAllFilieres() {
  try {
    const filieres = await prisma.filiere.findMany({
      select: {
        id: true,
        nom: true,
        description: true,
        departement: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });

    return { success: true, data: filieres };
  } catch (error) {
    console.error("Erreur lors de la récupération des filières:", error);
    return { success: false, error: "Erreur lors de la récupération des filières" };
  }
}

// Obtenir les filières par département
export async function getFilieresByDepartement(departementId: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id: departementId });
    
    const filieres = await prisma.filiere.findMany({
      where: { departementId: validatedId },
      include: {
        _count: {
          select: {
            modules: true,
            users: true,
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });

    return { success: true, data: filieres };
  } catch (error) {
    console.error("Erreur lors de la récupération des filières par département:", error);
    return { success: false, error: "Erreur lors de la récupération des filières" };
  }
}

// Obtenir les statistiques d'une filière
export async function getFiliereStats(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const stats = await prisma.filiere.findUnique({
      where: { id: validatedId },
      select: {
        id: true,
        nom: true,
        _count: {
          select: {
            modules: true,
            users: true,
          },
        },
        modules: {
          select: {
            _count: {
              select: {
                seances: true,
                userModules: true,
              },
            },
          },
        },
      },
    });

    if (!stats) {
      return { success: false, error: "Filière non trouvée" };
    }

    const totalSeances = stats.modules.reduce((sum, module) => sum + module._count.seances, 0);
    const totalEnseignants = stats.modules.reduce((sum, module) => sum + module._count.userModules, 0);

    return {
      success: true,
      data: {
        ...stats,
        totalSeances,
        totalEnseignants,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return { success: false, error: "Erreur lors de la récupération des statistiques" };
  }
}
