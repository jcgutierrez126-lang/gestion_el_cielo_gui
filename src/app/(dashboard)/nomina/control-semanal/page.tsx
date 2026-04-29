"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Download, Camera, CheckCircle, AlertCircle, ChevronDown, X, Plus, Printer } from "lucide-react"
import Link from "next/link"
import { api, type ControlSemanal, type Empleado, type TipoLabor, type Lote } from "@/lib/api"
import { getToken } from "@/lib/auth"
import * as XLSX from "xlsx"

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const TIPOS_COBRO = ["jornal", "kilos", "contrato", "nomina"]
const MESES_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

function semanaRefDesdeFecha(fechaStr: string): string {
  if (!fechaStr) return ""
  const d = new Date(fechaStr + "T12:00:00")
  const dow = d.getDay()
  const diffLunes = dow === 0 ? -6 : 1 - dow
  const lunes = new Date(d); lunes.setDate(d.getDate() + diffLunes)
  const sabado = new Date(lunes); sabado.setDate(lunes.getDate() + 5)
  const mes = MESES_ES[lunes.getMonth()]
  if (lunes.getMonth() === sabado.getMonth()) {
    return `Semana del ${lunes.getDate()} al ${sabado.getDate()} de ${mes} de ${lunes.getFullYear()}`
  }
  const mes2 = MESES_ES[sabado.getMonth()]
  return `Semana del ${lunes.getDate()} de ${mes} al ${sabado.getDate()} de ${mes2} de ${lunes.getFullYear()}`
}

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

function cop(n: string | number | null | undefined) {
  if (n === null || n === undefined || n === "") return "—"
  const v = Number(n)
  if (isNaN(v)) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v)
}

function fmtFecha(s: string | null | undefined) {
  if (!s) return ""
  const [, m, d] = s.split("-")
  return `${d}/${m}`
}

interface RegistroDiarioIA {
  nombre: string
  dia?: string | null
  fecha?: string | null
  lote?: string | null
  labor: string
  cantidad: number | null
  tipo_cobro: string
  valor: number | null
}

interface DatosIA {
  fecha_inicio?: string | null
  fecha?: string | null
  semana_ref?: string | null
  valor_jornal?: number | null
  registros: RegistroDiarioIA[]
  observaciones?: string | null
}

interface GrupoTrabajador {
  nombre: string
  registros: ControlSemanal[]
  total: number
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold tabular-nums leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

/* ─── Formulario registro manual ─── */
const HOY = new Date().toISOString().slice(0, 10)

function FormManual({ empleados, tiposLabor, lotes, onGuardado }: { empleados: Empleado[]; tiposLabor: TipoLabor[]; lotes: Lote[]; onGuardado: (semanaRef: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: "", fecha: HOY, dia: "", labor: "", lote: "",
    cantidad: "", tipo_cobro: "jornal", valor: "",
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function handleFecha(e: React.ChangeEvent<HTMLInputElement>) {
    const fecha = e.target.value
    const dow = new Date(fecha + "T12:00:00").getDay()
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    setForm(f => ({ ...f, fecha, dia: dias[dow] ?? "" }))
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.nombre.trim() || !form.labor.trim()) {
      setError("Nombre y labor son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const semanaRef = semanaRefDesdeFecha(form.fecha)
      const token = getToken()
      const res = await fetch(`${BASE}/api/v1/nomina/guardar-planilla/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          semana_ref: semanaRef,
          fecha_inicio: form.fecha,
          registros: [{
            nombre: form.nombre.trim(),
            dia: form.dia,
            fecha: form.fecha,
            lote: form.lote.trim(),
            labor: form.labor.trim(),
            cantidad: form.cantidad ? Number(form.cantidad) : null,
            tipo_cobro: form.tipo_cobro,
            valor: form.valor ? Number(form.valor) : null,
          }],
        }),
      })
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      setForm({ nombre: "", fecha: form.fecha, dia: form.dia, labor: "", lote: "", cantidad: "", tipo_cobro: "jornal", valor: "" })
      setAbierto(false)
      onGuardado(semanaRef)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  const inp = "text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring w-full"
  const lbl = "text-xs font-medium text-muted-foreground"

  if (!abierto) return (
    <button
      onClick={() => setAbierto(true)}
      className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
    >
      <Plus className="h-4 w-4" />
      Registro manual
    </button>
  )

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
        <p className="font-semibold text-sm">Nuevo registro manual</p>
        <button onClick={() => setAbierto(false)}><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={guardar} className="p-4 space-y-3">
        {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className={lbl}>Trabajador *</label>
            <select value={form.nombre} onChange={set("nombre")} className={inp} required>
              <option value="">Seleccionar trabajador…</option>
              {empleados.filter(e => e.activo).map(e => (
                <option key={e.id} value={e.nombre_completo}>{e.nombre_completo}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={lbl}>Fecha *</label>
            <input type="date" value={form.fecha} onChange={handleFecha} className={inp} required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className={lbl}>Día</label>
            <select value={form.dia} onChange={set("dia")} className={inp}>
              <option value="">— auto —</option>
              {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className={lbl}>Labor *</label>
            <select value={form.labor} onChange={set("labor")} className={inp} required>
              <option value="">Seleccionar labor…</option>
              {tiposLabor.map(t => (
                <option key={t.id} value={t.abreviatura ?? t.nombre}>
                  {t.abreviatura ? `${t.abreviatura} — ${t.nombre}` : t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={lbl}>Lote</label>
            <select value={form.lote} onChange={set("lote")} className={inp}>
              <option value="">— ninguno —</option>
              {lotes.map(l => (
                <option key={l.id} value={l.abreviatura ?? l.nombre}>
                  {l.abreviatura ? `${l.abreviatura} — ${l.nombre}` : l.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className={lbl}>Tipo cobro</label>
            <select value={form.tipo_cobro} onChange={set("tipo_cobro")} className={inp}>
              {TIPOS_COBRO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={lbl}>Cantidad</label>
            <input type="number" min="0" step="0.01" value={form.cantidad} onChange={set("cantidad")} className={inp} placeholder="Kilos / —" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={lbl}>Valor</label>
            <input type="number" min="0" step="1" value={form.valor} onChange={set("valor")} className={inp} placeholder="$" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setAbierto(false)}
            className="text-sm px-4 py-1.5 rounded-lg border border-border hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={guardando}
            className="text-sm px-5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 flex items-center gap-2">
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

const BADGE: Record<string, string> = {
  kilos:    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  jornal:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  contrato: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  nomina:   "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
}

/* ─── Panel subir planilla (foto o Excel) ─── */
function getLunesDeHoy(): string {
  const hoy = new Date()
  const dow = hoy.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate() + diff)
  return lunes.toISOString().slice(0, 10)
}

function PanelFoto({ onGuardado }: { onGuardado: (semanaRef: string) => void }) {
  const inputFotoRef  = useRef<HTMLInputElement>(null)
  const inputExcelRef = useRef<HTMLInputElement>(null)
  type Estado = "idle" | "fechando" | "leyendo" | "revisando" | "guardando" | "listo" | "error"
  const [estado, setEstado]           = useState<Estado>("idle")
  const [datos, setDatos]             = useState<DatosIA | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [preview, setPreview]         = useState<string | null>(null)
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null)
  const [nombreExcel, setNombreExcel] = useState("")
  const [fechaInicio, setFechaInicio] = useState(getLunesDeHoy)

  async function handleImagen(file: File) {
    setPreview(URL.createObjectURL(file))
    setEstado("leyendo")
    setError(null)
    const form = new FormData()
    form.append("imagen", file)
    try {
      const token = getToken()
      const res = await fetch(`${BASE}/api/v1/nomina/leer-planilla-diaria/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      const json = await res.json()
      setDatos(json.datos)
      setEstado("revisando")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setEstado("error")
    }
  }

  function handleExcelSeleccionado(file: File) {
    setArchivoExcel(file)
    setNombreExcel(file.name)
    setFechaInicio(getLunesDeHoy())
    setEstado("fechando")
  }

  async function procesarExcel() {
    if (!archivoExcel) return
    setEstado("leyendo")
    setError(null)
    const form = new FormData()
    form.append("archivo", archivoExcel)
    form.append("fecha_inicio", fechaInicio)
    try {
      const token = getToken()
      const res = await fetch(`${BASE}/api/v1/nomina/leer-planilla-excel/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      const json = await res.json()
      setDatos(json.datos)
      setEstado("revisando")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setEstado("error")
    }
  }

  async function guardar() {
    if (!datos) return
    setEstado("guardando")
    const fechaHeader = datos.fecha_inicio || datos.fecha || ""
    const semanaRef   = datos.semana_ref || semanaRefDesdeFecha(fechaHeader) || fechaHeader

    try {
      const token = getToken()
      const res = await fetch(`${BASE}/api/v1/nomina/guardar-planilla/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          semana_ref: semanaRef,
          fecha_inicio: fechaHeader,
          registros: datos.registros.map(r => ({
            nombre:     r.nombre,
            dia:        r.dia || "",
            fecha:      r.fecha || fechaHeader,
            lote:       r.lote || "",
            labor:      r.labor,
            cantidad:   r.cantidad,
            tipo_cobro: r.tipo_cobro,
            valor:      r.valor,
          })),
        }),
      })
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      setEstado("listo")
      onGuardado(semanaRef)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setEstado("error")
    }
  }

  const reset = () => {
    setEstado("idle"); setDatos(null); setPreview(null)
    setError(null); setArchivoExcel(null); setNombreExcel("")
  }

  const inp = "text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"

  if (estado === "idle") return (
    <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col gap-3 items-center text-center">
      <p className="font-semibold text-sm text-muted-foreground">Subir planilla</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => inputExcelRef.current?.click()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
        >
          <Download className="h-4 w-4 text-green-600" />
          Excel (.xlsx)
        </button>
        <button
          onClick={() => inputFotoRef.current?.click()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Camera className="h-4 w-4" />
          Foto
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">El Excel usa el formato de Planilla nueva.xlsx</p>
      <input ref={inputExcelRef} type="file" accept=".xlsx,.xls" className="hidden"
        onChange={e => e.target.files?.[0] && handleExcelSeleccionado(e.target.files[0])} />
      <input ref={inputFotoRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => e.target.files?.[0] && handleImagen(e.target.files[0])} />
    </div>
  )

  if (estado === "fechando") return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
        <p className="font-semibold text-sm">¿Semana del archivo?</p>
        <button onClick={reset}><X className="h-4 w-4" /></button>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">Archivo: <span className="font-medium">{nombreExcel}</span></p>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Lunes de la semana</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={inp} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={reset}
            className="text-sm px-4 py-1.5 rounded-lg border border-border hover:bg-muted">Cancelar</button>
          <button onClick={procesarExcel} disabled={!fechaInicio}
            className="text-sm px-5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50">
            Procesar
          </button>
        </div>
      </div>
    </div>
  )

  if (estado === "leyendo") return (
    <div className="border border-border rounded-xl p-7 flex flex-col items-center gap-3">
      {preview && <img src={preview} alt="planilla" className="max-h-36 rounded shadow object-contain" />}
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Leyendo planilla…</p>
    </div>
  )

  if (estado === "error") return (
    <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-5 flex gap-3">
      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold text-sm text-destructive">Error al leer la planilla</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">{error}</p>
        <button onClick={reset} className="mt-3 text-xs underline">Intentar de nuevo</button>
      </div>
    </div>
  )

  if (estado === "listo") return (
    <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-5 flex items-center gap-3">
      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
      <div>
        <p className="font-semibold text-sm">Registros guardados correctamente</p>
        <button onClick={reset} className="mt-1 text-xs underline text-muted-foreground">Subir otra planilla</button>
      </div>
    </div>
  )

  if (estado === "guardando") return (
    <div className="border border-border rounded-xl p-5 flex items-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p className="text-sm">Guardando registros…</p>
    </div>
  )

  /* revisando */
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b border-border">
        <div>
          <p className="font-semibold text-sm">Revisar antes de guardar</p>
          <p className="text-xs text-muted-foreground">
            {datos?.semana_ref ?? datos?.fecha_inicio ?? ""}
            {" · "}
            {datos?.registros.length} registros detectados
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted">
            <X className="h-3 w-3" /> Cancelar
          </button>
          <button onClick={guardar}
            className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded font-semibold hover:bg-primary/90">
            Guardar {datos?.registros.length} registros
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-[10px] text-muted-foreground uppercase tracking-wide">
              <th className="px-3 py-2 text-left">Trabajador</th>
              <th className="px-3 py-2 text-left">Día</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Labor</th>
              <th className="px-3 py-2 text-left">Lote</th>
              <th className="px-3 py-2 text-right">Cant.</th>
              <th className="px-3 py-2 text-left">Cobro</th>
              <th className="px-3 py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {datos?.registros.map((r, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                <td className="px-3 py-1.5 font-medium">{r.nombre}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{r.dia ?? "—"}</td>
                <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{r.fecha ? fmtFecha(r.fecha) : "—"}</td>
                <td className="px-3 py-1.5">{r.labor}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{r.lote || "—"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.cantidad ?? "—"}</td>
                <td className="px-3 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${BADGE[r.tipo_cobro] ?? "bg-muted text-muted-foreground"}`}>
                    {r.tipo_cobro}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.valor ? cop(r.valor) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {datos?.observaciones && (
        <p className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <span className="font-medium">Obs:</span> {datos.observaciones}
        </p>
      )}
    </div>
  )
}

/* ─── Página principal ─── */
export default function ControlSemanalPage() {
  const [semanas, setSemanas] = useState<{ semana_ref: string; fecha_min: string }[]>([])
  const [semanaActual, setSemanaActual] = useState<string>("")
  const [registros, setRegistros] = useState<ControlSemanal[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [tiposLabor, setTiposLabor] = useState<TipoLabor[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingReg, setLoadingReg] = useState(false)

  function cargarSemanas(seleccionar?: string) {
    return api.nomina.controlSemanal.semanas().then(data => {
      setSemanas(data)
      const sel = seleccionar ?? data[0]?.semana_ref ?? ""
      setSemanaActual(sel)
    })
  }

  useEffect(() => {
    Promise.all([
      cargarSemanas(),
      api.nomina.empleados.list().then(r => setEmpleados(r.results)),
      api.nomina.tiposLabor.list().then(r => setTiposLabor(r)),
      api.produccion.lotes.list().then(r => setLotes(r)),
    ]).finally(() => setLoadingInit(false))
  }, [])

  useEffect(() => {
    if (!semanaActual) return
    setLoadingReg(true)
    api.nomina.controlSemanal.porSemana(semanaActual)
      .then(data => setRegistros(data))
      .finally(() => setLoadingReg(false))
  }, [semanaActual])

  function handleGuardado(semanaRef: string) {
    cargarSemanas(semanaRef)
  }

  // Agrupación por trabajador
  const byName: Record<string, ControlSemanal[]> = {}
  for (const r of registros) {
    const key = r.empleado_nombre
    if (!byName[key]) byName[key] = []
    byName[key].push(r)
  }
  const grupos: GrupoTrabajador[] = Object.keys(byName)
    .sort()
    .map(nombre => {
      const regs = byName[nombre].slice().sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""))
      const total = regs.reduce((s, r) => s + Number(r.valor ?? 0), 0)
      return { nombre, registros: regs, total }
    })

  // KPIs
  const totalPagado    = registros.reduce((s, r) => s + Number(r.valor ?? 0), 0)
  const totalKilos     = registros.reduce((s, r) => s + Number(r.kilos ?? 0), 0)
  const totalJornales  = registros.reduce((s, r) => s + Number(r.jornales ?? 0), 0)
  const numTrabajadores = Object.keys(byName).length

  function descargarExcel() {
    const filas = registros.map(r => ({
      "Semana":       r.semana_ref,
      "Trabajador":   r.empleado_nombre,
      "Día":          r.dia ?? "",
      "Fecha":        r.fecha ?? "",
      "Labor":        r.tipo_labor_nombre,
      "Lote":         r.lote_nombre || "",
      "Kilos":        r.kilos ?? "",
      "Jornales":     r.jornales ?? "",
      "Tipo cobro":   r.tipo_cobro_nombre,
      "Valor":        r.valor,
    }))
    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Control Semanal")
    XLSX.writeFile(wb, `control-semanal-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (loadingInit) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Control Semanal</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Sube la planilla semanal y consulta el acumulado por semana</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center self-start sm:self-auto">
          <Link href="/planilla" target="_blank"
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <Printer className="h-4 w-4" />
            Planilla semanal
          </Link>
          <button
            onClick={descargarExcel}
            disabled={registros.length === 0}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Entrada de datos: foto o manual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PanelFoto onGuardado={handleGuardado} />
        <FormManual empleados={empleados} tiposLabor={tiposLabor} lotes={lotes} onGuardado={handleGuardado} />
      </div>

      <>
        {/* Selector de semana */}
        <div className="relative inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Semana:</span>
          <select
            value={semanaActual}
            onChange={e => setSemanaActual(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold focus:outline-none appearance-none pr-5 cursor-pointer"
          >
            {semanas.length === 0
              ? <option value="">Sin semanas aún</option>
              : semanas.map(s => (
                  <option key={s.semana_ref} value={s.semana_ref}>{s.semana_ref}</option>
                ))
            }
          </select>
          <ChevronDown className="absolute right-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Total pagado" value={loadingReg ? "…" : cop(totalPagado)} sub={`${registros.length} registros`} />
          <KpiCard label="Trabajadores" value={loadingReg ? "…" : (numTrabajadores > 0 ? String(numTrabajadores) : "—")} sub="en la semana" />
          <KpiCard
            label="Kilos"
            value={loadingReg ? "…" : (totalKilos > 0 ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(totalKilos) : "—")}
            sub="recolectados"
          />
          <KpiCard
            label="Jornales"
            value={loadingReg ? "…" : (totalJornales > 0 ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(totalJornales) : "—")}
            sub="días trabajados"
          />
        </div>

        {/* Tabla semanal */}
        <div className="rounded-xl border border-border overflow-hidden">
          {loadingReg ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground uppercase tracking-wide">
                      <th className="px-4 py-2.5 text-left">Trabajador / Día</th>
                      <th className="px-3 py-2.5 text-left">Fecha</th>
                      <th className="px-3 py-2.5 text-left">Labor</th>
                      <th className="px-3 py-2.5 text-left">Lote</th>
                      <th className="px-3 py-2.5 text-right">Kilos</th>
                      <th className="px-3 py-2.5 text-right">Jornales</th>
                      <th className="px-3 py-2.5 text-left">Cobro</th>
                      <th className="px-3 py-2.5 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          Sin registros para esta semana.
                        </td>
                      </tr>
                    ) : grupos.map(g => (
                      <>
                        <tr key={`h-${g.nombre}`} className="bg-muted/25 border-y border-border/70">
                          <td colSpan={7} className="px-4 py-2 font-semibold text-sm">{g.nombre}</td>
                          <td className="px-3 py-2 text-right font-bold text-sm tabular-nums">{cop(g.total)}</td>
                        </tr>
                        {g.registros.map(r => (
                          <tr key={r.id} className="border-b border-border/40 hover:bg-muted/15 text-sm">
                            <td className="px-4 py-1.5 pl-8 text-muted-foreground text-xs">{r.dia ?? "—"}</td>
                            <td className="px-3 py-1.5 text-muted-foreground text-xs tabular-nums">{fmtFecha(r.fecha)}</td>
                            <td className="px-3 py-1.5 text-sm">{r.tipo_labor_nombre}</td>
                            <td className="px-3 py-1.5 text-muted-foreground text-sm">{r.lote_nombre || "—"}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-sm">
                              {r.kilos ? `${Number(r.kilos).toLocaleString("es-CO")} kg` : "—"}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-sm">
                              {r.jornales ? Number(r.jornales).toLocaleString("es-CO") : "—"}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${BADGE[r.tipo_cobro_nombre?.toLowerCase()] ?? "bg-muted text-muted-foreground"}`}>
                                {r.tipo_cobro_nombre}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-sm">{cop(r.valor)}</td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {registros.length} registros · {numTrabajadores} trabajadores
                </p>
                <p className="text-sm font-bold tabular-nums">{cop(totalPagado)}</p>
              </div>
            </>
          )}
        </div>
      </>
    </div>
  )
}
