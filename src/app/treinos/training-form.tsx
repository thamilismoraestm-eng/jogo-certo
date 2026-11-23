"use client";

import { useActionState } from "react";
import Link from "next/link";
import { criarTreinoAction, editarTreinoAction } from "@/lib/training-actions";
import type { EstadoTreino } from "@/lib/training-validation";

export type DadosFormularioTreino = {
  id?: string;
  titulo?: string;
  modalidade?: string;
  local?: string;
  data?: string;
  horario?: string;
  minimoParticipantes?: number;
  observacoes?: string | null;
};

export function TrainingForm({
  grupoId,
  treino: evento,
}: {
  grupoId?: string;
  treino?: DadosFormularioTreino;
}) {
  const acao = evento ? editarTreinoAction : criarTreinoAction;
  const [estado, formAction, pendente] = useActionState<EstadoTreino, FormData>(acao, {});
  return (
    <form action={formAction} className="mt-8 space-y-5">
      {grupoId && <input type="hidden" name="grupoId" value={grupoId} />}
      {evento?.id && <input type="hidden" name="treinoId" value={evento.id} />}
      <label className="block text-sm font-medium text-slate-200">
        Nome do treino ou partida
        <input className="form-input mt-2" name="titulo" required minLength={2} maxLength={120} defaultValue={evento?.titulo ?? ""} />
      </label>
      <label className="block text-sm font-medium text-slate-200">
        Modalidade esportiva
        <input className="form-input mt-2" name="modalidade" required maxLength={60} placeholder="Ex.: futebol, vôlei" defaultValue={evento?.modalidade ?? ""} />
      </label>
      <label className="block text-sm font-medium text-slate-200">
        Local
        <input className="form-input mt-2" name="local" required maxLength={200} defaultValue={evento?.local ?? ""} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-200">
          Data
          <input className="form-input mt-2" type="date" name="data" required defaultValue={evento?.data ?? ""} />
        </label>
        <label className="block text-sm font-medium text-slate-200">
          Horário <span className="text-slate-400">(Manaus)</span>
          <input className="form-input mt-2" type="time" name="horario" required defaultValue={evento?.horario?.slice(0, 5) ?? ""} />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-200">
        Mínimo de participantes
        <input className="form-input mt-2" type="number" name="minimoParticipantes" required min={1} step={1} defaultValue={evento?.minimoParticipantes ?? 1} />
      </label>
      <label className="block text-sm font-medium text-slate-200">
        Descrição <span className="text-slate-400">(opcional)</span>
        <textarea className="form-input mt-2 min-h-28 resize-y" name="observacoes" maxLength={1000} defaultValue={evento?.observacoes ?? ""} />
      </label>
      {estado.erro && <p className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200" role="alert">{estado.erro}</p>}
      <div className="flex flex-wrap gap-3">
        <button className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950 disabled:opacity-60" disabled={pendente}>
          {pendente ? "Salvando…" : evento ? "Salvar alterações" : "Criar evento"}
        </button>
        <Link className="rounded-xl border border-white/15 px-5 py-3 text-slate-200" href={evento?.id ? `/treinos/${evento.id}` : grupoId ? `/grupos/${grupoId}` : "/painel"}>
          Voltar
        </Link>
      </div>
    </form>
  );
}
