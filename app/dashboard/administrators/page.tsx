import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"
import Link from "next/link"
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  Building2,
  Shield
} from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Autoriser uniquement l'email administrateur
  const allowedEmail = "iabouelalaa@gmail.com"
  if (session.user.email !== allowedEmail) {
    redirect("/login")
  }

  const menuItems = [
    {
      title: "Utilisateurs",
      description: "Gérer les utilisateurs et leurs rôles",
      icon: Users,
      href: "/dashboard/administrators/users",
      color: "bg-blue-500",
    },
    {
      title: "Départements",
      description: "Gérer les départements",
      icon: Building2,
      href: "/dashboard/administrators/departements",
      color: "bg-purple-500",
    },
    {
      title: "Filières",
      description: "Gérer les filières par département",
      icon: GraduationCap,
      href: "/dashboard/administrators/filliere",
      color: "bg-green-500",
    },
    {
      title: "Modules",
      description: "Gérer les modules d'enseignement",
      icon: BookOpen,
      href: "/dashboard/administrators/module",
      color: "bg-orange-500",
    },
    {
      title: "Séances",
      description: "Planifier et gérer les séances",
      icon: Calendar,
      href: "/dashboard/administrators/seances",
      color: "bg-red-500",
    },
    {
      title: "Rôles",
      description: "Gérer les rôles et permissions",
      icon: Shield,
      href: "/dashboard/administrators/roles",
      color: "bg-indigo-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord Administrateur
          </h1>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Bienvenue, {session.user.name || session.user.email}!
          </h2>
          <p className="text-gray-600">
            Panneau d'administration HEEC Manager
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`${item.color} rounded-lg p-3 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                  <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
                    Accéder →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
