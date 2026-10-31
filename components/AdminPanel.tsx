"use client";

import { PointerEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ImageIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";
import type { PublicImage } from "@/lib/types";

type AdminPanelProps = {
  token: string;
  onExit: () => void;
};

type DragState = {
  startX: number;
  currentX: number;
  active: boolean;
};

export function AdminPanel({ token, onExit }: AdminPanelProps) {
  const [pendingImages, setPendingImages] = useState<PublicImage[]>([]);
  const [approvedImages, setApprovedImages] = useState<PublicImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovedLoading, setIsApprovedLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [approvedError, setApprovedError] = useState("");
  const [drag, setDrag] = useState<DragState>({
    startX: 0,
    currentX: 0,
    active: false
  });

  const currentImage = pendingImages[0];
  const dragX = drag.active ? drag.currentX - drag.startX : 0;
  const swipeLabel = useMemo(() => {
    if (dragX > 90) {
      return "Одобрить";
    }

    if (dragX < -90) {
      return "Удалить";
    }

    return "";
  }, [dragX]);

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/images?status=pending", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = (await response.json()) as {
        images?: PublicImage[];
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить очередь.");
        return;
      }

      setPendingImages(data.images ?? []);
    } catch {
      setError("Сервер недоступен.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadApproved = useCallback(async () => {
    setIsApprovedLoading(true);
    setApprovedError("");

    try {
      const response = await fetch("/api/images?status=approved", {
        cache: "no-store"
      });
      const data = (await response.json()) as {
        images?: PublicImage[];
        error?: string;
      };

      if (!response.ok) {
        setApprovedError(data.error ?? "Не удалось загрузить список показа.");
        return;
      }

      setApprovedImages(data.images ?? []);
    } catch {
      setApprovedError("Сервер недоступен.");
    } finally {
      setIsApprovedLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadPending(), loadApproved()]);
  }, [loadApproved, loadPending]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  async function moderate(action: "approve" | "reject") {
    if (!currentImage || isActing) {
      return;
    }

    setIsActing(true);
    setError("");

    try {
      const response = await fetch(`/api/images/${currentImage.id}/moderate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Действие не выполнено.");
        return;
      }

      setPendingImages((items) => items.slice(1));

      if (action === "approve") {
        await loadApproved();
      }
    } catch {
      setError("Сервер недоступен.");
    } finally {
      setIsActing(false);
      setDrag({ startX: 0, currentX: 0, active: false });
    }
  }

  async function deleteApprovedImage(image: PublicImage) {
    const confirmed = window.confirm("Удалить эту картинку из показа?");
    if (!confirmed) {
      return;
    }

    setDeletingId(image.id);
    setApprovedError("");

    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setApprovedError(data.error ?? "Не удалось удалить изображение.");
        return;
      }

      setApprovedImages((items) => items.filter((item) => item.id !== image.id));
    } catch {
      setApprovedError("Сервер недоступен.");
    } finally {
      setDeletingId("");
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!currentImage || isActing) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      startX: event.clientX,
      currentX: event.clientX,
      active: true
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.active) {
      return;
    }

    setDrag((state) => ({
      ...state,
      currentX: event.clientX
    }));
  }

  function handlePointerUp() {
    if (!drag.active) {
      return;
    }

    if (dragX > 110) {
      void moderate("approve");
      return;
    }

    if (dragX < -110) {
      void moderate("reject");
      return;
    }

    setDrag({ startX: 0, currentX: 0, active: false });
  }

  return (
    <main className="min-h-dvh px-4 py-5 text-stone-50 sm:px-6">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-teal-300/12 text-teal-100">
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-stone-400">Админ-режим</p>
            <h1 className="text-xl font-semibold">Модерация и список показа</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-stone-100 transition hover:bg-white/[0.1]"
            aria-label="Обновить"
            title="Обновить"
          >
            <RefreshCw size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-stone-100 transition hover:bg-white/[0.1]"
            aria-label="Выйти"
            title="Выйти"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-h-[620px] flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex items-center gap-3 text-stone-300">
              <Loader2 className="animate-spin" size={22} aria-hidden="true" />
              Загрузка очереди
            </div>
          ) : error ? (
            <div className="rounded-lg bg-rose-400/12 px-4 py-3 text-rose-100">
              {error}
            </div>
          ) : currentImage ? (
            <div className="w-full max-w-[560px]">
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative touch-none select-none rounded-lg border border-white/10 bg-neutral-950/72 p-3 shadow-soft"
                style={{
                  transform: `translateX(${dragX}px) rotate(${dragX / 24}deg)`,
                  transition: drag.active ? "none" : "transform 220ms ease"
                }}
              >
                {swipeLabel ? (
                  <div
                    className={`absolute left-5 top-5 z-10 rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] ${
                      swipeLabel === "Одобрить"
                        ? "bg-teal-300 text-neutral-950"
                        : "bg-rose-400 text-white"
                    }`}
                  >
                    {swipeLabel}
                  </div>
                ) : null}

                <img
                  src={currentImage.url}
                  alt={currentImage.originalName}
                  className="h-[58dvh] max-h-[650px] min-h-[320px] w-full rounded-lg object-contain"
                  draggable={false}
                />
                <div className="flex flex-col gap-1 px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="truncate text-sm font-medium text-stone-100">
                    {currentImage.userName}
                  </p>
                  <p className="text-xs text-stone-400">
                    {new Date(currentImage.uploadedAt).toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => void moderate("reject")}
                  disabled={isActing}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-rose-400 px-4 font-semibold text-white transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={20} aria-hidden="true" />
                  Удалить
                </button>
                <button
                  type="button"
                  onClick={() => void moderate("approve")}
                  disabled={isActing}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-teal-300 px-4 font-semibold text-neutral-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={21} aria-hidden="true" />
                  Одобрить
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-neutral-950/65 px-5 py-4 text-center text-stone-200 shadow-soft">
              Нет изображений на модерации
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-white/10 bg-neutral-950/72 p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-stone-400">Слайд-шоу</p>
              <h2 className="text-lg font-semibold">Все картинки в показе</h2>
            </div>
            <span className="rounded-lg bg-white/[0.06] px-3 py-1 text-sm text-stone-300">
              {approvedImages.length}
            </span>
          </div>

          {approvedError ? (
            <div className="mb-4 rounded-lg bg-rose-400/12 px-4 py-3 text-sm text-rose-100">
              {approvedError}
            </div>
          ) : null}

          {isApprovedLoading ? (
            <div className="flex items-center gap-3 py-6 text-stone-300">
              <Loader2 className="animate-spin" size={20} aria-hidden="true" />
              Загрузка списка
            </div>
          ) : approvedImages.length ? (
            <div className="grid max-h-[70dvh] gap-3 overflow-y-auto pr-1">
              {approvedImages.map((image) => (
                <article
                  key={image.id}
                  className="grid grid-cols-[88px_minmax(0,1fr)_44px] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-2"
                >
                  <img
                    src={image.url}
                    alt={image.originalName}
                    className="h-16 w-[88px] rounded-lg object-cover"
                    draggable={false}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-100">
                      {image.userName}
                    </p>
                    <p className="truncate text-xs text-stone-400">
                      {image.originalName}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date(image.uploadedAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteApprovedImage(image)}
                    disabled={deletingId === image.id}
                    className="inline-flex size-10 items-center justify-center rounded-lg bg-rose-400/12 text-rose-100 transition hover:bg-rose-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Удалить из показа"
                    title="Удалить из показа"
                  >
                    {deletingId === image.id ? (
                      <Loader2 className="animate-spin" size={17} aria-hidden="true" />
                    ) : (
                      <Trash2 size={17} aria-hidden="true" />
                    )}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/12 px-4 py-10 text-center text-stone-400">
              <ImageIcon className="mb-3" size={28} aria-hidden="true" />
              Пока нет одобренных изображений
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
