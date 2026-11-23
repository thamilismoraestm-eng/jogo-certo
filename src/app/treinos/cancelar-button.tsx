"use client";

import { cancelarTreinoAction } from "@/lib/event-management-actions";

export function CancelarTreinoButton({ treinoId }: { treinoId: string }) {
  return (
    <form action={cancelarTreinoAction}>
      <input type="hidden" name="treinoId" value={treinoId} />
      <button
        className="rounded-xl border border-red-300/30 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-300/10"
        onClick={(event) => {
          if (!window.confirm("Cancelar este evento? Essa ação não pode ser desfeita.")) {
            event.preventDefault();
          }
        }}
      >
        Cancelar evento
      </button>
    </form>
  );
}
