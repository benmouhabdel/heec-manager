"use server";

import { prisma } from "@/lib/prisma";
import { 
  CreateRoleSchema, 
  UpdateRoleSchema, 
  PaginationSchema,
  IdParamSchema,
  type CreateRole,
  type UpdateRole,
  type Pagination 
} from "@/lib/zodshema";
import { revalidatePath } from "next/cache";

// Créer un rôle
export async function createRole(data: CreateRole) {
  try {
    const validatedData = CreateRoleSchema.parse(data);
    
    const role = await prisma.role.create({
      data: validatedData,
    });

    revalidatePath("/roles");
    return { success: true, data: role };
  } catch (error) {
    console.error("Erreur lors de la création du rôle:", error);
    return { success: false, error: "Erreur lors de la création du rôle" };
  }
}

// Obtenir tous les rôles avec pagination
export async function getRoles(params: Pagination = {}) {
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

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          userRoles: {
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
        },
      }),
      prisma.role.count({ where }),
    ]);

    return {
      success: true,
      data: roles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return { success: false, error: "Erreur lors de la récupération des rôles" };
  }
}

// Obtenir un rôle par ID
export async function getRoleById(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const role = await prisma.role.findUnique({
      where: { id: validatedId },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                actif: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return { success: false, error: "Rôle non trouvé" };
    }

    return { success: true, data: role };
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    return { success: false, error: "Erreur lors de la récupération du rôle" };
  }
}

// Mettre à jour un rôle
export async function updateRole(id: string, data: UpdateRole) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    const validatedData = UpdateRoleSchema.parse(data);

    const role = await prisma.role.update({
      where: { id: validatedId },
      data: validatedData,
    });

    revalidatePath("/roles");
    revalidatePath(`/roles/${id}`);
    return { success: true, data: role };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rôle:", error);
    return { success: false, error: "Erreur lors de la mise à jour du rôle" };
  }
}

// Supprimer un rôle
export async function deleteRole(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    // Vérifier s'il y a des utilisateurs assignés à ce rôle
    const userRolesCount = await prisma.userRole.count({
      where: { roleId: validatedId },
    });

    if (userRolesCount > 0) {
      return { 
        success: false, 
        error: "Impossible de supprimer ce rôle car il est assigné à des utilisateurs" 
      };
    }

    await prisma.role.delete({
      where: { id: validatedId },
    });

    revalidatePath("/roles");
    return { success: true, message: "Rôle supprimé avec succès" };
  } catch (error) {
    console.error("Erreur lors de la suppression du rôle:", error);
    return { success: false, error: "Erreur lors de la suppression du rôle" };
  }
}

// Obtenir tous les rôles (pour les sélecteurs)
export async function getAllRoles() {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        nom: true,
        type: true,
        description: true,
      },
      orderBy: {
        nom: "asc",
      },
    });

    return { success: true, data: roles };
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return { success: false, error: "Erreur lors de la récupération des rôles" };
  }
}

// Obtenir les rôles par type
export async function getRolesByType(type: string) {
  try {
    const roles = await prisma.role.findMany({
      where: { type: type as any },
      include: {
        userRoles: {
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
      },
    });

    return { success: true, data: roles };
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles par type:", error);
    return { success: false, error: "Erreur lors de la récupération des rôles" };
  }
}
