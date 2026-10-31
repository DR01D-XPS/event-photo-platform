"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Send, UploadCloud, XCircle } from "lucide-react";

type UploadPanelProps = {
  onModeDetected: (mode: "admin" | "slideshow", token?: string) => void;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

export function UploadPanel({ onModeDetected }: UploadPanelProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const value = name.trim();
    if (!value) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/mode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: value }),
          signal: controller.signal
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          mode: "user" | "admin" | "slideshow";
          token?: string;
        };

        if (data.mode === "admin" || data.mode === "slideshow") {
          onModeDetected(data.mode, data.token);
        }
      } catch {
        // Mode detection is intentionally quiet for normal typing.
      }
    }, 360);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [name, onModeDetected]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function setSelectedFile(nextFile: File | null) {
    setMessage(null);
    setFile(nextFile);
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    setSelectedFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    if (file) {
      formData.set("image", file);
    }

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error ?? "Не удалось загрузить изображение."
        });
        return;
      }

      setMessage({
        type: "success",
        text: data.message ?? "Изображение отправлено на модерацию"
      });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setMessage({
        type: "error",
        text: "Сервер недоступен. Попробуйте ещё раз."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-[520px] fade-slide">
      <div className="mb-7 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.26em] text-teal-200/80">
          picflow
        </p>
        <h1 className="text-3xl font-semibold text-stone-50 sm:text-4xl">
          Загрузите изображение
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          После отправки файл попадёт на модерацию и появится в показе после
          одобрения.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-white/10 bg-neutral-950/72 p-5 shadow-soft backdrop-blur sm:p-6"
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-200">
            Имя
          </span>
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            maxLength={80}
            className="h-12 w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 text-base text-stone-50 outline-none transition focus:border-teal-300/70 focus:ring-4 focus:ring-teal-400/10"
            placeholder="Как вас подписать?"
          />
        </label>

        <label className="sr-only-field" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-5 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition ${
            isDragging
              ? "border-teal-300 bg-teal-300/10"
              : "border-white/16 bg-white/[0.04] hover:border-pink-200/60 hover:bg-white/[0.06]"
          }`}
        >
          <input
            ref={fileInputRef}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileInput}
          />

          {previewUrl ? (
            <div className="w-full">
              <img
                src={previewUrl}
                alt="Предпросмотр"
                className="mx-auto max-h-[310px] max-w-full rounded-lg object-contain"
              />
              <p className="mt-3 truncate text-sm text-stone-300">{file?.name}</p>
            </div>
          ) : (
            <>
              <span className="mb-4 flex size-14 items-center justify-center rounded-lg bg-teal-300/12 text-teal-100">
                <UploadCloud size={28} aria-hidden="true" />
              </span>
              <span className="text-base font-medium text-stone-100">
                Перетащите изображение сюда
              </span>
              <span className="mt-2 text-sm leading-6 text-stone-400">
                или нажмите, чтобы выбрать файл на телефоне или ПК
              </span>
              <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                <ImagePlus size={14} aria-hidden="true" />
                JPG PNG WEBP GIF до 10 МБ
              </span>
            </>
          )}
        </label>

        {message ? (
          <div
            className={`mt-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-teal-300/12 text-teal-100"
                : "bg-rose-400/12 text-rose-100"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            ) : (
              <XCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            )}
            <span>{message.text}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal-300 px-5 text-base font-semibold text-neutral-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={20} aria-hidden="true" />
          ) : (
            <Send size={19} aria-hidden="true" />
          )}
          Отправить
        </button>
      </form>
    </section>
  );
}
