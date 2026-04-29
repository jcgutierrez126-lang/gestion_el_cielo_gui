"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { api, type VentaBanano } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

function cop(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)
}

const TIPOS_PLATANO: [string, string][] = [
  ["extra", "Extra"],
  ["primera", "Primera"],
  ["segunda", "Segunda"],
]

const BANANO_COLORS: Record<string, string> = {
  extra: "#22c55e",
  primera: "#3b82f6",
  segunda: "#eab308",
}

function badgeTipo(t: string) {
  const map: Record<string, string> = {
    extra: "bg-green-100 text-green-800",
    primera: "bg-blue-100 text-blue-800",
    segunda: "bg-yellow-100 text-yellow-800",
  }
  return map[t] ?? "bg-muted text-muted-foreground"
}

function CopTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name}: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(p.value)}
        </p>
      ))}
    </div>
  )
}

interface FormData {
  fecha: string
  tipo_platano: string
  kilos: string
  precio_kilo: string
}

const EMPTY: FormData = {
  fecha: new Date().toISOString().slice(0, 10),
  tipo_platano: "extra",
  kilos: "",
  precio_kilo: "",
}

function FormVentaBanano({ onGuardado, onCerrar }: { onGuardado: () => void; onCerrar: () => void }) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const valorTotal = form.kilos && form.precio_kilo
    ? Number(form.kilos) * Number(form.precio_kilo)
    : null

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha || !form.tipo_platano || !form.kilos || !form.precio_kilo) {
      setError("Todos los campos obligatorios deben estar completos.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.produccion.ventasBanano.create({
        fecha: form.fecha,
        tipo_platano: form.tipo_platano as never,
        kilos: form.kilos,
        precio_kilo: form.precio_kilo,
        valor_total: valorTotal !== null ? String(valorTotal) : undefined,
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
          <h2 className="font-semibold">Nueva venta de banano</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Fecha *</label>
              <input type="date" value={form.fecha} onChange={set("fecha")} className={input} required />
            </div>
            <div className={field}>
              <label className={label}>Tipo de plátano *</label>
              <select value={form.tipo_platano} onChange={set("tipo_platano")} className={input} required>
                {TIPOS_PLATANO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Kilos *</label>
              <input type="number" step="any" min="0" value={form.kilos} onChange={set("kilos")} className={input} placeholder="0" required />
            </div>
            <div className={field}>
              <label className={label}>Precio por kilo *</label>
              <input type="number" step="any" min="0" value={form.precio_kilo} onChange={set("precio_kilo")} className={input} placeholder="0" required />
            </div>
          </div>

          <div className={field}>
            <label className={label}>Valor total (calculado)</label>
            <input
              readOnly
              value={valorTotal !== null ? valorTotal.toLocaleString("es-CO") : ""}
              className={`${input} bg-muted/50 text-muted-foreground cursor-not-allowed`}
              placeholder="Se calcula automáticamente"
            />
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

export default function VentasBananoPage() {
  const [ventas, setVentas] = useState<VentaBanano[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  const cargar = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (desde) params.fecha_desde = desde
    if (hasta) params.fecha_hasta = hasta
    api.produccion.ventasBanano.list(params)
      .then(r => setVentas(r.results))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const totalKilos = ventas.reduce((s, v) => s + Number(v.kilos), 0)
  const totalValor = ventas.reduce((s, v) => s + Number(v.valor_total), 0)
  const precioPromedio = totalKilos > 0 ? totalValor / totalKilos : 0

  const porMes: Record<string, number> = {}
  for (const v of ventas) {
    const mes = v.fecha.slice(0, 7)
    porMes[mes] = (porMes[mes] ?? 0) + Number(v.valor_total)
  }
  const dataMes = Object.entries(porMes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valor]) => ({ mes: mes.slice(5), valor }))

  const porTipo: Record<string, number> = {}
  for (const v of ventas) {
    porTipo[v.tipo_platano] = (porTipo[v.tipo_platano] ?? 0) + Number(v.valor_total)
  }
  const dataTipo = Object.entries(porTipo).map(([tipo, valor]) => ({
    name: TIPOS_PLATANO.find(([k]) => k === tipo)?.[1] ?? tipo,
    tipo,
    valor,
  }))

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormVentaBanano
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Ventas de banano</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Extra, primera y segunda. El valor total = kilos × precio/kg.
          </p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nueva venta
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Valor total</p>
          <p className="text-xl font-bold tabular-nums mt-1 text-yellow-700">{cop(totalValor)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total kilos</p>
          <p className="text-xl font-bold tabular-nums mt-1">{totalKilos.toLocaleString("es-CO")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Precio promedio / kg</p>
          <p className="text-xl font-bold tabular-nums mt-1">{cop(precioPromedio)}</p>
        </div>
      </div>

      {/* Charts */}
      {ventas.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Valor por mes
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dataMes} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} width={44} />
                <Tooltip content={<CopTooltip />} />
                <Bar dataKey="valor" name="Valor" fill="#eab308" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Distribución por calidad
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={dataTipo}
                  cx="50%" cy="50%" outerRadius={65}
                  dataKey="valor"
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {dataTipo.map((d, i) => (
                    <Cell key={i} fill={BANANO_COLORS[d.tipo] ?? "#e4e4e7"} />
                  ))}
                </Pie>
                <Tooltip content={<CopTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background" />
        </div>
        <button onClick={cargar}
          className="text-sm px-4 py-1.5 rounded-md border border-border hover:bg-muted">Filtrar</button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-left">Tipo</th>
                <th className="px-3 py-2.5 text-right">Kilos</th>
                <th className="px-3 py-2.5 text-right">Precio/kg</th>
                <th className="px-3 py-2.5 text-right">Valor total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : ventas.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-sm text-muted-foreground">
                  Sin ventas registradas.
                </td></tr>
              ) : ventas.map(v => (
                <tr key={v.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{v.fecha}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeTipo(v.tipo_platano)}`}>
                      {v.tipo_platano.charAt(0).toUpperCase() + v.tipo_platano.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(v.kilos).toLocaleString("es-CO")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(v.precio_kilo)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">{fmt(v.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
