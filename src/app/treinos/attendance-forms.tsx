"use client";

import { useActionState } from "react";
import {
  adicionarEquipamentoNecessarioAction,
  responderPresencaAction,
  salvarEquipamentoLevadoAction,
} from "@/lib/attendance-actions";
import type { EstadoPresenca } from "@/lib/attendance-validation";

export function PresenceForm({
  treinoId,
  respostaAtual,
}: {
  treinoId: string;
  respostaAtual: "vou" | "nao_vou" | null;
}) {
  const [estado, action, pendente] = useActionState<EstadoPresenca, FormData>(responderPresencaAction, {});
  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="treinoId" value={treinoId} />
      <p className="text-sm text-slate-300">Sua resposta: <span className="font-semibold text-white">{respostaAtual === "vou" ? "Vou" : respostaAtual === "nao_vou" ? "Não vou" : "Ainda não respondeu"}</span></p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className={`rounded-xl px-4 py-2.5 text-sm font-bold ${respostaAtual === "vou" ? "bg-lime-300 text-emerald-950" : "border border-white/15 text-white"}`} disabled={pendente} name="resposta" value="vou">{pendente ? "Salvando…" : "Vou"}</button>
        <button className={`rounded-xl px-4 py-2.5 text-sm font-bold ${respostaAtual === "nao_vou" ? "bg-lime-300 text-emerald-950" : "border border-white/15 text-white"}`} disabled={pendente} name="resposta" value="nao_vou">{pendente ? "Salvando…" : "Não vou"}</button>
      </div>
      {estado.erro && <p className="mt-4 text-sm text-red-200" role="alert">{estado.erro}</p>}
      {estado.sucesso && <p className="mt-4 text-sm text-lime-200" role="status">{estado.sucesso}</p>}
    </form>
  );
}

export function AddEquipmentForm({ treinoId }: { treinoId: string }) {
  const [estado, action, pendente] = useActionState<EstadoPresenca, FormData>(adicionarEquipamentoNecessarioAction, {});
  return (
    <form action={action} className="mt-5 grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
      <input type="hidden" name="treinoId" value={treinoId} />
      <label className="block text-sm text-slate-200">Equipamento necessário<input className="form-input mt-2" name="nome" required minLength={2} maxLength={80} placeholder="Ex.: bolas" /></label>
      <label className="block text-sm text-slate-200">Quantidade<input className="form-input mt-2" type="number" name="quantidade" min={1} step={1} required defaultValue={1} /></label>
      <button className="rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-emerald-950 disabled:opacity-60" disabled={pendente}>{pendente ? "Adicionando…" : "Adicionar"}</button>
      {estado.erro && <p className="text-sm text-red-200 sm:col-span-3" role="alert">{estado.erro}</p>}
      {estado.sucesso && <p className="text-sm text-lime-200 sm:col-span-3" role="status">{estado.sucesso}</p>}
    </form>
  );
}

export function CarryEquipmentForm({
  treinoId,
  equipamentoId,
  quantidadeAtual,
  quantidadeNecessaria,
}: {
  treinoId: string;
  equipamentoId: string;
  quantidadeAtual: number;
  quantidadeNecessaria: number;
}) {
  const [estado, action, pendente] = useActionState<EstadoPresenca, FormData>(salvarEquipamentoLevadoAction, {});
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="treinoId" value={treinoId} />
      <input type="hidden" name="treinoEquipamentoId" value={equipamentoId} />
      <label className="text-xs text-slate-400">Unidades que você levará (0 remove)
        <input className="form-input mt-2 w-32" type="number" name="quantidade" min={0} max={quantidadeNecessaria} step={1} required defaultValue={quantidadeAtual} />
      </label>
      <button className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={pendente}>{pendente ? "Salvando…" : "Salvar"}</button>
      {estado.erro && <p className="basis-full text-sm text-red-200" role="alert">{estado.erro}</p>}
      {estado.sucesso && <p className="basis-full text-sm text-lime-200" role="status">{estado.sucesso}</p>}
    </form>
  );
}
