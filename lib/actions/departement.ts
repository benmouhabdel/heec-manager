"use server";

import { prisma } from "@/lib/prisma";
import { 
  CreateDepartementSchema, 
  UpdateDepartementSchema, 
  PaginationSchema,
  IdParamSchema,
  type CreateDepartement,
  type UpdateDepartement,
  type Pagination 
} from "@/lib/zodshema";
import { revalidatePath } from "next/cache";

// Créer un département
export async function createDepartement(data: CreateDepartement) {
  try {
    const validatedData = CreateDepartementSchema.parse(data);
    
    const departement = await prisma.departement.create({
      data: validatedData,
    });

    revalidatePath("/departements");
    return { success: true, data: departement };
  } catch (error) {
    console.error("Erreur lors de la création du département:", error);
    return { success: false, error: "Erreur lors de la création du département" };
  }
}

// Obtenir tous les départements avec pagination
export async function getDepartements(params: Pagination = {}) {
  try {
    const { page, limit, search, sortBy, sortOrder } = PaginationSchema.parse(params);
    
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { nom: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    } : {};

    const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" as const };

    const [departements, total] = await Promise.all([
      prisma.departement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          filieres: {
            select: {
              id: true,
              nom: true,
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
              filieres: true,
              users: true,
            },
          },
        },
      }),
      prisma.departement.count({ where }),
    ]);

    return {
      success: true,
      data: departements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des départements:", error);
    return { success: false, error: "Erreur lors de la récupération des départements" };
  }
}

// Obtenir un département par ID
export async function getDepartementById(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const departement = await prisma.departement.findUnique({
      where: { id: validatedId },
      include: {
        filieres: {
          include: {
            modules: {
              select: {
                id: true,
                nom: true,
                code: true,
              },
            },
            _count: {
              select: {
                modules: true,
                users: true,
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
            filieres: true,
            users: true,
          },
        },
      },
    });

    if (!departement) {
      return { success: false, error: "Département non trouvé" };
    }

    return { success: true, data: departement };
  } catch (error) {
    console.error("Erreur lors de la récupération du département:", error);
    return { success: false, error: "Erreur lors de la récupération du département" };
  }
}

// Mettre à jour un département
export async function updateDepartement(id: string, data: UpdateDepartement) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    const validatedData = UpdateDepartementSchema.parse(data);

    const departement = await prisma.departement.update({
      where: { id: validatedId },
      data: validatedData,
      include: {
        _count: {
          select: {
            filieres: true,
            users: true,
          },
        },
      },
    });

    revalidatePath("/departements");
    revalidatePath(`/departements/${id}`);
    return { success: true, data: departement };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du département:", error);
    return { success: false, error: "Erreur lors de la mise à jour du département" };
  }
}

// Supprimer un département
export async function deleteDepartement(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    // Vérifier s'il y a des filières ou des utilisateurs liés
    const departement = await prisma.departement.findUnique({
      where: { id: validatedId },
      include: {
        _count: {
          select: {
            filieres: true,
            users: true,
          },
        },
      },
    });

    if (!departement) {
      return { success: false, error: "Département non trouvé" };
    }

    if (departement._count.filieres > 0) {
      return { 
        success: false, 
        error: "Impossible de supprimer ce département car il contient des filières" 
      };
    }

    if (departement._count.users > 0) {
      return { 
        success: false, 
        error: "Impossible de supprimer ce département car il contient des utilisateurs" 
      };
    }

    await prisma.departement.delete({
      where: { id: validatedId },
    });

    revalidatePath("/departements");
    return { success: true, message: "Département supprimé avec succès" };
  } catch (error) {
    console.error("Erreur lors de la suppression du département:", error);
    return { success: false, error: "Erreur lors de la suppression du département" };
  }
}

// Obtenir tous les départements (pour les sélecteurs)
export async function getAllDepartements() {
  try {
    const departements = await prisma.departement.findMany({
      select: {
        id: true,
        nom: true,
        description: true,
      },
      orderBy: {
        nom: "asc",
      },
    });

    return { success: true, data: departements };
  } catch (error) {
    console.error("Erreur lors de la récupération des départements:", error);
    return { success: false, error: "Erreur lors de la récupération des départements" };
  }
}

// Obtenir les statistiques d'un département
export async function getDepartementStats(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const stats = await prisma.departement.findUnique({
      where: { id: validatedId },
      select: {
        id: true,
        nom: true,
        _count: {
          select: {
            filieres: true,
            users: true,
          },
        },
        filieres: {
          select: {
            _count: {
              select: {
                modules: true,
                users: true,
              },
            },
          },
        },
      },
    });

    if (!stats) {
      return { success: false, error: "Département non trouvé" };
    }

    const totalModules = stats.filieres.reduce((sum, filiere) => sum + filiere._count.modules, 0);
    const totalUsersInFilieres = stats.filieres.reduce((sum, filiere) => sum + filiere._count.users, 0);

    return {
      success: true,
      data: {
        ...stats,
        totalModules,
        totalUsersInFilieres,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return { success: false, error: "Erreur lors de la récupération des statistiques" };
  }
}
