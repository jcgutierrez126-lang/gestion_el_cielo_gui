"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, Pencil } from "lucide-react"
import { api, type Lote } from "@/lib/api"

interface FormData {
  nombre: string
  abreviatura: string
  variedad: string
  anio_siembra: string
  num_arboles: string
  gramos_abono_palo: string
}

const EMPTY: FormData = {
  nombre: "", abreviatura: "", variedad: "",
  anio_siembra: "", num_arboles: "", gramos_abono_palo: "",
}

function FormLote({
  inicial,
  titulo,
  onGuardado,
  onCerrar,
}: {
  inicial?: Partial<FormData> & { id?: number }
  titulo: string
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...inicial })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.nombre || !form.variedad || !form.anio_siembra || !form.num_arboles) {
      setError("Nombre, variedad, año de siembra y número de árboles son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const payload = {
        nombre: form.nombre,
        abreviatura: form.abreviatura.trim() || null,
        variedad: form.variedad,
        anio_siembra: Number(form.anio_siembra),
        num_arboles: Number(form.num_arboles),
        gramos_abono_palo: form.gramos_abono_palo || undefined,
      }
      if (inicial?.id) {
        await api.produccion.lotes.update(inicial.id, payload)
      } else {
        await api.produccion.lotes.create(payload)
      }
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  const field = "flex flex-col gap-1"
  const label = "text-xs font-medium text-muted-foreground"
  const input = "text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">{titulo}</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className={`${field} col-span-2`}>
              <label className={label}>Nombre *</label>
              <input value={form.nombre} onChange={set("nombre")} className={input} placeholder="Ej: La Milagrosa" required />
            </div>
            <div className={field}>
              <label className={label}>Abreviatura</label>
              <input value={form.abreviatura} onChange={set("abreviatura")} className={input} placeholder="Ej: M" maxLength={20} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Variedad *</label>
              <input value={form.variedad} onChange={set("variedad")} className={input} placeholder="Ej: Castillo" required />
            </div>
            <div className={field}>
              <label className={label}>Año de siembra *</label>
              <input type="number" min="1900" max="2100" value={form.anio_siembra} onChange={set("anio_siembra")}
                className={input} placeholder="2020" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Número de árboles *</label>
              <input type="number" min="0" value={form.num_arboles} onChange={set("num_arboles")}
                className={input} placeholder="0" required />
            </div>
            <div className={field}>
              <label className={label}>Gramos de abono por palo</label>
              <input type="number" step="any" min="0" value={form.gramos_abono_palo} onChange={set("gramos_abono_palo")}
                className={input} placeholder="0" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar}
              className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={guardando}
              className="text-sm px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 flex items-center gap-2">
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LotesPage() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ open: boolean; lote?: Lote }>({ open: false })

  const cargar = () => {
    setLoading(true)
    api.produccion.lotes.list().then(setLotes).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  function abrirEditar(lote: Lote) {
    setForm({ open: true, lote })
  }

  return (
    <div className="space-y-5">
      {form.open && (
        <FormLote
          titulo={form.lote ? "Editar lote" : "Nuevo lote"}
          inicial={form.lote ? {
            id: form.lote.id,
            nombre: form.lote.nombre,
            abreviatura: form.lote.abreviatura ?? "",
            variedad: form.lote.variedad,
            anio_siembra: String(form.lote.anio_siembra),
            num_arboles: String(form.lote.num_arboles),
            gramos_abono_palo: form.lote.gramos_abono_palo ?? "",
          } : undefined}
          onGuardado={() => { cargar(); setForm({ open: false }) }}
          onCerrar={() => setForm({ open: false })}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Lotes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gestión de lotes de cultivo</p>
        </div>
        <button onClick={() => setForm({ open: true })}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nuevo lote
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left w-24">Abrev.</th>
                <th className="px-3 py-2.5 text-left">Nombre</th>
                <th className="px-3 py-2.5 text-left">Variedad</th>
                <th className="px-3 py-2.5 text-left">Año</th>
                <th className="px-3 py-2.5 text-right">Árboles</th>
                <th className="px-3 py-2.5 text-right">g Abono/palo</th>
                <th className="px-3 py-2.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : lotes.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                  Sin lotes registrados.
                </td></tr>
              ) : lotes.map(l => (
                <tr key={l.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2">
                    {l.abreviatura
                      ? <span className="font-mono font-semibold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">{l.abreviatura}</span>
                      : <span className="text-muted-foreground text-xs">—</span>
                    }
                  </td>
                  <td className="px-3 py-2 font-medium">{l.nombre}</td>
                  <td className="px-3 py-2">{l.variedad}</td>
                  <td className="px-3 py-2 tabular-nums">{l.anio_siembra}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.num_arboles.toLocaleString("es-CO")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.gramos_abono_palo ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => abrirEditar(l)}
                      className="p-1 text-muted-foreground hover:bg-muted rounded">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
