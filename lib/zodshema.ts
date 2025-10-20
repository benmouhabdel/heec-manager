import { z } from "zod";

// Enums Zod
export const TypeRoleSchema = z.enum([
  "ENSEIGNANT",
  "ADMINISTRATEUR", 
  "CHEF_DE_FILIERE",
  "CHEF_DE_DEPARTEMENT",
  "DIRECTEUR_GENERAL"
]);


export const TypeSeanceSchema = z.enum([
  "COURS",
  "TD", 
  "TP",
  "EXAMEN",
  "CONFERENCE",
  "SEMINAIRE"
]);

// Schema User
export const UserSchema = z.object({
  id: z.string().cuid().optional(),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  actif: z.boolean().default(true),
  emailVerified: z.date().optional().nullable(),
  image: z.string().optional().nullable(),
  departementId: z.string().optional().nullable(),
  filiereId: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
});

export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema Role
export const RoleSchema = z.object({
  id: z.string().cuid().optional(),
  nom: z.string().min(1, "Le nom du rôle est requis"),
  type: TypeRoleSchema,
  description: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateRoleSchema = RoleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateRoleSchema = RoleSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Schema Departement
export const DepartementSchema = z.object({
  id: z.string().cuid().optional(),
  nom: z.string().min(1, "Le nom du département est requis"),
  description: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateDepartementSchema = DepartementSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDepartementSchema = DepartementSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema Filiere
export const FiliereSchema = z.object({
  id: z.string().cuid().optional(),
  nom: z.string().min(1, "Le nom de la filière est requis"),
  description: z.string().optional().nullable(),
  departementId: z.string().cuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateFiliereSchema = FiliereSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateFiliereSchema = FiliereSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema Module
export const ModuleSchema = z.object({
  id: z.string().cuid().optional(),
  nom: z.string().min(1, "Le nom du module est requis"),
  code: z.string().min(1, "Le code du module est requis"),
  description: z.string().optional().nullable(),
  credits: z.number().int().positive().optional().nullable(),
  heures: z.number().int().positive().optional().nullable(),
  filiereId: z.string().cuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateModuleSchema = ModuleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateModuleSchema = ModuleSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Schema Seance
export const SeanceSchema = z.object({
  id: z.string().cuid().optional(),
  titre: z.string().min(1, "Le titre de la séance est requis"),
  contenu: z.string().optional().nullable(),
  dateseance: z.date(),
  heureDebut: z.date(),
  heureFin: z.date(),
  salle: z.string().optional().nullable(),
  type: TypeSeanceSchema.default("COURS"),
  complement: z.string().optional().nullable(),
  moduleId: z.string().cuid(),
  enseignantId: z.string().cuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine((data) => data.heureFin > data.heureDebut, {
  message: "L'heure de fin doit être après l'heure de début",
  path: ["heureFin"],
});

export const CreateSeanceSchema = SeanceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSeanceSchema = SeanceSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schemas pour la pagination et les filtres
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const IdParamSchema = z.object({
  id: z.string().cuid(),
});

// Types TypeScript inférés
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export type Role = z.infer<typeof RoleSchema>;
export type CreateRole = z.infer<typeof CreateRoleSchema>;
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;


export type Departement = z.infer<typeof DepartementSchema>;
export type CreateDepartement = z.infer<typeof CreateDepartementSchema>;
export type UpdateDepartement = z.infer<typeof UpdateDepartementSchema>;

export type Filiere = z.infer<typeof FiliereSchema>;
export type CreateFiliere = z.infer<typeof CreateFiliereSchema>;
export type UpdateFiliere = z.infer<typeof UpdateFiliereSchema>;

export type Module = z.infer<typeof ModuleSchema>;
export type CreateModule = z.infer<typeof CreateModuleSchema>;
export type UpdateModule = z.infer<typeof UpdateModuleSchema>;


export type Seance = z.infer<typeof SeanceSchema>;
export type CreateSeance = z.infer<typeof CreateSeanceSchema>;
export type UpdateSeance = z.infer<typeof UpdateSeanceSchema>;

export type Pagination = z.infer<typeof PaginationSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;

export type TypeRole = z.infer<typeof TypeRoleSchema>;
export type TypeSeance = z.infer<typeof TypeSeanceSchema>;