/**
 * Position Cadron — Frontend opérateur (fichier unique)
 * ========================================================
 * Écran unique, 100% lecture seule : on scanne (ou tape) le matricule d'un
 * outil, l'app affiche sa hauteur cuivre et sa hauteur isolant.
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
    apiClient.get<Tool>(`/api/tools/${matricule}`).then((r) => r.data),
}

// =====================================================================
// 3. PAGE OPÉRATEUR (unique écran de l'application)
// =====================================================================

const SCAN_AUTO_SUBMIT_DELAY_MS = 250

export default function App() {
  const scanInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [scanValue, setScanValue] = useState("")
  const [tool, setTool] = useState<Tool | null>(null)
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
    setScanValue("")
    setError(null)

    toolsApi
      .getByMatricule(matricule)
      .then((data) => setTool(data))
      .catch(() => {
        setTool(null)
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

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-blue-200 bg-industrial-900 text-slate-100">
        <div className="mx-auto flex max-w-3xl items-center px-6 py-3">
          <img src="/leoni-logo.svg" alt="LEONI" className="h-10 w-auto rounded-sm object-contain" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Numéro d'outil</label>
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

        <div className="mt-10 grid grid-cols-2 gap-10">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Hauteur cuivre</p>
            <div className="flex h-16 items-center justify-center rounded-md bg-industrial-700 text-lg font-semibold text-white">
              {tool?.hauteur_cuivre ?? ""}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Hauteur isolant</p>
            <div className="flex h-16 items-center justify-center rounded-md bg-industrial-700 text-lg font-semibold text-white">
              {tool?.hauteur_isolant ?? ""}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
