"use client"

import { useState } from "react"
import { FiliereList, FiliereForm } from "@/components/form"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface FiliereManagementProps {
  initialFilieres: any[]
  departements: any[]
}

export function FiliereManagement({ initialFilieres, departements }: FiliereManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingFiliere, setEditingFiliere] = useState<any>(null)

  const handleEdit = (filiere: any) => {
    setEditingFiliere(filiere)
    setShowForm(true)
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingFiliere(null)
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
                Gestion des Filières
              </h1>
            </div>
            <button
              onClick={() => {
                setEditingFiliere(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Filière
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">
              {editingFiliere ? "Modifier la Filière" : "Nouvelle Filière"}
            </h2>
            <FiliereForm
              initialData={editingFiliere}
              mode={editingFiliere ? "edit" : "create"}
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingFiliere(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <FiliereList />
        )}
      </main>
    </div>
  )
}
