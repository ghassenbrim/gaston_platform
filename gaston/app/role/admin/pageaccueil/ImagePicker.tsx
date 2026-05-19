"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";

interface ImagePickerProps {
  label: string;
  value: string;
  onChange: (path: string) => void;
}

export default function ImagePicker({ label, value, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        onChange(data.path);
      } else {
        setError(data.error ?? "Erreur upload.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </label>

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className={`relative w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer group
          ${uploading
            ? "border-[#bca086] bg-[#bca086]/5 cursor-wait"
            : "border-slate-200 dark:border-white/10 hover:border-[#bca086] hover:bg-[#bca086]/5"
          }`}
      >
        {value ? (
          /* Aperçu de l'image existante */
          <div className="relative w-full aspect-video rounded-xl overflow-hidden">
            <Image
              src={value}
              alt="aperçu"
              fill
              className="object-cover"
              unoptimized
            />
            {/* Overlay au survol */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-white text-[11px] font-bold uppercase tracking-widest">Changer l&apos;image</span>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-[#bca086]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          /* Zone vide — drag & drop */
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-slate-400">
            {uploading ? (
              <>
                <svg className="animate-spin h-8 w-8 text-[#bca086]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[11px] font-bold text-[#bca086] uppercase tracking-widest">Envoi en cours...</span>
              </>
            ) : (
              <>
                <svg className="w-10 h-10 group-hover:text-[#bca086] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <div className="text-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest group-hover:text-[#bca086] transition-colors">Cliquez ou glissez une image</p>
                  <p className="text-[10px] mt-1 opacity-60">JPG, PNG, WebP — max 5 Mo</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-500 font-bold flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
