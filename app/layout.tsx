import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "picflow",
  description: "picflow: загрузка изображений с модерацией и слайд-шоу"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
