"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X } from "lucide-react"
import { api, type VentaCafeTostado } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

const PRESENTACIONES: [string, string][] = [
  ["250g", "250 g"],
  ["500g", "500 g"],
  ["2500g", "2500 g"],
]

const TIPOS: [string, string][] = [
  ["molido", "Molido"],
  ["grano", "Grano"],
]

function badgePresentacion(p: string) {
  const map: Record<string, string> = {
    "250g": "bg-sky-100 text-sky-800",
    "500g": "bg-indigo-100 text-indigo-800",
    "2500g": "bg-violet-100 text-violet-800",
  }
  return map[p] ?? "bg-muted text-muted-foreground"
}

interface FormData {
  fecha_venta: string
  cliente: string
  cantidad: string
  presentacion: string
  tipo: string
  seleccionado: boolean
  valor: string
}

const EMPTY: FormData = {
  fecha_venta: new Date().toISOString().slice(0, 10),
  cliente: "",
  cantidad: "",
  presentacion: "250g",
  tipo: "molido",
  seleccionado: false,
  valor: "",
}

function FormVentaCafeTostado({ onGuardado, onCerrar }: { onGuardado: () => void; onCerrar: () => void }) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha_venta || !form.cliente || !form.cantidad || !form.presentacion || !form.tipo || !form.valor) {
      setError("Todos los campos obligatorios deben estar completos.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.produccion.ventasCafeTostado.create({
        fecha_venta: form.fecha_venta,
        cliente: form.cliente,
        cantidad: Number(form.cantidad),
        presentacion: form.presentacion as never,
        tipo: form.tipo as never,
        seleccionado: form.seleccionado,
        valor: form.valor,
      })
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
          <h2 className="font-semibold">Nueva venta de café tostado</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Fecha de venta *</label>
              <input type="date" value={form.fecha_venta} onChange={set("fecha_venta")} className={input} required />
            </div>
            <div className={field}>
              <label className={label}>Cantidad *</label>
              <input type="number" min="1" value={form.cantidad} onChange={set("cantidad")} className={input} placeholder="0" required />
            </div>
          </div>

          <div className={field}>
            <label className={label}>Cliente *</label>
            <input value={form.cliente} onChange={set("cliente")} className={input} placeholder="Nombre del cliente" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Presentación *</label>
              <select value={form.presentacion} onChange={set("presentacion")} className={input} required>
                {PRESENTACIONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className={field}>
              <label className={label}>Tipo *</label>
              <select value={form.tipo} onChange={set("tipo")} className={input} required>
                {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className={field}>
            <label className={label}>Valor *</label>
            <input type="number" step="any" min="0" value={form.valor} onChange={set("valor")} className={input} placeholder="0" required />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="seleccionado"
              checked={form.seleccionado}
              onChange={e => setForm(f => ({ ...f, seleccionado: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="seleccionado" className="text-sm">Seleccionado</label>
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

export default function VentasCafeTostadoPage() {
  const [ventas, setVentas] = useState<VentaCafeTostado[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = () => {
    setLoading(true)
    api.produccion.ventasCafeTostado.list()
      .then(r => setVentas(r.results))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormVentaCafeTostado
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Ventas de café tostado</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Registro de ventas de café procesado</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nueva venta
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-left">Cliente</th>
                <th className="px-3 py-2.5 text-right">Cantidad</th>
                <th className="px-3 py-2.5 text-left">Presentación</th>
                <th className="px-3 py-2.5 text-left">Tipo</th>
                <th className="px-3 py-2.5 text-center">Seleccionado</th>
                <th className="px-3 py-2.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : ventas.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                  Sin ventas registradas.
                </td></tr>
              ) : ventas.map(v => (
                <tr key={v.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{v.fecha_venta}</td>
                  <td className="px-3 py-2 font-medium">{v.cliente}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{v.cantidad}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgePresentacion(v.presentacion)}`}>
                      {v.presentacion}
                    </span>
                  </td>
                  <td className="px-3 py-2 capitalize">{v.tipo}</td>
                  <td className="px-3 py-2 text-center">
                    {v.seleccionado ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-800">Sí</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(v.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
