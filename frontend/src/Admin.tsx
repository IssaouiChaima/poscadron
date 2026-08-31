/**
 * Position Cadron — Interface Admin (fichier unique, indépendant)
 * ==================================================================
 * Page complètement séparée de l'écran opérateur (App.tsx) : bundle Vite
 * distinct (admin.html / admin-main.tsx), accessible via /admin.
 *
 * Protection : un seul mot de passe partagé (pas de compte, pas de liste
 * d'utilisateurs) vérifié à chaque chargement de la page — recharger /admin
 * redemande systématiquement le mot de passe (pas de session persistée).
 *
 * Permet d'ajouter, modifier et supprimer des outils dans la même base
 * (position_cadron, table tools) que l'écran opérateur.
 */

import { FormEvent, useEffect, useState } from "react"
import axios from "axios"

// =====================================================================
// 1. TYPES
// =====================================================================

export interface Tool {
  id: number
  matricule: string
  hauteur_cuivre: string | null
  hauteur_isolant: string | null
  created_at: string
  updated_at: string
}

// =====================================================================
// 2. CLIENT API
// =====================================================================

const API_URL = import.meta.env.VITE_API_URL

const apiClient = axios.create({
  baseURL: API_URL,
})

const adminApi = {
  login: (password: string) =>
    apiClient.post("/api/admin/login", { password }).then((r) => r.data),
}

const toolsApi = {
  list: () => apiClient.get<Tool[]>("/api/tools/").then((r) => r.data),
  create: (data: { matricule: string; hauteur_cuivre?: string; hauteur_isolant?: string }) =>
    apiClient.post<Tool>("/api/tools/", data).then((r) => r.data),
  update: (id: number, data: { matricule?: string; hauteur_cuivre?: string; hauteur_isolant?: string }) =>
    apiClient.put<Tool>(`/api/tools/${id}`, data).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/api/tools/${id}`),
}

// =====================================================================
// 3. ÉCRAN DE CONNEXION (mot de passe unique)
// =====================================================================

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await adminApi.login(password)
      onSuccess()
    } catch {
      setError("Mot de passe incorrect.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-industrial-900">Administration</h1>
        <p className="text-sm text-slate-500">Accès réservé — mot de passe requis.</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-status-out">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-industrial-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-industrial-800 disabled:opacity-50"
        >
          {isSubmitting ? "Vérification..." : "Se connecter"}
        </button>
      </form>
    </div>
  )
}

// =====================================================================
// 4. TABLEAU DE GESTION DES OUTILS (ajout / modification / suppression)
// =====================================================================

function ToolsManager({ onLogout }: { onLogout: () => void }) {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Formulaire d'ajout
  const [newMatricule, setNewMatricule] = useState("")
  const [newHauteurCuivre, setNewHauteurCuivre] = useState("")
  const [newHauteurIsolant, setNewHauteurIsolant] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Ligne en cours d'édition
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editMatricule, setEditMatricule] = useState("")
  const [editHauteurCuivre, setEditHauteurCuivre] = useState("")
  const [editHauteurIsolant, setEditHauteurIsolant] = useState("")
  const [editError, setEditError] = useState<string | null>(null)

  function refresh() {
    setIsLoading(true)
    toolsApi.list().then(setTools).finally(() => setIsLoading(false))
  }

  useEffect(refresh, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setAddError(null)
    setIsAdding(true)
    try {
      await toolsApi.create({
        matricule: newMatricule.trim(),
        hauteur_cuivre: newHauteurCuivre || undefined,
        hauteur_isolant: newHauteurIsolant || undefined,
      })
      setNewMatricule("")
      setNewHauteurCuivre("")
      setNewHauteurIsolant("")
      refresh()
    } catch (err: any) {
      setAddError(err.response?.data?.detail ?? "Impossible d'ajouter cet outil.")
    } finally {
      setIsAdding(false)
    }
  }

  function startEdit(tool: Tool) {
    setEditingId(tool.id)
    setEditMatricule(tool.matricule)
    setEditHauteurCuivre(tool.hauteur_cuivre ?? "")
    setEditHauteurIsolant(tool.hauteur_isolant ?? "")
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError(null)
  }

  async function saveEdit(id: number) {
    setEditError(null)
    try {
      await toolsApi.update(id, {
        matricule: editMatricule.trim(),
        hauteur_cuivre: editHauteurCuivre,
        hauteur_isolant: editHauteurIsolant,
      })
      setEditingId(null)
      refresh()
    } catch (err: any) {
      setEditError(err.response?.data?.detail ?? "Impossible d'enregistrer les modifications.")
    }
  }

  async function handleDelete(id: number, matricule: string) {
    if (!confirm(`Supprimer l'outil ${matricule} ?`)) return
    await toolsApi.remove(id)
    refresh()
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-blue-200 bg-industrial-900 text-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center">
            <img src="/leoni-logo.svg" alt="LEONI" className="h-10 w-auto rounded-sm object-contain" />
            <span className="ml-4 text-lg font-semibold">Administration — Outils</span>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg border border-blue-100/30 px-3 py-1.5 text-sm font-medium text-blue-100 transition-colors hover:bg-industrial-800"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Ajouter un outil</h2>
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Matricule</label>
              <input
                value={newMatricule}
                onChange={(e) => setNewMatricule(e.target.value)}
                placeholder="OUT-001"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Hauteur cuivre</label>
              <input
                value={newHauteurCuivre}
                onChange={(e) => setNewHauteurCuivre(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Hauteur isolant</label>
              <input
                value={newHauteurIsolant}
                onChange={(e) => setNewHauteurIsolant(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={isAdding}
                className="rounded-lg bg-industrial-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-industrial-800 disabled:opacity-50"
              >
                {isAdding ? "Ajout..." : "+ Ajouter"}
              </button>
              {addError && <p className="text-sm text-status-out">{addError}</p>}
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Liste des outils</h2>
          </div>

          {isLoading ? (
            <p className="p-6 text-sm text-slate-500">Chargement...</p>
          ) : tools.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Aucun outil enregistré.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Matricule</th>
                  <th className="px-6 py-3">Hauteur cuivre</th>
                  <th className="px-6 py-3">Hauteur isolant</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id} className="border-b border-slate-50 last:border-0">
                    {editingId === tool.id ? (
                      <>
                        <td className="px-6 py-3">
                          <input
                            value={editMatricule}
                            onChange={(e) => setEditMatricule(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            value={editHauteurCuivre}
                            onChange={(e) => setEditHauteurCuivre(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            value={editHauteurIsolant}
                            onChange={(e) => setEditHauteurIsolant(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button onClick={() => saveEdit(tool.id)} className="text-sm text-status-available underline">
                            Enregistrer
                          </button>
                          <button onClick={cancelEdit} className="text-sm text-slate-500 underline">
                            Annuler
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3 font-medium text-industrial-900">{tool.matricule}</td>
                        <td className="px-6 py-3 text-slate-600">{tool.hauteur_cuivre ?? "—"}</td>
                        <td className="px-6 py-3 text-slate-600">{tool.hauteur_isolant ?? "—"}</td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button onClick={() => startEdit(tool)} className="text-sm text-industrial-700 underline">
                            Modifier
                          </button>
                          <button onClick={() => handleDelete(tool.id, tool.matricule)} className="text-sm text-status-out underline">
                            Supprimer
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {editError && <p className="px-6 pb-4 text-sm text-status-out">{editError}</p>}
        </section>
      </main>
    </div>
  )
}

// =====================================================================
// 5. COMPOSANT ADMIN (point d'entrée : gate mot de passe → gestion)
// =====================================================================

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />
  }

  return <ToolsManager onLogout={() => setIsAuthenticated(false)} />
}
