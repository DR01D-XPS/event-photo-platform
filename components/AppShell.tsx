"use client";

import { useState } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { Slideshow } from "@/components/Slideshow";
import { UploadPanel } from "@/components/UploadPanel";

type ActiveMode = "user" | "admin" | "slideshow";

export function AppShell() {
  const [mode, setMode] = useState<ActiveMode>("user");
  const [modeToken, setModeToken] = useState("");

  if (mode === "admin") {
    return <AdminPanel token={modeToken} onExit={() => setMode("user")} />;
  }

  if (mode === "slideshow") {
    return <Slideshow />;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <UploadPanel
        onModeDetected={(nextMode, token) => {
          setModeToken(token ?? "");
          setMode(nextMode);
        }}
      />
    </main>
  );
}
