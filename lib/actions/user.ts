"use server";

import { prisma } from "@/lib/prisma";
import { 
  CreateUserSchema, 
  UpdateUserSchema, 
  PaginationSchema,
  IdParamSchema,
  type CreateUser,
  type UpdateUser,
  type Pagination 
} from "@/lib/zodshema";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Créer un utilisateur
export async function createUser(data: CreateUser) {
  try {
    const validatedData = CreateUserSchema.parse(data);
    
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
      include: {
        departement: true,
        filiere: true,
        roles: true,
      },
    });

    revalidatePath("/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return { success: false, error: "Erreur lors de la création de l'utilisateur" };
  }
}

// Obtenir tous les utilisateurs avec pagination
export async function getUsers(params: Pagination = {}) {
  try {
    const { page, limit, search, sortBy, sortOrder } = PaginationSchema.parse(params);
    
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { nom: { contains: search, mode: "insensitive" as const } },
        { prenom: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {};

    const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" as const };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          departement: true,
          filiere: true,
          roles: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return { success: false, error: "Erreur lors de la récupération des utilisateurs" };
  }
}

// Obtenir un utilisateur par ID
export async function getUserById(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const user = await prisma.user.findUnique({
      where: { id: validatedId },
      include: {
        departement: true,
        filiere: true,
        roles: true,
        modules: true,
        seancesEnseignees: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return { success: false, error: "Erreur lors de la récupération de l'utilisateur" };
  }
}

// Mettre à jour un utilisateur
export async function updateUser(id: string, data: UpdateUser) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    const validatedData = UpdateUserSchema.parse(data);
    
    // Hash du mot de passe si fourni
    const updateData = { ...validatedData };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const user = await prisma.user.update({
      where: { id: validatedId },
      data: updateData,
      include: {
        departement: true,
        filiere: true,
        roles: true,
      },
    });

    revalidatePath("/users");
    revalidatePath(`/users/${id}`);
    return { success: true, data: user };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return { success: false, error: "Erreur lors de la mise à jour de l'utilisateur" };
  }
}

// Supprimer un utilisateur
export async function deleteUser(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    await prisma.user.delete({
      where: { id: validatedId },
    });

    revalidatePath("/users");
    return { success: true, message: "Utilisateur supprimé avec succès" };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return { success: false, error: "Erreur lors de la suppression de l'utilisateur" };
  }
}

// Activer/Désactiver un utilisateur
export async function toggleUserStatus(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const user = await prisma.user.findUnique({
      where: { id: validatedId },
      select: { actif: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: validatedId },
      data: { actif: !user.actif },
    });

    revalidatePath("/users");
    revalidatePath(`/users/${id}`);
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Erreur lors du changement de statut:", error);
    return { success: false, error: "Erreur lors du changement de statut" };
  }
}

// Obtenir les utilisateurs par département
export async function getUsersByDepartement(departementId: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id: departementId });
    
    const users = await prisma.user.findMany({
      where: { departementId: validatedId },
      include: {
        roles: true,
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs par département:", error);
    return { success: false, error: "Erreur lors de la récupération des utilisateurs" };
  }
}

// Obtenir les utilisateurs par filière
export async function getUsersByFiliere(filiereId: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id: filiereId });
    
    const users = await prisma.user.findMany({
      where: { filiereId: validatedId },
      include: {
        roles: true,
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs par filière:", error);
    return { success: false, error: "Erreur lors de la récupération des utilisateurs" };
  }
}

// Assigner un rôle à un utilisateur
export async function assignRoleToUser(userId: string, roleId: string) {
  try {
    const validatedUserId = IdParamSchema.parse({ id: userId }).id;
    const validatedRoleId = IdParamSchema.parse({ id: roleId }).id;
    
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: validatedUserId },
      include: { roles: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    // Vérifier si le rôle est déjà assigné
    const isAlreadyAssigned = user.roles.some(role => role.id === validatedRoleId);
    if (isAlreadyAssigned) {
      return { success: false, error: "Ce rôle est déjà assigné à cet utilisateur" };
    }

    // Connecter l'utilisateur au rôle
    const updatedUser = await prisma.user.update({
      where: { id: validatedUserId },
      data: {
        roles: {
          connect: { id: validatedRoleId },
        },
      },
      include: {
        roles: true,
      },
    });

    revalidatePath("/users");
    revalidatePath("/roles");
    revalidatePath(`/users/${validatedUserId}`);
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Erreur lors de l'assignation du rôle:", error);
    return { success: false, error: "Erreur lors de l'assignation du rôle" };
  }
}

// Retirer un rôle d'un utilisateur
export async function removeRoleFromUser(userId: string, roleId: string) {
  try {
    const validatedUserId = IdParamSchema.parse({ id: userId }).id;
    const validatedRoleId = IdParamSchema.parse({ id: roleId }).id;

    // Déconnecter l'utilisateur du rôle
    await prisma.user.update({
      where: { id: validatedUserId },
      data: {
        roles: {
          disconnect: { id: validatedRoleId },
        },
      },
    });

    revalidatePath("/users");
    revalidatePath("/roles");
    revalidatePath(`/users/${validatedUserId}`);
    return { success: true, message: "Rôle retiré avec succès" };
  } catch (error) {
    console.error("Erreur lors de la suppression du rôle:", error);
    return { success: false, error: "Erreur lors de la suppression du rôle" };
  }
}

// Assigner un module à un utilisateur
export async function assignModuleToUser(userId: string, moduleId: string) {
  try {
    const validatedUserId = IdParamSchema.parse({ id: userId }).id;
    const validatedModuleId = IdParamSchema.parse({ id: moduleId }).id;
    
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: validatedUserId },
      include: { modules: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    // Vérifier si le module est déjà assigné
    const isAlreadyAssigned = user.modules.some(module => module.id === validatedModuleId);
    if (isAlreadyAssigned) {
      return { success: false, error: "Cet enseignant est déjà assigné à ce module" };
    }

    // Connecter l'utilisateur au module
    const updatedUser = await prisma.user.update({
      where: { id: validatedUserId },
      data: {
        modules: {
          connect: { id: validatedModuleId },
        },
      },
      include: {
        modules: {
          include: {
            filiere: {
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
    revalidatePath("/users");
    revalidatePath(`/modules/${validatedModuleId}`);
    revalidatePath(`/users/${validatedUserId}`);
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Erreur lors de l'assignation du module:", error);
    return { success: false, error: "Erreur lors de l'assignation du module" };
  }
}

// Retirer un module d'un utilisateur
export async function removeModuleFromUser(userId: string, moduleId: string) {
  try {
    const validatedUserId = IdParamSchema.parse({ id: userId }).id;
    const validatedModuleId = IdParamSchema.parse({ id: moduleId }).id;

    // Vérifier s'il y a des séances programmées pour cet enseignant dans ce module
    const seancesCount = await prisma.seance.count({
      where: {
        moduleId: validatedModuleId,
        enseignantId: validatedUserId,
        dateseance: {
          gte: new Date(),
        },
      },
    });

    if (seancesCount > 0) {
      return { 
        success: false, 
        error: "Impossible de retirer cet enseignant car il a des séances programmées dans ce module" 
      };
    }

    // Déconnecter l'utilisateur du module
    await prisma.user.update({
      where: { id: validatedUserId },
      data: {
        modules: {
          disconnect: { id: validatedModuleId },
        },
      },
    });

    revalidatePath("/modules");
    revalidatePath("/users");
    revalidatePath(`/modules/${validatedModuleId}`);
    revalidatePath(`/users/${validatedUserId}`);
    return { success: true, message: "Enseignant retiré du module avec succès" };
  } catch (error) {
    console.error("Erreur lors de la suppression du module:", error);
    return { success: false, error: "Erreur lors de la suppression du module" };
  }
}
