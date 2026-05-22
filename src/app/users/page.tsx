"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getMe } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import {
  createAdmin,
  createAuditor,
  deactivateUser,
  getUsers,
  updateUser,
} from "@/lib/users";
import type { AuthUser } from "@/types/auth";
import type { AppUser, UserRole } from "@/types/user";

function getInitialRole(value: string | null): UserRole {
  return value === "ADMIN" ? "ADMIN" : "AUDITOR";
}

function UsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);

  const [fullName, setFullName] = useState(
    searchParams.get("userDraftFullName") ?? ""
  );
  const [email, setEmail] = useState(searchParams.get("userDraftEmail") ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(
    getInitialRole(searchParams.get("userDraftRole"))
  );

  const [editingUserId, setEditingUserId] = useState<number | null>(
    searchParams.get("editUserId")
      ? Number(searchParams.get("editUserId"))
      : null
  );
  const [editFullName, setEditFullName] = useState(
    searchParams.get("editUserFullName") ?? ""
  );
  const [editEnabled, setEditEnabled] = useState(
    searchParams.get("editUserEnabled") === "false" ? false : true
  );

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [deactivatingUserId, setDeactivatingUserId] = useState<number | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  function replaceUsersUrl(params: URLSearchParams) {
    const query = params.toString();

    router.replace(query ? `/users?${query}` : "/users", {
      scroll: false,
    });
  }

  function updateDraftField(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    replaceUsersUrl(params);
  }

  function clearCreateDraft() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("userDraftFullName");
    params.delete("userDraftEmail");
    params.delete("userDraftRole");

    replaceUsersUrl(params);
  }

  function clearEditDraft() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("editUserId");
    params.delete("editUserFullName");
    params.delete("editUserEnabled");

    replaceUsersUrl(params);
  }

  function handlePageError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        router.replace("/login");
        return;
      }

      if (err.status === 403) {
        setError("No tienes permiso para gestionar usuarios.");
        return;
      }

      if (err.status === 409) {
        setError(err.message || "La operación no se puede completar.");
        return;
      }

      if (err.status === 404) {
        setError("El usuario no existe o no pertenece a tu organización.");
        return;
      }

      setError(err.message);
      return;
    }

    setError("No se pudo conectar con el servidor.");
  }

  async function loadUsers() {
    setError(null);
    setIsLoading(true);

    try {
      const me = await getMe();

      if (me.role !== "ADMIN") {
        setCurrentUser(me);
        setUsers([]);
        setError("Solo usuarios ADMIN pueden gestionar usuarios.");
        return;
      }

      const usersData = await getUsers();

      setCurrentUser(me);
      setUsers(usersData);
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const confirmed = window.confirm(
      `Advertencia de seguridad:\n\nVas a crear un usuario con rol ${role} dentro de tu misma organización.\n\nEl frontend NO enviará organizationId. El backend usará tu organización actual.\n\n¿Deseas continuar?`
    );

    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);
    setIsCreating(true);

    try {
      if (role === "ADMIN") {
        await createAdmin({
          fullName,
          email,
          password,
        });
      } else {
        await createAuditor({
          fullName,
          email,
          password,
        });
      }

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("AUDITOR");

      clearCreateDraft();
      setSuccessMessage(`Usuario ${role} creado correctamente.`);
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(user: AppUser) {
    setEditingUserId(user.id);
    setEditFullName(user.fullName);
    setEditEnabled(user.enabled);
    setError(null);
    setSuccessMessage(null);

    const params = new URLSearchParams(searchParams.toString());
    params.set("editUserId", String(user.id));
    params.set("editUserFullName", user.fullName);
    params.set("editUserEnabled", String(user.enabled));

    replaceUsersUrl(params);
  }

  function cancelEditing() {
    setEditingUserId(null);
    setEditFullName("");
    setEditEnabled(true);
    clearEditDraft();
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingUserId) {
      setError("Selecciona un usuario para editar.");
      return;
    }

    const confirmed = window.confirm(
      "Advertencia de seguridad:\n\nVas a editar un usuario de tu organización.\n\nSolo se modificará el nombre y el estado activo/inactivo. No se modificará email, rol ni organización.\n\n¿Deseas continuar?"
    );

    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);
    setSavingUserId(editingUserId);

    try {
      await updateUser(editingUserId, {
        fullName: editFullName,
        enabled: editEnabled,
      });

      cancelEditing();
      setSuccessMessage("Usuario actualizado correctamente.");
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleDeactivateUser(user: AppUser) {
    const confirmed = window.confirm(
      `Advertencia de seguridad:\n\nVas a desactivar al usuario "${user.fullName}".\n\nNo se borrará físicamente, pero ya no debería poder operar si el backend valida enabled en login/autorización.\n\n¿Deseas continuar?`
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      `Confirmación final:\n\nDesactivarás a "${user.fullName}" (${user.email}).\n\n¿Confirmas esta acción?`
    );

    if (!secondConfirmation) return;

    setError(null);
    setSuccessMessage(null);
    setDeactivatingUserId(user.id);

    try {
      await deactivateUser(user.id);

      if (editingUserId === user.id) {
        cancelEditing();
      }

      setSuccessMessage("Usuario desactivado correctamente.");
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setDeactivatingUserId(null);
    }
  }

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-300">Cargando usuarios...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNav title="Usuarios" />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Crear usuario interno</h2>

            <p className="mt-2 text-sm text-slate-400">
              Solo ADMIN puede crear usuarios dentro de su misma organización.
              No se pide organización y no se manda organizationId.
            </p>

            {currentUser?.role !== "ADMIN" ? (
              <div className="mt-6 rounded-xl border border-yellow-900 bg-yellow-950/40 p-4 text-sm text-yellow-100">
                Tu rol actual es {currentUser?.role}. No puedes crear usuarios.
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Nombre completo
                  </label>

                  <input
                    id="fullName"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      updateDraftField("userDraftFullName", event.target.value);
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Correo
                  </label>

                  <input
                    id="email"
                    type="email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      updateDraftField("userDraftEmail", event.target.value);
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Contraseña temporal
                  </label>

                  <input
                    id="password"
                    type="password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Por seguridad, la contraseña no se guarda en la URL.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Rol
                  </label>

                  <select
                    id="role"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={role}
                    onChange={(event) => {
                      const nextRole = event.target.value as UserRole;
                      setRole(nextRole);
                      updateDraftField("userDraftRole", nextRole);
                    }}
                  >
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Creando..." : "Crear usuario"}
                </button>
              </form>
            )}
          </section>

          {currentUser?.role === "ADMIN" && editingUserId && (
            <section className="rounded-2xl border border-yellow-900 bg-yellow-950/20 p-6">
              <div className="rounded-xl border border-yellow-800 bg-yellow-950/50 p-4 text-sm text-yellow-100">
                Advertencia: estás editando un usuario. No se puede modificar
                email, rol ni organización desde esta pantalla.
              </div>

              <h2 className="mt-5 text-xl font-semibold">Editar usuario</h2>

              <form onSubmit={handleUpdateUser} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Nombre completo
                  </label>

                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={editFullName}
                    onChange={(event) => {
                      setEditFullName(event.target.value);
                      updateDraftField("editUserFullName", event.target.value);
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Estado
                  </label>

                  <select
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={String(editEnabled)}
                    onChange={(event) => {
                      const nextEnabled = event.target.value === "true";
                      setEditEnabled(nextEnabled);
                      updateDraftField(
                        "editUserEnabled",
                        String(nextEnabled)
                      );
                    }}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="submit"
                    disabled={savingUserId === editingUserId}
                    className="rounded-xl bg-yellow-400 px-4 py-3 font-semibold text-slate-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingUserId === editingUserId
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-200 hover:border-slate-500"
                  >
                    Cancelar edición
                  </button>
                </div>
              </form>
            </section>
          )}
        </aside>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Usuarios de la organización</h2>

            <p className="mt-1 text-sm text-slate-400">
              Solo se muestran usuarios de la organización del ADMIN
              autenticado.
            </p>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-xl border border-green-900 bg-green-950/40 p-4 text-sm text-green-200">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{user.fullName}</h3>

                    <p className="mt-2 text-sm text-slate-400">
                      {user.email}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Organización:{" "}
                      {user.organizationName ?? user.organizationId}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:items-end">
                    <span className="rounded-full border border-cyan-900 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-200">
                      {user.role}
                    </span>

                    <span
                      className={
                        user.enabled
                          ? "rounded-full border border-green-900 bg-green-950/40 px-3 py-1 text-xs text-green-200"
                          : "rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-xs text-red-200"
                      }
                    >
                      {user.enabled ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

                {currentUser?.role === "ADMIN" && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => startEditing(user)}
                      className="rounded-xl border border-yellow-700 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-950/40"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeactivateUser(user)}
                      disabled={!user.enabled || deactivatingUserId === user.id}
                      className="rounded-xl border border-red-800 px-4 py-2 text-sm text-red-200 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deactivatingUserId === user.id
                        ? "Desactivando..."
                        : user.enabled
                          ? "Desactivar"
                          : "Ya inactivo"}
                    </button>
                  </div>
                )}
              </article>
            ))}

            {users.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                No hay usuarios disponibles.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <p className="text-sm text-slate-300">Cargando usuarios...</p>
        </main>
      }
    >
      <UsersContent />
    </Suspense>
  );
}