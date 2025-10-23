"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionType, EntityType, TypeRole } from "@prisma/client";
import { headers } from "next/headers";

// Types pour les actions administratives
export interface AdminActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface ActivityLogData {
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: any;
}

// Fonction utilitaire pour vérifier si l'utilisateur est administrateur
export async function checkAdminAccess(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true }
    });

    if (!user || !user.actif) {
      return false;
    }

    // Vérifier si l'utilisateur a un rôle administrateur
    const hasAdminRole = user.roles.some(role => 
      role.type === TypeRole.ADMINISTRATEUR || 
      role.type === TypeRole.DIRECTEUR_GENERAL
    );

    return hasAdminRole;
  } catch (error) {
    console.error("Erreur lors de la vérification des droits admin:", error);
    return false;
  }
}

// Fonction pour enregistrer une activité dans les logs
export async function logActivity(userId: string, logData: ActivityLogData): Promise<void> {
  try {
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await prisma.activityLog.create({
      data: {
        userId,
        action: logData.action,
        entityType: logData.entityType,
        entityId: logData.entityId,
        entityName: logData.entityName,
        description: logData.description,
        metadata: logData.metadata,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du log:", error);
  }
}

// Récupérer tous les utilisateurs avec leurs rôles et relations
export async function getAllUsersForAdmin(adminUserId: string) {
  try {
    // Vérifier les droits d'administration
    const hasAccess = await checkAdminAccess(adminUserId);
    if (!hasAccess) {
      throw new Error("Accès refusé - Droits administrateur requis");
    }

    const users = await prisma.user.findMany({
      include: {
        roles: true,
        departement: true,
        filiere: true,
        modules: true,
        seancesEnseignees: {
          include: {
            module: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    await logActivity(adminUserId, {
      action: ActionType.CREATE,
      entityType: EntityType.USER,
      description: "Consultation de la liste des utilisateurs"
    });

    return users;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    throw error;
  }
}

// Affecter un enseignant à une filière
export async function assignTeacherToFiliere(
  adminUserId: string,
  teacherId: string,
  filiereId: string
): Promise<AdminActionResult> {
  try {
    // Vérifier les droits d'administration
    const hasAccess = await checkAdminAccess(adminUserId);
    if (!hasAccess) {
      return { success: false, message: "Accès refusé - Droits administrateur requis" };
    }

    // Vérifier que l'utilisateur à affecter existe et est un enseignant
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { roles: true, filiere: true }
    });

    if (!teacher) {
      return { success: false, message: "Enseignant introuvable" };
    }

    const isTeacher = teacher.roles.some(role => role.type === TypeRole.ENSEIGNANT);
    if (!isTeacher) {
      return { success: false, message: "L'utilisateur n'est pas un enseignant" };
    }

    // Vérifier que la filière existe
    const filiere = await prisma.filiere.findUnique({
      where: { id: filiereId },
      include: { departement: true }
    });

    if (!filiere) {
      return { success: false, message: "Filière introuvable" };
    }

    // Mettre à jour l'affectation
    const updatedTeacher = await prisma.user.update({
      where: { id: teacherId },
      data: {
        filiereId: filiereId,
        departementId: filiere.departementId
      },
      include: { filiere: true, departement: true }
    });

    // Enregistrer l'activité
    await logActivity(adminUserId, {
      action: ActionType.ASSIGN,
      entityType: EntityType.USER,
      entityId: teacherId,
      entityName: `${teacher.prenom} ${teacher.nom}`,
      description: `Affectation à la filière ${filiere.nom}`,
      metadata: {
        filiereId,
        filiereName: filiere.nom,
        departementName: filiere.departement.nom
      }
    });

    revalidatePath("/dashboard/administrators");
    return {
      success: true,
      message: `${teacher.prenom} ${teacher.nom} affecté(e) à la filière ${filiere.nom}`,
      data: updatedTeacher
    };
  } catch (error) {
    console.error("Erreur lors de l'affectation:", error);
    return { success: false, message: "Erreur lors de l'affectation" };
  }
}

// Affecter un enseignant à un module
export async function assignTeacherToModule(
  adminUserId: string,
  teacherId: string,
  moduleId: string
): Promise<AdminActionResult> {
  try {
    // Vérifier les droits d'administration
    const hasAccess = await checkAdminAccess(adminUserId);
    if (!hasAccess) {
      return { success: false, message: "Accès refusé - Droits administrateur requis" };
    }

    // Vérifier que l'enseignant et le module existent
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { roles: true, modules: true }
    });

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { filiere: true }
    });

    if (!teacher || !module) {
      return { success: false, message: "Enseignant ou module introuvable" };
    }

    const isTeacher = teacher.roles.some(role => role.type === TypeRole.ENSEIGNANT);
    if (!isTeacher) {
      return { success: false, message: "L'utilisateur n'est pas un enseignant" };
    }

    // Vérifier si déjà affecté
    const alreadyAssigned = teacher.modules.some(m => m.id === moduleId);
    if (alreadyAssigned) {
      return { success: false, message: "Enseignant déjà affecté à ce module" };
    }

    // Affecter le module
    await prisma.user.update({
      where: { id: teacherId },
      data: {
        modules: {
          connect: { id: moduleId }
        }
      }
    });

    // Enregistrer l'activité
    await logActivity(adminUserId, {
      action: ActionType.ASSIGN,
      entityType: EntityType.MODULE,
      entityId: moduleId,
      entityName: module.nom,
      description: `Affectation de l'enseignant ${teacher.prenom} ${teacher.nom} au module ${module.nom}`,
      metadata: {
        teacherId,
        teacherName: `${teacher.prenom} ${teacher.nom}`,
        moduleCode: module.code,
        filiereName: module.filiere.nom
      }
    });

    revalidatePath("/dashboard/administrators");
    return {
      success: true,
      message: `${teacher.prenom} ${teacher.nom} affecté(e) au module ${module.nom}`,
    };
  } catch (error) {
    console.error("Erreur lors de l'affectation au module:", error);
    return { success: false, message: "Erreur lors de l'affectation au module" };
  }
}

// Désaffecter un enseignant d'un module
export async function unassignTeacherFromModule(
  adminUserId: string,
  teacherId: string,
  moduleId: string
): Promise<AdminActionResult> {
  try {
    // Vérifier les droits d'administration
    const hasAccess = await checkAdminAccess(adminUserId);
    if (!hasAccess) {
      return { success: false, message: "Accès refusé - Droits administrateur requis" };
    }

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId }
    });

    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    });

    if (!teacher || !module) {
      return { success: false, message: "Enseignant ou module introuvable" };
    }

    // Désaffecter le module
    await prisma.user.update({
      where: { id: teacherId },
      data: {
        modules: {
          disconnect: { id: moduleId }
        }
      }
    });

    // Enregistrer l'activité
    await logActivity(adminUserId, {
      action: ActionType.UNASSIGN,
      entityType: EntityType.MODULE,
      entityId: moduleId,
      entityName: module.nom,
      description: `Désaffectation de l'enseignant ${teacher.prenom} ${teacher.nom} du module ${module.nom}`,
      metadata: {
        teacherId,
        teacherName: `${teacher.prenom} ${teacher.nom}`,
        moduleCode: module.code
      }
    });

    revalidatePath("/dashboard/administrators");
    return {
      success: true,
      message: `${teacher.prenom} ${teacher.nom} désaffecté(e) du module ${module.nom}`,
    };
  } catch (error) {
    console.error("Erreur lors de la désaffectation:", error);
    return { success: false, message: "Erreur lors de la désaffectation" };
  }
}

// Récupérer les logs d'activité avec pagination
export async function getActivityLogs(
  adminUserId: string,
  page: number = 1,
  limit: number = 50,
  filters?: {
    userId?: string;
    action?: ActionType;
    entityType?: EntityType;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  try {
    // Vérifier les droits d'administration
    const hasAccess = await checkAdminAccess(adminUserId);
    if (!hasAccess) {
      throw new Error("Accès refusé - Droits administrateur requis");
    }

    const skip = (page - 1) * limit;
    
    // Construire les filtres
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.activityLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des logs:", error);
    throw error;
  }
}

// Activer/Désactiver un utilisateur (version admin)
export async function adminToggleUserStatus(
  adminUserId: string,
  userId: string
): Promise<AdminActionResult> {
  try {
    // Vérifier les droits d'administration
    const hasAccess = await checkAdminAccess(adminUserId);
    if (!hasAccess) {
      return { success: false, message: "Accès refusé - Droits administrateur requis" };
    }

    // Ne pas permettre de désactiver son propre compte
    if (adminUserId === userId) {
      return { success: false, message: "Vous ne pouvez pas modifier votre propre statut" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, message: "Utilisateur introuvable" };
    }

    const newStatus = !user.actif;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { actif: newStatus }
    });

    // Enregistrer l'activité
    await logActivity(adminUserId, {
      action: newStatus ? ActionType.ACTIVATE : ActionType.DEACTIVATE,
      entityType: EntityType.USER,
      entityId: userId,
      entityName: `${user.prenom} ${user.nom}`,
      description: `${newStatus ? 'Activation' : 'Désactivation'} du compte utilisateur`,
    });

    revalidatePath("/dashboard/administrators");
    return {
      success: true,
      message: `Compte ${newStatus ? 'activé' : 'désactivé'} avec succès`,
      data: updatedUser
    };
  } catch (error) {
    console.error("Erreur lors du changement de statut:", error);
    return { success: false, message: "Erreur lors du changement de statut" };
  }
}
