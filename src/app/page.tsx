export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20 sm:p-14">
        <p className="mb-5 text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">
          Esporte em boa companhia
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
          Jogo <span className="text-lime-300">Certo.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
          O lugar certo para organizar seus treinos e partidas. Em breve, todo
          mundo vai saber quando jogar e o que levar.
        </p>
        <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-lime-300/20 bg-lime-300/10 px-5 py-3 text-sm font-medium text-lime-200">
          <span className="size-2 rounded-full bg-lime-300" aria-hidden="true" />
          Estamos preparando o próximo jogo
        </div>
      </section>
    </main>
  );
}
