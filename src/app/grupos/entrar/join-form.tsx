"use client";

import { useActionState } from "react";
import { entrarGrupoAction } from "@/lib/group-actions";

export function JoinForm({ codigoInicial = "" }: { codigoInicial?: string }) {
  const [estado, action, pendente] = useActionState(entrarGrupoAction, {});
  return (
    <form action={action} className="mt-7 space-y-4">
      <label className="block text-sm font-medium text-slate-200">
        Código de convite
        <input className="form-input mt-2" name="codigo" required minLength={8} maxLength={64} defaultValue={codigoInicial} autoComplete="off" />
      </label>
      {estado.erro && <p className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200" role="alert">{estado.erro}</p>}
      <button className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950 disabled:opacity-60" disabled={pendente}>
        {pendente ? "Entrando…" : "Entrar no grupo"}
      </button>
    </form>
  );
}
