"use client";

import { excluirGrupoAction } from "@/lib/group-actions";

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  return (
    <form action={excluirGrupoAction}>
      <input type="hidden" name="grupoId" value={groupId} />
      <button
        className="rounded-xl border border-red-300/30 px-4 py-3 text-sm font-semibold text-red-100 hover:bg-red-300/10"
        onClick={(event) => {
          const confirmou = window.confirm(
            "Excluir este grupo? Todos os eventos do grupo, presenças e equipamentos também serão apagados. Eventos independentes serão preservados. Esta operação é irreversível.",
          );
          if (!confirmou) event.preventDefault();
        }}
      >
        Excluir grupo
      </button>
    </form>
  );
}
