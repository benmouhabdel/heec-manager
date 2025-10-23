# Composants de Gestion - HEEC Manager

Ce dossier contient tous les composants React pour la gestion des entités principales du système HEEC Manager.

## Structure des Composants

Chaque entité (Département, Filière, Module, Séance) suit le même pattern avec 3 composants principaux :

### 1. **Form** - Formulaire de création/édition
- Validation avec Zod schemas
- Gestion des états de chargement
- Navigation automatique après succès
- Gestion d'erreurs complète

### 2. **Card** - Affichage en carte
- Informations essentielles
- Actions (éditer/supprimer)
- Statistiques et compteurs
- Confirmation de suppression

### 3. **List** - Liste avec fonctionnalités avancées
- Recherche en temps réel
- Filtrage par critères
- Tri personnalisable
- Pagination avec URL sync
- États vides et de chargement

## Entités Disponibles

### 🏢 Départements (`/departement/`)
```tsx
import { DepartementForm, DepartementCard, DepartementList } from "@/components/form/departement";
```

**Fonctionnalités :**
- Gestion des départements
- Comptage des filières et utilisateurs
- Validation des contraintes de suppression

### 🎓 Filières (`/filiere/`)
```tsx
import { FiliereForm, FiliereCard, FiliereList } from "@/components/form/filiere";
```

**Fonctionnalités :**
- Association aux départements
- Gestion des modules et utilisateurs
- Filtrage par département

### 📚 Modules (`/module/`)
```tsx
import { ModuleForm, ModuleCard, ModuleList } from "@/components/form/module";
```

**Fonctionnalités :**
- Codes et crédits des modules
- Association aux filières
- Gestion des enseignants et séances
- Affichage des heures

### 📅 Séances (`/seance/`)
```tsx
import { SeanceForm, SeanceCard, SeanceList } from "@/components/form/seance";
```

**Fonctionnalités :**
- Planification avec dates/heures
- Types de séances (COURS, TD, TP, etc.)
- Gestion des conflits d'horaires
- Association enseignant/module
- Informations de salle

### 👥 Utilisateurs (`/user/`)
```tsx
import { UserForm, UserCard, UserList } from "@/components/form/user";
```

**Fonctionnalités :**
- Gestion complète des utilisateurs
- Association département/filière
- Gestion des mots de passe
- Statut actif/inactif
- Affichage des rôles assignés
- Filtrage avancé

### 🛡️ Rôles (`/role/`)
```tsx
import { RoleForm, RoleCard, RoleList } from "@/components/form/role";
```

**Fonctionnalités :**
- Types de rôles prédéfinis
- Descriptions automatiques
- Gestion des permissions
- Comptage des utilisateurs assignés
- Validation des contraintes de suppression

## Composants UI Utilisés

### Composants de base
- `Button` - Boutons avec variants
- `Input` - Champs de saisie
- `Label` - Labels de formulaire
- `Textarea` - Zones de texte
- `Select` - Listes déroulantes
- `Card` - Conteneurs avec header/content/footer

### Icônes (Lucide React)
- Navigation : `ChevronLeft`, `ChevronRight`, `Plus`
- Actions : `Edit`, `Trash2`, `Save`, `Search`
- Informations : `Users`, `Calendar`, `Clock`, `MapPin`
- Entités : `Building2`, `GraduationCap`, `BookOpen`
- Tri : `SortAsc`, `SortDesc`, `Filter`
- États : `Loader2`

## Utilisation

### Import global
```tsx
import { 
  DepartementForm, DepartementCard, DepartementList,
  FiliereForm, FiliereCard, FiliereList,
  ModuleForm, ModuleCard, ModuleList,
  SeanceForm, SeanceCard, SeanceList,
  UserForm, UserCard, UserList,
  RoleForm, RoleCard, RoleList
} from "@/components/form";
```

### Exemples d'utilisation

#### Page de liste
```tsx
export default async function DepartementsPage() {
  const result = await getDepartements();
  
  return (
    <DepartementList 
      initialData={result.success ? {
        departements: result.data,
        pagination: result.pagination
      } : undefined}
    />
  );
}
```

#### Page de création
```tsx
export default function CreateDepartementPage() {
  return <DepartementForm mode="create" />;
}
```

#### Page d'édition
```tsx
export default async function EditDepartementPage({ params }: { params: { id: string } }) {
  const result = await getDepartementById(params.id);
  
  if (!result.success) {
    return <div>Département non trouvé</div>;
  }
  
  return (
    <DepartementForm 
      mode="edit" 
      initialData={result.data}
    />
  );
}
```

## Fonctionnalités Communes

### 🔍 Recherche
- Recherche en temps réel
- Recherche dans plusieurs champs
- Debouncing automatique

### 🔄 Tri
- Tri par nom, date, code
- Ordre croissant/décroissant
- Indicateurs visuels

### 📄 Pagination
- Navigation page par page
- Affichage des compteurs
- Synchronisation URL

### 🎯 Filtrage
- Filtres par entité parente
- Filtres par type/statut
- Filtres par date

### ⚡ Performance
- Transitions React pour UI fluide
- États de chargement appropriés
- Optimisation des re-renders

### 🛡️ Validation
- Validation côté client avec Zod
- Messages d'erreur contextuels
- Validation des contraintes métier

### 🎨 Design
- Design system cohérent
- Responsive design
- Mode sombre compatible
- Animations subtiles

## Actions Serveur Intégrées

Chaque composant utilise les actions serveur correspondantes :

- **Départements :** `/lib/actions/departement.ts`
- **Filières :** `/lib/actions/filiere.ts`
- **Modules :** `/lib/actions/module.ts`
- **Séances :** `/lib/actions/seance.ts`

## Schémas de Validation

Tous les formulaires utilisent les schémas Zod de `/lib/zodshema.ts` :

- `CreateDepartementSchema`, `UpdateDepartementSchema`
- `CreateFiliereSchema`, `UpdateFiliereSchema`
- `CreateModuleSchema`, `UpdateModuleSchema`
- `CreateSeanceSchema`, `UpdateSeanceSchema`

## Gestion d'État

### États locaux
- Données de formulaire
- États de chargement
- Messages d'erreur
- Filtres et pagination

### États serveur
- Données des entités
- Relations entre entités
- Validation côté serveur

## Responsive Design

Tous les composants sont optimisés pour :
- **Mobile :** Layout en colonne, navigation tactile
- **Tablet :** Grille 2 colonnes, filtres adaptés
- **Desktop :** Grille 3 colonnes, tous les contrôles

## Accessibilité

- Labels appropriés pour tous les champs
- Navigation au clavier
- Contrastes suffisants
- Messages d'erreur associés aux champs

## Maintenance

### Ajout d'une nouvelle entité
1. Créer le dossier `/nouvelle-entite/`
2. Implémenter les 3 composants (form, card, list)
3. Créer le fichier `index.ts`
4. Ajouter l'export dans `/form/index.ts`

### Modification d'un composant existant
1. Respecter l'interface existante
2. Maintenir la compatibilité des props
3. Tester les intégrations existantes

Cette architecture modulaire permet une maintenance facile et une évolutivité optimale du système de gestion HEEC Manager.
