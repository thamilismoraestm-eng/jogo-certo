"use client";

import { useState } from "react";
import { caminhoConviteTreino } from "@/lib/training-invites";

export function InviteShare({ codigo }: { codigo: string }) {
  const [mensagem, setMensagem] = useState("");
  const caminho = caminhoConviteTreino(codigo);

  async function copiar(valor: string, sucesso: string) {
    try {
      await navigator.clipboard.writeText(valor);
      setMensagem(sucesso);
    } catch {
      setMensagem("Não foi possível copiar automaticamente. Selecione e copie o convite.");
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-lime-300/20 bg-lime-300/[0.06] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-white">Convide para a partida</h2>
      <p className="mt-2 text-sm text-slate-300">Compartilhe o link com outra pessoa. Ela precisa entrar na conta para abrir o evento e responder.</p>
      <label className="mt-4 block text-sm font-medium text-slate-200" htmlFor="link-convite">Link do convite</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input className="form-input min-w-0 flex-1" id="link-convite" readOnly value={caminho} />
        <button className="rounded-xl border border-lime-300/30 px-4 py-2 text-sm font-semibold text-lime-200 hover:bg-lime-300/10" onClick={() => copiar(`${window.location.origin}${caminho}`, "Link copiado.")} type="button">
          Copiar link
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="rounded-xl bg-black/20 px-4 py-3 font-mono text-lime-200">{codigo}</p>
        <button className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5" onClick={() => copiar(codigo, "Código copiado.")} type="button">
          Copiar código
        </button>
      </div>
      {mensagem && <p className="mt-3 text-sm text-lime-200" role="status">{mensagem}</p>}
    </section>
  );
}
