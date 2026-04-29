"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getUser, saveAuth, getToken, getRoleLabel, type AuthUser } from "@/lib/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  User, Mail, Shield, Camera, Key, Calendar,
  Clock, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL ?? ""

async function compressImage(file: File, maxPx = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.src = url
  })
}

async function apiPatch(path: string, body: object, token: string) {
  const res = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.detail || "Error desconocido")
  return data
}

async function apiGet(path: string, token: string) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || "Error")
  return data
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function AvatarPreview({ src, username }: { src: string; username: string }) {
  const dicebear = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=27272a&textColor=ffffff&fontSize=38`
  const [imgSrc, setImgSrc] = useState(src || dicebear)
  useEffect(() => { setImgSrc(src || dicebear) }, [src, dicebear])
  return (
    <div className="relative group">
      <div className="h-24 w-24 rounded-full ring-2 ring-white/20 ring-offset-2 ring-offset-zinc-950 overflow-hidden bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={username} className="w-full h-full object-cover" onError={() => setImgSrc(dicebear)} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Camera className="h-5 w-5 text-white" />
      </div>
    </div>
  )
}

function StatusMsg({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${
      type === "success"
        ? "bg-white/5 border-white/15 text-white/80"
        : "bg-red-500/10 border-red-500/20 text-red-400"
    }`}>
      {type === "success"
        ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      {msg}
    </div>
  )
}

/* ─── Sección card reutilizable ─── */
function Section({ title, icon: Icon, description, children }: {
  title: string
  icon: React.ElementType
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Icon className="h-4 w-4 text-white/50" />
          {title}
        </h3>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      <Separator className="bg-white/[0.06]" />
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  )
}

const inp = "bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 text-sm focus-visible:ring-white/20"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [fullUser, setFullUser] = useState<AuthUser & { date_joined?: string; last_login?: string | null } | null>(null)

  const [avatarUrl, setAvatarUrl]   = useState("")
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarStatus, setAvatarStatus]   = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const [email, setEmail]           = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailStatus, setEmailStatus]   = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const [oldPass, setOldPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [passLoading, setPassLoading] = useState(false)
  const [passStatus, setPassStatus]   = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.replace("/login"); return }
    setUser(u)
    setEmail(u.email || "")
    setAvatarUrl(u.avatar_url || "")
    const token = getToken()
    if (token) {
      apiGet("/api/auth/me/", token)
        .then(data => { setFullUser(data); setEmail(data.email || ""); setAvatarUrl(data.avatar_url || "") })
        .catch(() => {})
    }
  }, [router])

  if (!user) return null
  const token = getToken()!

  async function saveAvatar() {
    setAvatarLoading(true); setAvatarStatus(null)
    try {
      const updated = await apiPatch("/api/auth/me/", { avatar_url: avatarUrl }, token)
      const stored = getUser()
      if (stored) saveAuth(getToken()!, { ...stored, avatar_url: updated.avatar_url })
      setAvatarStatus({ type: "success", msg: "Foto actualizada. Recarga para verla en el header." })
    } catch (e: unknown) {
      setAvatarStatus({ type: "error", msg: e instanceof Error ? e.message : "Error al guardar" })
    } finally { setAvatarLoading(false) }
  }

  async function saveEmail() {
    setEmailLoading(true); setEmailStatus(null)
    try {
      const updated = await apiPatch("/api/auth/me/", { email }, token)
      const stored = getUser()
      if (stored) saveAuth(getToken()!, { ...stored, email: updated.email })
      setEmailStatus({ type: "success", msg: "Email actualizado." })
    } catch (e: unknown) {
      setEmailStatus({ type: "error", msg: e instanceof Error ? e.message : "Error al guardar" })
    } finally { setEmailLoading(false) }
  }

  async function savePassword() {
    if (!newPass) return
    setPassLoading(true); setPassStatus(null)
    try {
      await apiPatch("/api/auth/me/", { old_password: oldPass, password: newPass }, token)
      setPassStatus({ type: "success", msg: "Contraseña cambiada." })
      setOldPass(""); setNewPass("")
    } catch (e: unknown) {
      setPassStatus({ type: "error", msg: e instanceof Error ? e.message : "Error al cambiar contraseña" })
    } finally { setPassLoading(false) }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUrl(await compressImage(file))
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-white/90 tracking-tight">Mi perfil</h1>
        <p className="text-sm text-white/40 mt-1">Gestiona tu información personal y seguridad de la cuenta.</p>
      </div>

      {/* Identidad */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <div className="flex items-center gap-5">
          <AvatarPreview src={avatarUrl || ""} username={user.username} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-white">{user.username}</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/15 bg-white/8 text-white/60 font-medium uppercase tracking-wide">
                {getRoleLabel(user.role)}
              </span>
              {user.is_superuser && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/15 bg-white/8 text-white/60 font-medium flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Super
                </span>
              )}
            </div>
            <p className="text-sm text-white/45 mt-1 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {fullUser?.email || user.email || "Sin email"}
            </p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-white/30">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Desde {fmt(fullUser?.date_joined)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Último acceso {fmt(fullUser?.last_login)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Foto de perfil */}
      <Section title="Foto de perfil" icon={Camera}
        description="Sube una foto o pega la URL de una imagen pública.">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <AvatarPreview src={avatarUrl} username={user.username} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
            >
              <Camera className="h-3 w-3" /> Subir foto
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-white/60 text-xs">URL de imagen (opcional)</Label>
            <Input
              value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://github.com/usuario.png"
              className={inp}
            />
            <p className="text-[11px] text-white/30">
              Si se deja vacío se genera un avatar con tus iniciales.
            </p>
          </div>
        </div>
        {avatarStatus && <StatusMsg {...avatarStatus} />}
        <button
          onClick={saveAvatar} disabled={avatarLoading}
          className="text-sm px-4 py-1.5 rounded-lg bg-white/90 text-zinc-900 font-semibold hover:bg-white disabled:opacity-50 flex items-center gap-2"
        >
          {avatarLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Guardar foto
        </button>
      </Section>

      {/* Info personal */}
      <Section title="Información personal" icon={User}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-white/60 text-xs">Usuario</Label>
            <Input value={user.username} disabled className={`${inp} opacity-50`} />
          </div>
          <div className="space-y-1">
            <Label className="text-white/60 text-xs">Rol</Label>
            <Input value={getRoleLabel(user.role)} disabled className={`${inp} opacity-50`} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-white/60 text-xs">Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com" className={inp} />
        </div>
        {emailStatus && <StatusMsg {...emailStatus} />}
        <button
          onClick={saveEmail} disabled={emailLoading}
          className="text-sm px-4 py-1.5 rounded-lg bg-white/90 text-zinc-900 font-semibold hover:bg-white disabled:opacity-50 flex items-center gap-2"
        >
          {emailLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Guardar email
        </button>
      </Section>

      {/* Contraseña */}
      <Section title="Cambiar contraseña" icon={Key}
        description="Requiere tu contraseña actual para confirmar el cambio.">
        <div className="space-y-1">
          <Label className="text-white/60 text-xs">Contraseña actual</Label>
          <Input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)}
            placeholder="••••••••" className={inp} />
        </div>
        <div className="space-y-1">
          <Label className="text-white/60 text-xs">Nueva contraseña</Label>
          <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
            placeholder="••••••••" className={inp} />
        </div>
        {passStatus && <StatusMsg {...passStatus} />}
        <button
          onClick={savePassword} disabled={passLoading || !oldPass || !newPass}
          className="text-sm px-4 py-1.5 rounded-lg border border-white/15 text-white/70 hover:bg-white/8 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {passLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Cambiar contraseña
        </button>
      </Section>

      {/* Sesión */}
      <Section title="Sesión activa" icon={Shield}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Usuario", value: user.username },
            { label: "Rol", value: getRoleLabel(user.role) },
            { label: "Tipo de cuenta", value: user.is_superuser ? "Superusuario" : "Estándar" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className="text-white/80 font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
        <Separator className="bg-white/[0.06]" />
        <div className="text-xs text-white/30 space-y-0.5">
          <p>Miembro desde: <span className="text-white/50">{fmt(fullUser?.date_joined)}</span></p>
          <p>Último acceso: <span className="text-white/50">{fmt(fullUser?.last_login)}</span></p>
        </div>
      </Section>
    </div>
  )
}
