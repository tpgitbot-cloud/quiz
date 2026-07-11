import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduGuard | Secure Collegiate Quiz Platform",
  description: "Advanced highly secure automated MCQ quiz platform for colleges, faculty, and students.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-full flex flex-col selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
