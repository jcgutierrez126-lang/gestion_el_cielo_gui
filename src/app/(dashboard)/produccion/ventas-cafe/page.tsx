"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { api, type VentaCafe, type Cuenta } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

function cop(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)
}

const TIPOS_CAFE: [string, string][] = [
  ["pergamino_seco", "Pergamino seco"],
  ["pasilla", "Pasilla"],
  ["corriente", "Corriente"],
  ["cereza", "Cereza"],
]

const CAFE_COLORS: Record<string, string> = {
  pergamino_seco: "#f59e0b",
  pasilla: "#f97316",
  corriente: "#a8a29e",
  cereza: "#ef4444",
}

function badgeTipo(t: string) {
  const map: Record<string, string> = {
    pergamino_seco: "bg-amber-100 text-amber-800",
    pasilla: "bg-orange-100 text-orange-800",
    corriente: "bg-stone-100 text-stone-700",
    cereza: "bg-red-100 text-red-800",
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
  tipo_cafe: string
  kilos: string
  cargas: string
  factor: string
  precio_kilo: string
  comprador: string
  cuenta_destino: string
  retefuente: string
}

const EMPTY: FormData = {
  fecha: new Date().toISOString().slice(0, 10),
  tipo_cafe: "pergamino_seco",
  kilos: "",
  cargas: "",
  factor: "1",
  precio_kilo: "",
  comprador: "",
  cuenta_destino: "",
  retefuente: "0",
}

function FormVentaCafe({ cuentas, onGuardado, onCerrar }: { cuentas: Cuenta[]; onGuardado: () => void; onCerrar: () => void }) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha || !form.tipo_cafe || !form.kilos || !form.precio_kilo || !form.comprador || !form.cuenta_destino) {
      setError("Fecha, tipo, kilos, precio, comprador y cuenta son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.produccion.ventasCafe.create({
        fecha: form.fecha,
        tipo_cafe: form.tipo_cafe as never,
        kilos: form.kilos,
        cargas: form.cargas || undefined,
        factor: form.factor || "1",
        precio_kilo: form.precio_kilo,
        comprador: form.comprador,
        cuenta_destino: Number(form.cuenta_destino),
        retefuente: form.retefuente || "0",
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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Nueva venta de café</h2>
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
              <label className={label}>Tipo de café *</label>
              <select value={form.tipo_cafe} onChange={set("tipo_cafe")} className={input} required>
                {TIPOS_CAFE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={field}>
              <label className={label}>Kilos *</label>
              <input type="number" step="any" min="0" value={form.kilos} onChange={set("kilos")} className={input} placeholder="0" required />
            </div>
            <div className={field}>
              <label className={label}>Cargas</label>
              <input type="number" step="any" min="0" value={form.cargas} onChange={set("cargas")} className={input} placeholder="0" />
            </div>
            <div className={field}>
              <label className={label}>Factor</label>
              <input type="number" step="any" min="0" value={form.factor} onChange={set("factor")} className={input} placeholder="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Precio por kilo *</label>
              <input type="number" step="any" min="0" value={form.precio_kilo} onChange={set("precio_kilo")} className={input} placeholder="0" required />
            </div>
            <div className={field}>
              <label className={label}>Retefuente</label>
              <input type="number" step="any" min="0" value={form.retefuente} onChange={set("retefuente")} className={input} placeholder="0" />
            </div>
          </div>

          <div className={field}>
            <label className={label}>Comprador *</label>
            <input value={form.comprador} onChange={set("comprador")} className={input} placeholder="Nombre del comprador" required />
          </div>

          <div className={field}>
            <label className={label}>Cuenta destino *</label>
            <select value={form.cuenta_destino} onChange={set("cuenta_destino")} className={input} required>
              <option value="">Seleccionar…</option>
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
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

export default function VentasCafePage() {
  const [ventas, setVentas] = useState<VentaCafe[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  const cargar = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (desde) params.fecha_desde = desde
    if (hasta) params.fecha_hasta = hasta
    Promise.all([
      api.produccion.ventasCafe.list(params),
      api.finanzas.cuentas.list(),
    ]).then(([v, c]) => {
      setVentas(v.results)
      setCuentas(c)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const totalKilos = ventas.reduce((s, v) => s + Number(v.kilos), 0)
  const totalNeto = ventas.reduce((s, v) => s + Number(v.valor_neto), 0)
  const precioPromedio = totalKilos > 0 ? totalNeto / totalKilos : 0

  const porMes: Record<string, number> = {}
  for (const v of ventas) {
    const mes = v.fecha.slice(0, 7)
    porMes[mes] = (porMes[mes] ?? 0) + Number(v.valor_neto)
  }
  const dataMes = Object.entries(porMes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valor]) => ({ mes: mes.slice(5), valor }))

  const porTipo: Record<string, number> = {}
  for (const v of ventas) {
    porTipo[v.tipo_cafe] = (porTipo[v.tipo_cafe] ?? 0) + Number(v.valor_neto)
  }
  const dataTipo = Object.entries(porTipo).map(([tipo, valor]) => ({
    name: TIPOS_CAFE.find(([k]) => k === tipo)?.[1] ?? tipo,
    tipo,
    valor,
  }))

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormVentaCafe
          cuentas={cuentas}
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Ventas de café</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Pergamino seco, pasilla, corriente y cereza. El valor neto ya descuenta retefuente.
          </p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nueva venta
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Valor neto total</p>
          <p className="text-xl font-bold tabular-nums mt-1 text-amber-700">{cop(totalNeto)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total kilos</p>
          <p className="text-xl font-bold tabular-nums mt-1">{totalKilos.toLocaleString("es-CO")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Precio promedio / kg</p>
          <p className="text-xl font-bold tabular-nums mt-1">{cop(precioPromedio)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Número de ventas</p>
          <p className="text-xl font-bold tabular-nums mt-1">{ventas.length}</p>
        </div>
      </div>

      {/* Charts */}
      {ventas.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Valor neto por mes
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dataMes} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} width={40} />
                <Tooltip content={<CopTooltip />} />
                <Bar dataKey="valor" name="Valor neto" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Distribución por tipo
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
                    <Cell key={i} fill={CAFE_COLORS[d.tipo] ?? "#e4e4e7"} />
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
                <th className="px-3 py-2.5 text-right">Cargas</th>
                <th className="px-3 py-2.5 text-right">Precio/kg</th>
                <th className="px-3 py-2.5 text-right">Valor neto</th>
                <th className="px-3 py-2.5 text-left">Comprador</th>
                <th className="px-3 py-2.5 text-left">Cuenta destino</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : ventas.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                  Sin ventas registradas.
                </td></tr>
              ) : ventas.map(v => (
                <tr key={v.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{v.fecha}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeTipo(v.tipo_cafe)}`}>
                      {v.tipo_cafe.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(v.kilos).toLocaleString("es-CO")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{v.cargas ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(v.precio_kilo)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">{fmt(v.valor_neto)}</td>
                  <td className="px-3 py-2">{v.comprador}</td>
                  <td className="px-3 py-2 text-muted-foreground">{v.cuenta_destino_nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
