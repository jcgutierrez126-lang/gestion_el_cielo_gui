"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  DollarSign, BarChart2, Users, Camera, TrendingUp, Leaf, ArrowRight,
} from "lucide-react"
import TextType from "@/components/TextType"

const Silk = dynamic(() => import("@/components/silk"), { ssr: false })

const features = [
  {
    num: "01",
    icon: Camera,
    title: "Lectura de planilla con IA",
    desc: "Toma una foto de la planilla manuscrita del mayordomo y Claude extrae todos los datos automáticamente.",
    wide: true,
  },
  {
    num: "02",
    icon: Users,
    title: "Nómina y control semanal",
    desc: "Jornales, recolección y liquidaciones por semana.",
    wide: false,
  },
  {
    num: "03",
    icon: DollarSign,
    title: "Egresos e Ingresos",
    desc: "Gastos, pagos y ventas con categorías y estados.",
    wide: false,
  },
  {
    num: "04",
    icon: BarChart2,
    title: "Ventas de café y banano",
    desc: "Pesajes, precios por kilo e histórico por lote.",
    wide: false,
  },
  {
    num: "05",
    icon: Leaf,
    title: "Producción agrícola",
    desc: "Floraciones, mezclas de abono y cosechas trazadas.",
    wide: false,
  },
  {
    num: "06",
    icon: TrendingUp,
    title: "Finanzas consolidadas",
    desc: "Cuentas, proveedores, transacciones y observaciones.",
    wide: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full">
      {/* Silk background — fixed, debajo de todo el contenido */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, width: "100vw", height: "100vh", backgroundColor: "#120f17" }}>
        <Silk speed={0.8} scale={1} color="#7B7481" noiseIntensity={1.8} rotation={0} />
      </div>

      {/* Todo el contenido va sobre el Silk */}
      <div className="relative" style={{ zIndex: 1 }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-14">
        <div className="flex items-center gap-2.5">
          <Leaf className="h-5 w-5 text-white/75" />
          <span className="text-white/90 font-semibold tracking-wide text-sm">
            El Cielo
            <span className="ml-1.5 text-[10px] text-white/35 font-normal uppercase tracking-[0.15em]">
              gestión finca
            </span>
          </span>
        </div>
        <Link href="/login">
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white/80 bg-white/5 hover:bg-white/10 hover:text-white text-xs"
          >
            Ingresar
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-14 pt-16 md:pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-2xl"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35 mb-4">
            Finca El Cielo — Gestión integral
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05]">
            Todo lo de<br />la finca,<br />
            <span className="text-white/40">en un solo lugar.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm md:text-base leading-relaxed text-white/50">
            <TextType
              as="span"
              text={[
                "Nómina, jornales y recolección.",
                "Ventas de café y banano.",
                "Control semanal con IA.",
                "Finanzas y cuentas en orden.",
                "Todo desde el campo hasta el balance.",
              ]}
              typingSpeed={55}
              deletingSpeed={30}
              pauseDuration={1800}
              showCursor
              cursorCharacter="_"
              cursorClassName="text-white/30"
              loop
            />
          </p>
          <div className="mt-8">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white/12 hover:bg-white/20 text-white border border-white/20 font-semibold gap-2 backdrop-blur-sm"
              >
                Ingresar al panel
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Bento features */}
      <section className="px-6 md:px-14 py-12 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-3"
        >
          {/* Row 1: Wide IA card + Nómina */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Wide — IA Digitalizador */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-7 flex flex-col gap-5 group hover:border-white/20 hover:bg-white/8 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white/55" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-white/8 text-white/45 border border-white/10">
                    Claude AI
                  </span>
                </div>
                <span className="text-4xl font-black text-white/[0.05] leading-none select-none">01</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white/90 mb-2">Lectura de planilla con IA</h3>
                <p className="text-sm text-white/45 leading-relaxed mb-4">
                  Fotografía la planilla manuscrita del mayordomo y Claude Sonnet extrae automáticamente cada trabajador, lote, labor, kilos y valor — sin digitar nada.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Planilla diaria", desc: "nombre · lote · labor · kilos · jornal" },
                    { label: "Planilla semanal", desc: "verifica totales vs. sistema" },
                    { label: "Cero digitación", desc: "revisa, confirma y guarda" },
                  ].map(f => (
                    <div key={f.label} className="rounded-lg bg-white/5 border border-white/8 px-3 py-2.5">
                      <p className="text-xs font-semibold text-white/45 mb-0.5">{f.label}</p>
                      <p className="text-[10px] text-white/35 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Nómina */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.67 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col gap-4 group hover:border-white/20 hover:bg-white/8 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white/55" />
                </div>
                <span className="text-3xl font-black text-white/[0.05] leading-none select-none">02</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white/90 mb-1.5">Nómina y control semanal</h3>
                <p className="text-xs text-white/40 leading-relaxed mb-3">
                  Registra jornales, kilos de recolección y anticipos. Genera el consolidado semanal por empleado.
                </p>
                <div className="space-y-1.5">
                  {["Jornales y kilos por día", "Anticipos y préstamos", "14 lotes · 16 tipos de labor", "Liquidaciones semanales"].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-white/35 flex-shrink-0" />
                      <span className="text-[11px] text-white/35">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Row 2: 4 cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* Egresos e Ingresos */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.74 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col gap-3 group hover:border-white/20 hover:bg-white/8 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-white/55" />
                </div>
                <span className="text-2xl font-black text-white/[0.05] leading-none select-none">03</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white/85 mb-1.5">Egresos e Ingresos</h3>
                <p className="text-[11px] text-white/35 mb-2.5">Gastos y entradas con categorías, cuentas y totales en COP.</p>
                <div className="flex flex-wrap gap-1">
                  {["Nómina", "Insumos", "Servicios", "Mantenimiento"].map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/8 text-white/40 border border-white/10">{t}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Ventas café y banano */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.81 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col gap-3 group hover:border-white/20 hover:bg-white/8 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center">
                  <BarChart2 className="h-4 w-4 text-white/55" />
                </div>
                <span className="text-2xl font-black text-white/[0.05] leading-none select-none">04</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white/85 mb-1.5">Ventas café y banano</h3>
                <p className="text-[11px] text-white/35 mb-2.5">Precio/kg, kilos, valor neto. Histórico con gráficas por mes.</p>
                <div className="flex flex-wrap gap-1">
                  {["Pergamino seco", "Pasilla", "Extra", "Primera"].map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/8 text-white/40 border border-white/10">{t}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Producción agrícola */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.88 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col gap-3 group hover:border-white/20 hover:bg-white/8 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-white/55" />
                </div>
                <span className="text-2xl font-black text-white/[0.05] leading-none select-none">05</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white/85 mb-1.5">Producción agrícola</h3>
                <p className="text-[11px] text-white/35 mb-2.5">Trazabilidad del campo: fechas, lotes y resultados.</p>
                <div className="space-y-1">
                  {["Floraciones por lote", "Mezclas de abono", "Cosechas registradas"].map(f => (
                    <div key={f} className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-white/30 flex-shrink-0" />
                      <span className="text-[10px] text-white/30">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Finanzas consolidadas */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.95 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col gap-3 group hover:border-white/20 hover:bg-white/8 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white/55" />
                </div>
                <span className="text-2xl font-black text-white/[0.05] leading-none select-none">06</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white/85 mb-1.5">Finanzas consolidadas</h3>
                <p className="text-[11px] text-white/35 mb-2.5">Saldo real por cuenta, transferencias internas y proveedores.</p>
                <div className="space-y-1">
                  {["Saldo real en tiempo real", "Pago vale → Agencia", "Proveedores y créditos"].map(f => (
                    <div key={f} className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-white/30 flex-shrink-0" />
                      <span className="text-[10px] text-white/30">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 text-[11px] text-white/15">
        Per codicem ad caelum &copy; {new Date().getFullYear()}
      </footer>
      </div> {/* cierre contenido */}
    </div>
  )
}
