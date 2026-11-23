import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16 sm:px-8">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20 sm:p-14">
        <p className="mb-5 text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">
          Esporte em boa companhia
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
          Jogo <span className="text-lime-300">Certo.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
          Organize seus treinos e partidas esportivas em um só lugar.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded-xl bg-lime-300 px-6 py-3 text-center font-bold text-slate-950 transition hover:bg-lime-200"
            href="/cadastro"
          >
            Criar conta
          </Link>
          <Link
            className="rounded-xl border border-white/15 px-6 py-3 text-center font-semibold text-white transition hover:border-lime-300/60 hover:text-lime-200"
            href="/login"
          >
            Entrar
          </Link>
        </div>
      </section>
    </main>
  );
}
