import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jogo Certo",
  description: "Organize seus treinos e partidas esportivas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
