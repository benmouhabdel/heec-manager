"use client"

import { useState } from "react"
import { SeanceList, SeanceForm } from "@/components/form"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface SeanceManagementProps {
  initialSeances: any[]
  modules: any[]
  users: any[]
}

export function SeanceManagement({ initialSeances, modules, users }: SeanceManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingSeance, setEditingSeance] = useState<any>(null)

  const handleEdit = (seance: any) => {
    setEditingSeance(seance)
    setShowForm(true)
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingSeance(null)
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/administrators"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des Séances
              </h1>
            </div>
            <button
              onClick={() => {
                setEditingSeance(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Séance
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">
              {editingSeance ? "Modifier la Séance" : "Nouvelle Séance"}
            </h2>
            <SeanceForm
              initialData={editingSeance}
              mode={editingSeance ? "edit" : "create"}
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingSeance(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <SeanceList />
        )}
      </main>
    </div>
  )
}
