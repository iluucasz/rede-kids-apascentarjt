import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rede Kids Jardim Tropical",
  description: "Gestão de aulas, crianças, trabalhadores e escala da Rede Kids.",
  icons: {
    icon: "/logo-apascentar.png",
    shortcut: "/logo-apascentar.png",
    apple: "/logo-apascentar.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
