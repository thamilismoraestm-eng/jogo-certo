"use client";

import { useActionState } from "react";
import Link from "next/link";
import { editarGrupoAction } from "@/lib/group-actions";

export function EditGroupForm({
  groupId,
  nome,
  modalidade,
  descricao,
}: {
  groupId: string;
  nome: string;
  modalidade: string;
  descricao: string;
}) {
  const [estado, action, pendente] = useActionState(editarGrupoAction, {});
  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="grupoId" value={groupId} />
      <label className="block text-sm font-medium text-slate-200">
        Nome do grupo
        <input className="form-input mt-2" name="nome" required minLength={2} maxLength={80} defaultValue={nome} />
      </label>
      <label className="block text-sm font-medium text-slate-200">
        Modalidade esportiva
        <input className="form-input mt-2" name="modalidade" required maxLength={60} defaultValue={modalidade} />
      </label>
      <label className="block text-sm font-medium text-slate-200">
        Descrição <span className="text-slate-400">(opcional)</span>
        <textarea className="form-input mt-2 min-h-28 resize-y" name="descricao" maxLength={500} defaultValue={descricao} />
      </label>
      {estado.erro && <p className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200" role="alert">{estado.erro}</p>}
      <div className="flex flex-wrap gap-3">
        <button className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950 disabled:opacity-60" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar alterações"}
        </button>
        <Link className="rounded-xl border border-white/15 px-5 py-3 text-slate-200" href={`/grupos/${groupId}`}>Voltar</Link>
      </div>
    </form>
  );
}
