"use client"

import { useEffect, useState } from "react"
import { api, OrdoUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  UserPlus, Trash2, Pencil, Check, X, ShieldCheck, User, RefreshCw,
} from "lucide-react"

const ROLES = ["administrador", "devops", "desarrollador", "ba"] as const
type Role = (typeof ROLES)[number]

const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  devops: "DevOps",
  desarrollador: "Desarrollador",
  ba: "BA",
}

const ROLE_COLORS: Record<Role, string> = {
  administrador: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  devops:        "bg-blue-500/20   text-blue-300   border-blue-500/40",
  desarrollador: "bg-green-500/20  text-green-300  border-green-500/40",
  ba:            "bg-orange-500/20 text-orange-300 border-orange-500/40",
}

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role as Role] ?? "bg-zinc-500/20 text-zinc-300 border-zinc-500/40"
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {ROLE_LABELS[role as Role] ?? role}
    </span>
  )
}

function RoleChips({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            value === r
              ? ROLE_COLORS[r] + " ring-2 ring-offset-1 ring-offset-card ring-current"
              : "border-border text-muted-foreground hover:border-muted-foreground/50"
          }`}
        >
          {ROLE_LABELS[r]}
        </button>
      ))}
    </div>
  )
}

interface EditState {
  id: number; password: string; email: string; role: Role; is_active: boolean
}

export default function SettingsPage() {
  const [users, setUsers] = useState<OrdoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ username: "", password: "", email: "", role: "desarrollador" as Role })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    setError("")
    api.users.list()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newForm.username || !newForm.password) { setCreateError("Usuario y contraseña son requeridos"); return }
    setCreating(true); setCreateError("")
    try {
      const user = await api.users.create(newForm)
      setUsers((prev) => [...prev, user])
      setShowNew(false)
      setNewForm({ username: "", password: "", email: "", role: "desarrollador" })
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Error al crear usuario")
    } finally { setCreating(false) }
  }

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`¿Eliminar al usuario "${username}"?`)) return
    try {
      await api.users.delete(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  const handleSave = async () => {
    if (!editState) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { email: editState.email, role: editState.role, is_active: editState.is_active }
      if (editState.password) payload.password = editState.password
      const updated = await api.users.update(editState.id, payload)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setEditState(null)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al guardar")
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de usuarios y accesos a la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={() => { setShowNew(true); setCreateError("") }} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      {/* New user form */}
      {showNew && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#ccff00]" />
            Crear usuario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Usuario <span className="text-destructive">*</span></Label>
              <Input
                placeholder="nombre.apellido"
                value={newForm.username}
                onChange={(e) => setNewForm((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newForm.password}
                onChange={(e) => setNewForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="usuario@empresa.com"
                value={newForm.email}
                onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <div className="pt-1">
                <RoleChips value={newForm.role} onChange={(r) => setNewForm((p) => ({ ...p, role: r }))} />
              </div>
            </div>
          </div>
          {createError && <p className="text-destructive text-sm">{createError}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => { setShowNew(false); setCreateError("") }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creando…" : "Crear usuario"}
            </Button>
          </div>
        </div>
      )}

      {/* Users section */}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
          <h2 className="font-semibold text-sm">Usuarios</h2>
          <span className="text-xs text-muted-foreground">{users.length} usuarios</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Cargando usuarios…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>Reintentar</Button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            No hay usuarios registrados.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Usuario</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium">Rol</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Estado</th>
                <th className="text-right px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const isEditing = editState?.id === u.id
                return (
                  <tr key={u.id} className={cn("transition-colors", isEditing ? "bg-muted/10" : "hover:bg-muted/10")}>
                    {/* Username */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          u.is_superuser ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40" : "bg-muted text-muted-foreground"
                        }`}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-medium">
                            {u.username}
                            {u.is_superuser && (
                              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                            )}
                          </div>
                          {u.is_superuser && (
                            <span className="text-[10px] text-purple-400/70">superuser</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                      {isEditing ? (
                        <Input
                          className="h-7 text-xs w-52"
                          value={editState.email}
                          onChange={(e) => setEditState((p) => p && { ...p, email: e.target.value })}
                        />
                      ) : (
                        u.email || <span className="text-muted-foreground/40 italic text-xs">—</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <RoleChips value={editState.role} onChange={(r) => setEditState((p) => p && { ...p, role: r })} />
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => setEditState((p) => p && { ...p, is_active: !p.is_active })}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all cursor-pointer ${
                            editState.is_active
                              ? "bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30"
                              : "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
                          }`}
                        >
                          {editState.is_active ? "Activo" : "Inactivo"}
                        </button>
                      ) : (
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                          u.is_active
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}>
                          {u.is_active ? "Activo" : "Inactivo"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Input
                              className="h-7 text-xs w-36 mr-2"
                              type="password"
                              placeholder="Nueva contraseña"
                              value={editState.password}
                              onChange={(e) => setEditState((p) => p && { ...p, password: e.target.value })}
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={handleSave} disabled={saving}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditState(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditState({ id: u.id, password: "", email: u.email, role: u.role as Role, is_active: u.is_active })}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u.id, u.username)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
