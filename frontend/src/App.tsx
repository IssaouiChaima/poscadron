/**
 * Position Cadron — Frontend (fichier unique)
 * ==============================================
 * Application réduite à un seul écran opérateur : on scanne (ou tape) le
 * matricule d'un outil, l'app affiche sa hauteur cuivre et sa hauteur isolant.
 * Pas de machines, pas d'admin, pas d'alertes, pas de photo.
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
  const [scanLocked, setScanLocked] = useState(false)

  useEffect(() => {
    scanInputRef.current?.focus()
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function refocus() {
    setTimeout(() => scanInputRef.current?.focus(), 50)
  }

  function resetScan() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setScanValue("")
    setTool(null)
    setError(null)
    setScanLocked(false)
    refocus()
  }

  function submitScan(rawValue: string) {
    const matricule = rawValue.trim()
    if (!matricule || scanLocked) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    setError(null)

    toolsApi
      .getByMatricule(matricule)
      .then((data) => {
        setTool(data)
        setScanValue(matricule)
        setScanLocked(true)
      })
      .catch(() => {
        setTool(null)
        setError("Aucun outil trouvé pour ce matricule.")
        setScanLocked(false)
      })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (scanLocked) return

    const newValue = e.target.value
    setScanValue(newValue)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => submitScan(newValue), SCAN_AUTO_SUBMIT_DELAY_MS)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (scanLocked) return
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
            readOnly={scanLocked}
            autoFocus
            className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-center text-lg font-mono tracking-wide text-industrial-900 focus:border-industrial-700 focus:outline-none disabled:cursor-default disabled:text-industrial-900"
            placeholder="En attente d'un scan..."
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={resetScan}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            Nouveau scan
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-status-out">{error}</p>}

        <div className="mt-10 grid grid-cols-2 gap-10">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Hauteur cuivre</p>
            <div className="flex h-16 items-center justify-center rounded-md bg-industrial-700 text-lg font-semibold text-white">
              {tool?.hauteur_cuivre ?? ""}
            </div>
          </div>
          <div className="space-y-4">
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
