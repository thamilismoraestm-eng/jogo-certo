"use client";

import { useActionState } from "react";
import { usarConviteTreinoAction, type EstadoConviteTreino } from "@/lib/training-invite-actions";

export function InviteTrainingForm() {
  const [estado, action, pendente] = useActionState<EstadoConviteTreino, FormData>(usarConviteTreinoAction, {});

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="convite">Código ou link do evento</label>
        <input className="form-input" id="convite" name="convite" autoComplete="url" maxLength={500} required placeholder="Código ou https://…/treinos/convite/…" />
      </div>
      {estado.erro && <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100" role="alert">{estado.erro}</p>}
      <button className="w-full rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950 disabled:opacity-60" disabled={pendente}>
        {pendente ? "Verificando convite…" : "Abrir evento"}
      </button>
    </form>
  );
}
