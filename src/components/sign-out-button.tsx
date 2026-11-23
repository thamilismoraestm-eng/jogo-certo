"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setIsLoading(true);
    setError("");

    try {
      const { error: signOutError } = await authClient.signOut();

      if (signOutError) {
        setError("Não foi possível sair da conta. Tente novamente.");
        setIsLoading(false);
        return;
      }

      router.replace("/login?logout=sucesso");
      router.refresh();
    } catch {
      setError("Não foi possível sair da conta. Tente novamente.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-lime-300/60 hover:text-lime-200 disabled:cursor-wait disabled:opacity-60"
        disabled={isLoading}
        onClick={handleSignOut}
        type="button"
      >
        {isLoading ? "Saindo…" : "Sair"}
      </button>
      {error && (
        <p className="text-right text-sm text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
