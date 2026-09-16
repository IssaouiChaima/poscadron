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
 * (pos_cadron, table tools) que l'écran opérateur. Un même matricule peut
 * apparaître sur plusieurs lignes : chaque ligne = une section fil avec sa
 * propre paire hauteur cuivre / hauteur isolant.
 */

import { FormEvent, useEffect, useState } from "react"
import axios from "axios"

// =====================================================================
// 1. TYPES
// =====================================================================

export interface Tool {
  id: number
  matricule: string
  section_fil: string
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
  create: (data: { matricule: string; section_fil: string; hauteur_cuivre?: string; hauteur_isolant?: string }) =>
    apiClient.post<Tool>("/api/tools/", data).then((r) => r.data),
  update: (id: number, data: { matricule?: string; section_fil?: string; hauteur_cuivre?: string; hauteur_isolant?: string }) =>
    apiClient.put<Tool>(`/api/tools/${id}`, data).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/api/tools/${id}`),
}

// =====================================================================
// 3. ICÔNES (inline SVG, pas de dépendance externe)
// =====================================================================

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

function IconEmptyBox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 12 4l9 4.5M3 8.5v9L12 22M3 8.5 12 13m0 9 9-4.5v-9M12 13l9-4.5M12 13v9" />
    </svg>
  )
}

// =====================================================================
// 4. ÉCRAN DE CONNEXION (mot de passe unique)
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-100"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white shadow-md shadow-blue-200">
            <IconLock />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900">Administration</h1>
            <p className="mt-1 text-sm text-blue-500/80">Accès réservé — mot de passe requis.</p>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            autoFocus
            required
            className="w-full rounded-xl border border-blue-200 px-3.5 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {error && (
            <p className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              <IconX />
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Vérification..." : "Se connecter"}
        </button>
      </form>
    </div>
  )
}

// =====================================================================
// 5. TABLEAU DE GESTION DES OUTILS (ajout / modification / suppression)
// =====================================================================

function ToolsManager({ onLogout }: { onLogout: () => void }) {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Formulaire d'ajout
  const [newMatricule, setNewMatricule] = useState("")
  const [newSectionFil, setNewSectionFil] = useState("")
  const [newHauteurCuivre, setNewHauteurCuivre] = useState("")
  const [newHauteurIsolant, setNewHauteurIsolant] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Ligne en cours d'édition
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editMatricule, setEditMatricule] = useState("")
  const [editSectionFil, setEditSectionFil] = useState("")
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
      const trimmedSection = newSectionFil.trim()

      if (!trimmedSection) {
        setAddError("Veuillez saisir une section fil.")
        return
      }

      await toolsApi.create({
        matricule: newMatricule.trim(),
        section_fil: trimmedSection,
        hauteur_cuivre: newHauteurCuivre || undefined,
        hauteur_isolant: newHauteurIsolant || undefined,
      })

      setNewMatricule("")
      setNewSectionFil("")
      setNewHauteurCuivre("")
      setNewHauteurIsolant("")
      refresh()
    } catch (err: any) {
      setAddError(err.response?.data?.detail ?? "Impossible d'ajouter cette section.")
    } finally {
      setIsAdding(false)
    }
  }

  function startEdit(tool: Tool) {
    setEditingId(tool.id)
    setEditMatricule(tool.matricule)
    setEditSectionFil(tool.section_fil)
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
        section_fil: editSectionFil.trim(),
        hauteur_cuivre: editHauteurCuivre,
        hauteur_isolant: editHauteurIsolant,
      })
      setEditingId(null)
      refresh()
    } catch (err: any) {
      setEditError(err.response?.data?.detail ?? "Impossible d'enregistrer les modifications.")
    }
  }

  async function handleDelete(id: number, matricule: string, sectionFil: string) {
    if (!confirm(`Supprimer la section ${sectionFil} de l'outil ${matricule} ?`)) return
    await toolsApi.remove(id)
    refresh()
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-blue-800 bg-blue-900 text-slate-100 shadow-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <img src="/leoni-logo.svg" alt="LEONI" className="h-10 w-auto rounded-sm object-contain" />
            <span className="h-6 w-px bg-blue-400/25" />
            <span className="text-lg font-semibold tracking-tight text-white">Administration — Outils</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg border border-blue-400/40 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-blue-100 transition-colors hover:bg-white/15"
          >
            <IconLogout />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-l-4 border-blue-700 pl-4">
            <div>
              <h2 className="text-base font-semibold text-blue-900">Ajouter une section</h2>
        
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-blue-900">
                  Numéro d'outil
                </label>
                <input
                  value={newMatricule}
                  onChange={(e) => setNewMatricule(e.target.value)}
                  placeholder="OUT-001"
                  required
                  className="h-12 w-full rounded-xl border-2 border-blue-600 bg-blue-50 px-3.5 text-base font-semibold text-blue-900 outline-none transition-colors placeholder:text-blue-400 focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-blue-700">
                  Hauteur cuivre
                </label>
                <input
                  value={newHauteurCuivre}
                  onChange={(e) => setNewHauteurCuivre(e.target.value)}
                  className="h-12 w-full rounded-xl border border-blue-400 bg-blue-50/60 px-3.5 text-base font-medium text-blue-900 outline-none transition-colors placeholder:text-blue-300 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-blue-700">
                  Hauteur isolant
                </label>
                <input
                  value={newHauteurIsolant}
                  onChange={(e) => setNewHauteurIsolant(e.target.value)}
                  className="h-12 w-full rounded-xl border border-blue-400 bg-blue-50/60 px-3.5 text-base font-medium text-blue-900 outline-none transition-colors placeholder:text-blue-300 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Section fil
                </label>
                <input
                  value={newSectionFil}
                  onChange={(e) => setNewSectionFil(e.target.value)}
                  placeholder="0.35"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              {addError ? (
                <p className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                  <IconX />
                  {addError}
                </p>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={isAdding}
                className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IconPlus />
                {isAdding ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/50 px-6 py-4">
            <h2 className="border-l-4 border-blue-700 pl-4 text-base font-semibold text-blue-900">
              Liste des sections
            </h2>
            {!isLoading && tools.length > 0 && (
              <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-white">
                {tools.length} {tools.length > 1 ? "sections" : "section"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 p-8 text-sm text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-industrial-700" />
              Chargement...
            </div>
          ) : tools.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-slate-400">
              <IconEmptyBox />
              <p className="text-sm">Aucune section enregistrée.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-900 text-xs uppercase tracking-wide text-blue-100">
                <tr>
                  <th className="px-6 py-3 font-semibold text-white">Numéro d'outil</th>
                  <th className="px-6 py-3 font-semibold text-blue-200">Hauteur cuivre</th>
                  <th className="px-6 py-3 font-semibold text-blue-200">Hauteur isolant</th>
                  <th className="px-6 py-3 font-semibold text-blue-300">Section fil</th>
                  <th className="px-6 py-3 text-right font-semibold text-blue-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tools.map((tool) => (
                  <tr key={tool.id} className="transition-colors hover:bg-slate-50/80">
                    {editingId === tool.id ? (
                      <>
                        <td className="bg-blue-50/50 px-6 py-3">
                          <input
                            value={editMatricule}
                            onChange={(e) => setEditMatricule(e.target.value)}
                            className="w-full rounded-lg border border-blue-300 px-2.5 py-1.5 text-sm font-medium text-blue-900 outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                        <td className="bg-blue-50/30 px-6 py-3">
                          <input
                            value={editHauteurCuivre}
                            onChange={(e) => setEditHauteurCuivre(e.target.value)}
                            className="w-full rounded-lg border border-blue-300 px-2.5 py-1.5 text-sm font-medium text-blue-900 outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                        <td className="bg-blue-50/30 px-6 py-3">
                          <input
                            value={editHauteurIsolant}
                            onChange={(e) => setEditHauteurIsolant(e.target.value)}
                            className="w-full rounded-lg border border-blue-300 px-2.5 py-1.5 text-sm font-medium text-blue-900 outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            value={editSectionFil}
                            onChange={(e) => setEditSectionFil(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(tool.id)}
                              className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
                            >
                              <IconCheck />
                              Enregistrer
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                            >
                              <IconX />
                              Annuler
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3 font-bold text-blue-900">{tool.matricule}</td>
                        <td className="px-6 py-3 font-medium text-blue-700">{tool.hauteur_cuivre ?? "—"}</td>
                        <td className="px-6 py-3 font-medium text-blue-700">{tool.hauteur_isolant ?? "—"}</td>
                        <td className="px-6 py-3">
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-600">
                            {tool.section_fil}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(tool)}
                              className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                            >
                              <IconEdit />
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(tool.id, tool.matricule, tool.section_fil)}
                              className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 transition-colors hover:bg-blue-100"
                            >
                              <IconTrash />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {editError && (
            <p className="flex items-center gap-1.5 border-t border-blue-100 bg-blue-50/50 px-6 py-3 text-sm font-medium text-blue-700">
              <IconX />
              {editError}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

// =====================================================================
// 6. COMPOSANT ADMIN (point d'entrée : gate mot de passe → gestion)
// =====================================================================

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />
  }

  return <ToolsManager onLogout={() => setIsAuthenticated(false)} />
}