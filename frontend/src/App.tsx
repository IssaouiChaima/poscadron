/**
 * Position Cadron — Frontend opérateur (fichier unique)
 * ========================================================
 * Écran unique, 100% lecture seule : on scanne (ou tape) le matricule d'un
 * outil, l'app affiche toutes ses sections fil, chacune avec sa propre
 * hauteur cuivre et hauteur isolant (un même matricule peut avoir plusieurs
 * sections).
 * L'ajout/modification/suppression des outils se fait exclusivement depuis
 * l'interface admin (Admin.tsx, accessible via /admin), indépendante de
 * cette page.
 */

import { useEffect, useRef, useState } from "react"
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

export const apiClient = axios.create({
  baseURL: API_URL,
})

export const toolsApi = {
  getByMatricule: (matricule: string) =>
    apiClient.get<Tool[]>(`/api/tools/${matricule}`).then((r) => r.data),
}

// =====================================================================
// 3. PAGE OPÉRATEUR (unique écran de l'application)
// =====================================================================

const SCAN_AUTO_SUBMIT_DELAY_MS = 250

export default function App() {
  const scanInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [scanValue, setScanValue] = useState("")
  const [tools, setTools] = useState<Tool[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    scanInputRef.current?.focus()
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function refocus() {
    setTimeout(() => scanInputRef.current?.focus(), 50)
  }

  function submitScan(rawValue: string) {
    const matricule = rawValue.trim()
    if (!matricule) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    setError(null)

    toolsApi
      .getByMatricule(matricule)
      .then((data) => setTools(data))
      .catch(() => {
        setTools([])
        setError("Aucun outil trouvé pour ce matricule.")
      })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setScanValue(newValue)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => submitScan(newValue), SCAN_AUTO_SUBMIT_DELAY_MS)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      submitScan(scanValue)
    }
  }

  function resetScan() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setScanValue("")
    setTools([])
    setError(null)
    scanInputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-blue-200 bg-industrial-900 text-slate-100">
        <div className="mx-auto flex max-w-3xl items-center px-6 py-3">
          <img src="/leoni-logo.svg" alt="LEONI" className="h-10 w-auto rounded-sm object-contain" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Numéro d'outil</label>
          <button
            onClick={resetScan}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Nouveau scan
          </button>
        </div>
        <div className="mt-2">
          <input
            ref={scanInputRef}
            value={scanValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={refocus}
            autoFocus
            className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-center text-lg font-mono tracking-wide text-industrial-900 focus:border-industrial-700 focus:outline-none"
            placeholder="En attente d'un scan..."
          />
        </div>

        {error && <p className="mt-4 text-sm text-status-out">{error}</p>}

        {tools.length > 0 && (
          <div className="mt-10 space-y-4">
            <div className="grid grid-cols-3 gap-6 px-1 text-sm font-medium text-slate-700">
              <p>Hauteur cuivre</p>
              <p>Hauteur isolant</p>
              <p>Section fil</p>
            </div>
            {tools.map((tool, index) => (
              <div key={`${tool.id ?? tool.matricule}-${index}`} className="grid grid-cols-3 gap-6">
                <div className="flex h-16 items-center justify-center rounded-md bg-industrial-700 text-lg font-semibold text-white">
                  {tool.hauteur_cuivre ?? "—"}
                </div>
                <div className="flex h-16 items-center justify-center rounded-md bg-industrial-700 text-lg font-semibold text-white">
                  {tool.hauteur_isolant ?? "—"}
                </div>
                <div className="flex min-h-16 items-center justify-center rounded-md bg-orange-500 px-2 py-2 text-center">
                  <span className="text-base font-semibold text-white">{tool.section_fil ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
