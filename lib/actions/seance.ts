"use server";

import { prisma } from "@/lib/prisma";
import { 
  CreateSeanceSchema, 
  UpdateSeanceSchema, 
  PaginationSchema,
  IdParamSchema,
  type CreateSeance,
  type UpdateSeance,
  type Pagination 
} from "@/lib/zodshema";
import { revalidatePath } from "next/cache";

// Créer une séance
export async function createSeance(data: CreateSeance) {
  try {
    const validatedData = CreateSeanceSchema.parse(data);
    
    // Vérifier que l'enseignant est bien assigné au module
    const user = await prisma.user.findUnique({
      where: { id: validatedData.enseignantId },
      include: { modules: true },
    });

    if (!user) {
      return { 
        success: false, 
        error: "Enseignant non trouvé" 
      };
    }

    const isAssignedToModule = user.modules.some(module => module.id === validatedData.moduleId);
    if (!isAssignedToModule) {
      return { 
        success: false, 
        error: "L'enseignant sélectionné n'est pas assigné à ce module" 
      };
    }

    // Vérifier les conflits d'horaires pour l'enseignant
    const conflictingSeance = await prisma.seance.findFirst({
      where: {
        enseignantId: validatedData.enseignantId,
        dateseance: validatedData.dateseance,
        OR: [
          {
            AND: [
              { heureDebut: { lte: validatedData.heureDebut } },
              { heureFin: { gt: validatedData.heureDebut } },
            ],
          },
          {
            AND: [
              { heureDebut: { lt: validatedData.heureFin } },
              { heureFin: { gte: validatedData.heureFin } },
            ],
          },
          {
            AND: [
              { heureDebut: { gte: validatedData.heureDebut } },
              { heureFin: { lte: validatedData.heureFin } },
            ],
          },
        ],
      },
    });

    if (conflictingSeance) {
      return { 
        success: false, 
        error: "L'enseignant a déjà une séance programmée à cette heure" 
      };
    }

    const seance = await prisma.seance.create({
      data: validatedData,
      include: {
        module: {
          select: {
            id: true,
            nom: true,
            code: true,
            filiere: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
        enseignant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/seances");
    revalidatePath("/modules");
    revalidatePath(`/modules/${validatedData.moduleId}`);
    return { success: true, data: seance };
  } catch (error) {
    console.error("Erreur lors de la création de la séance:", error);
    return { success: false, error: "Erreur lors de la création de la séance" };
  }
}

// Obtenir toutes les séances avec pagination
export async function getSeances(params: Pagination = {}) {
  try {
    const { page, limit, search, sortBy, sortOrder } = PaginationSchema.parse(params);
    
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { titre: { contains: search, mode: "insensitive" as const } },
        { contenu: { contains: search, mode: "insensitive" as const } },
        { salle: { contains: search, mode: "insensitive" as const } },
        { module: { nom: { contains: search, mode: "insensitive" as const } } },
        { enseignant: { nom: { contains: search, mode: "insensitive" as const } } },
        { enseignant: { prenom: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {};

    const orderBy = sortBy ? { [sortBy]: sortOrder } : { dateseance: "desc" as const };

    const [seances, total] = await Promise.all([
      prisma.seance.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          module: {
            select: {
              id: true,
              nom: true,
              code: true,
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
          },
          enseignant: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
      }),
      prisma.seance.count({ where }),
    ]);

    return {
      success: true,
      data: seances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des séances:", error);
    return { success: false, error: "Erreur lors de la récupération des séances" };
  }
}

// Obtenir une séance par ID
export async function getSeanceById(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    const seance = await prisma.seance.findUnique({
      where: { id: validatedId },
      include: {
        module: {
          include: {
            filiere: {
              include: {
                departement: true,
              },
            },
          },
        },
        enseignant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!seance) {
      return { success: false, error: "Séance non trouvée" };
    }

    return { success: true, data: seance };
  } catch (error) {
    console.error("Erreur lors de la récupération de la séance:", error);
    return { success: false, error: "Erreur lors de la récupération de la séance" };
  }
}

// Mettre à jour une séance
export async function updateSeance(id: string, data: UpdateSeance) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    const validatedData = UpdateSeanceSchema.parse(data);

    // Si l'enseignant ou le module change, vérifier l'assignation
    if (validatedData.enseignantId && validatedData.moduleId) {
      const user = await prisma.user.findUnique({
        where: { id: validatedData.enseignantId },
        include: { modules: true },
      });

      if (!user) {
        return { 
          success: false, 
          error: "Enseignant non trouvé" 
        };
      }

      const isAssignedToModule = user.modules.some(module => module.id === validatedData.moduleId);
      if (!isAssignedToModule) {
        return { 
          success: false, 
          error: "L'enseignant sélectionné n'est pas assigné à ce module" 
        };
      }
    }

    // Vérifier les conflits d'horaires si les horaires changent
    if (validatedData.dateseance || validatedData.heureDebut || validatedData.heureFin) {
      const currentSeance = await prisma.seance.findUnique({
        where: { id: validatedId },
        select: { enseignantId: true, dateseance: true, heureDebut: true, heureFin: true },
      });

      if (currentSeance) {
        const enseignantId = validatedData.enseignantId || currentSeance.enseignantId;
        const dateseance = validatedData.dateseance || currentSeance.dateseance;
        const heureDebut = validatedData.heureDebut || currentSeance.heureDebut;
        const heureFin = validatedData.heureFin || currentSeance.heureFin;

        const conflictingSeance = await prisma.seance.findFirst({
          where: {
            id: { not: validatedId },
            enseignantId,
            dateseance,
            OR: [
              {
                AND: [
                  { heureDebut: { lte: heureDebut } },
                  { heureFin: { gt: heureDebut } },
                ],
              },
              {
                AND: [
                  { heureDebut: { lt: heureFin } },
                  { heureFin: { gte: heureFin } },
                ],
              },
              {
                AND: [
                  { heureDebut: { gte: heureDebut } },
                  { heureFin: { lte: heureFin } },
                ],
              },
            ],
          },
        });

        if (conflictingSeance) {
          return { 
            success: false, 
            error: "L'enseignant a déjà une séance programmée à cette heure" 
          };
        }
      }
    }

    const seance = await prisma.seance.update({
      where: { id: validatedId },
      data: validatedData,
      include: {
        module: {
          select: {
            id: true,
            nom: true,
            code: true,
            filiere: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
        enseignant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/seances");
    revalidatePath(`/seances/${id}`);
    revalidatePath("/modules");
    return { success: true, data: seance };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la séance:", error);
    return { success: false, error: "Erreur lors de la mise à jour de la séance" };
  }
}

// Supprimer une séance
export async function deleteSeance(id: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id });
    
    await prisma.seance.delete({
      where: { id: validatedId },
    });

    revalidatePath("/seances");
    revalidatePath("/modules");
    return { success: true, message: "Séance supprimée avec succès" };
  } catch (error) {
    console.error("Erreur lors de la suppression de la séance:", error);
    return { success: false, error: "Erreur lors de la suppression de la séance" };
  }
}

// Obtenir les séances par module
export async function getSeancesByModule(moduleId: string) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id: moduleId });
    
    const seances = await prisma.seance.findMany({
      where: { moduleId: validatedId },
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
    });

    return { success: true, data: seances };
  } catch (error) {
    console.error("Erreur lors de la récupération des séances par module:", error);
    return { success: false, error: "Erreur lors de la récupération des séances" };
  }
}

// Obtenir les séances d'un enseignant
export async function getSeancesByEnseignant(enseignantId: string, dateDebut?: Date, dateFin?: Date) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id: enseignantId });
    
    const where: any = { enseignantId: validatedId };
    
    if (dateDebut && dateFin) {
      where.dateseance = {
        gte: dateDebut,
        lte: dateFin,
      };
    }

    const seances = await prisma.seance.findMany({
      where,
      include: {
        module: {
          select: {
            id: true,
            nom: true,
            code: true,
            filiere: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
      orderBy: {
        dateseance: "asc",
      },
    });

    return { success: true, data: seances };
  } catch (error) {
    console.error("Erreur lors de la récupération des séances par enseignant:", error);
    return { success: false, error: "Erreur lors de la récupération des séances" };
  }
}

// Obtenir les séances par date
export async function getSeancesByDate(date: Date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const seances = await prisma.seance.findMany({
      where: {
        dateseance: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        module: {
          select: {
            id: true,
            nom: true,
            code: true,
            filiere: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
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
        heureDebut: "asc",
      },
    });

    return { success: true, data: seances };
  } catch (error) {
    console.error("Erreur lors de la récupération des séances par date:", error);
    return { success: false, error: "Erreur lors de la récupération des séances" };
  }
}

// Obtenir les enseignants disponibles pour un module à une date/heure donnée
export async function getAvailableTeachersForSeance(moduleId: string, dateseance: Date, heureDebut: Date, heureFin: Date) {
  try {
    const { id: validatedId } = IdParamSchema.parse({ id: moduleId });
    
    // Obtenir les enseignants assignés au module
    const module = await prisma.module.findUnique({
      where: { id: validatedId },
      include: { 
        users: {
          select: { id: true }
        }
      },
    });

    if (!module) {
      return { success: false, error: "Module non trouvé" };
    }

    const teacherIds = module.users.map(user => user.id);

    // Obtenir les enseignants qui n'ont pas de conflit d'horaires
    const availableTeachers = await prisma.user.findMany({
      where: {
        id: { in: teacherIds },
        actif: true,
        seancesEnseignees: {
          none: {
            dateseance,
            OR: [
              {
                AND: [
                  { heureDebut: { lte: heureDebut } },
                  { heureFin: { gt: heureDebut } },
                ],
              },
              {
                AND: [
                  { heureDebut: { lt: heureFin } },
                  { heureFin: { gte: heureFin } },
                ],
              },
              {
                AND: [
                  { heureDebut: { gte: heureDebut } },
                  { heureFin: { lte: heureFin } },
                ],
              },
            ],
          },
        },
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
      },
      orderBy: [
        { nom: "asc" },
        { prenom: "asc" },
      ],
    });

    return { success: true, data: availableTeachers };
  } catch (error) {
    console.error("Erreur lors de la récupération des enseignants disponibles:", error);
    return { success: false, error: "Erreur lors de la récupération des enseignants disponibles" };
  }
}
