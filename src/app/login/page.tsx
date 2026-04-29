"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Leaf, Coffee, TreePine } from "lucide-react"
import { saveAuth } from "@/lib/auth"

const Silk = dynamic(() => import("@/components/silk"), { ssr: false })

const ROLES = [
  { id: "administrador", label: "Administrador" },
  { id: "propietario",   label: "Propietario" },
  { id: "contador",      label: "Contador" },
  { id: "operario",      label: "Operario" },
]

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000")

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState("administrador")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = e.currentTarget
    const username = (form.elements.namedItem("username") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    try {
      const res = await fetch(`${BASE}/api/v1/users/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail ?? data.non_field_errors?.[0] ?? "Credenciales inválidas."); return }
      saveAuth(data.access, {
        id: data.user_id,
        username,
        email: data.email ?? "",
        role: (data.role_name ?? role) as "administrador" | "operario" | "contador" | "propietario",
        is_superuser: data.is_admin ?? false,
        avatar_url: data.image ?? undefined,
      })
      router.push("/resumen")
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#18181b]">

      {/* ── Silk animation ocupa toda la pantalla ── */}
      <div className="absolute inset-0">
        <Silk speed={1} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* ── Layout sobre el fondo ── */}
      <div className="relative z-10 flex min-h-screen">

        {/* Panel izquierdo: branding */}
        <div className="hidden md:flex md:w-[55%] flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <Leaf className="h-5 w-5 text-white/70" />
            <span className="text-white/80 font-semibold text-sm tracking-wide">
              El Cielo
              <span className="ml-1.5 text-[10px] text-white/35 font-normal uppercase tracking-[0.15em]">
                gestión finca
              </span>
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-5">Gestión integral</p>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-6">
              La finca,<br />
              <span className="text-white/40">siempre en orden.</span>
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { icon: Coffee, text: "Control semanal de recolección y jornales" },
                { icon: TreePine, text: "Ventas de café y banano con histórico por lote" },
                { icon: Leaf, text: "Planillas leídas automáticamente con IA" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-white/50" />
                  </div>
                  <span className="text-sm text-white/45">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <p className="text-[11px] text-white/15 italic">Per codicem ad caelum</p>
        </div>

        {/* ── Panel derecho: formulario con vidrio esmerilado ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-sm backdrop-blur-2xl bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8 shadow-2xl"
            style={{ WebkitBackdropFilter: "blur(32px)" }}
          >
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 md:hidden">
              <Leaf className="h-5 w-5 text-white/60" />
              <span className="text-white/80 font-semibold text-sm">El Cielo</span>
            </div>

            <h3 className="text-2xl font-bold text-white/90 mb-1">Bienvenido</h3>
            <p className="text-sm text-white/40 mb-8">Ingresa tus credenciales para continuar.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs text-white/40 uppercase tracking-wider">Rol</Label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.10] bg-white/[0.06] backdrop-blur-sm px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-white/25 appearance-none cursor-pointer"
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id} className="bg-[#1a1a1f] text-white">{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-white/40 uppercase tracking-wider">Usuario</Label>
                <Input
                  name="username"
                  type="text"
                  placeholder="tu-usuario"
                  required
                  className="bg-white/[0.06] border-white/[0.10] text-white placeholder:text-white/20 focus-visible:ring-white/25 focus-visible:border-white/25 py-2.5 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-white/40 uppercase tracking-wider">Contraseña</Label>
                <Input
                  name="password"
                  type="password"
                  required
                  className="bg-white/[0.06] border-white/[0.10] text-white placeholder:text-white/20 focus-visible:ring-white/25 focus-visible:border-white/25 py-2.5 backdrop-blur-sm"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.08] px-3 py-2.5 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-lg bg-white/15 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/90 transition-all hover:bg-white/22 hover:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
