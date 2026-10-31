"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublicImage } from "@/lib/types";

export function Slideshow() {
  const [images, setImages] = useState<PublicImage[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");

  const currentImage = useMemo(() => {
    if (!images.length) {
      return null;
    }

    return images[index % images.length];
  }, [images, index]);

  const loadApproved = useCallback(async () => {
    try {
      const response = await fetch("/api/images?status=approved", {
        cache: "no-store"
      });
      const data = (await response.json()) as {
        images?: PublicImage[];
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить изображения.");
        return;
      }

      setError("");
      setImages(data.images ?? []);
      setIndex((value) => {
        const total = data.images?.length ?? 0;
        return total ? value % total : 0;
      });
    } catch {
      setError("Сервер недоступен.");
    }
  }, []);

  useEffect(() => {
    void loadApproved();
    const refresh = window.setInterval(() => void loadApproved(), 8000);
    return () => window.clearInterval(refresh);
  }, [loadApproved]);

  useEffect(() => {
    if (images.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((value) => value + 1);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <main className="fixed inset-0 min-h-dvh overflow-hidden bg-black text-stone-50">
      {error ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 px-5">
          <p className="max-w-md rounded-lg bg-rose-500/15 px-5 py-4 text-center text-lg text-rose-100">
            {error}
          </p>
        </div>
      ) : null}

      {currentImage ? (
        <figure key={currentImage.id} className="fade-slide h-dvh w-screen">
          <img
            src={currentImage.url}
            alt={currentImage.originalName}
            className="h-full w-full object-contain"
            draggable={false}
          />
        </figure>
      ) : (
        <div className="flex h-dvh w-screen items-center justify-center px-5">
          <p className="text-center text-xl text-stone-300">
            Пока нет одобренных изображений
          </p>
        </div>
      )}
    </main>
  );
}
