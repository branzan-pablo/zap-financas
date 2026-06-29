"use client";

import { useState, useTransition } from "react";
import { excluirConta } from "@/app/(app)/configuracoes/actions";

/**
 * Ações LGPD: exportar dados (download) e excluir conta (com confirmação por
 * digitação de "EXCLUIR", para evitar exclusão acidental e irreversível).
 */
export function DangerZone() {
  const [confirmando, setConfirmando] = useState(false);
  const [texto, setTexto] = useState("");
  const [pending, startTransition] = useTransition();

  const podeExcluir = texto.trim().toUpperCase() === "EXCLUIR";

  return (
    <div className="mt-4 flex flex-wrap items-start gap-3">
      <a
        href="/api/conta/exportar"
        download
        className="rounded-[10px] border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper"
      >
        Exportar dados
      </a>

      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="rounded-[10px] border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Excluir conta
        </button>
      ) : (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Isso apaga sua conta e todos os seus dados permanentemente.
          </p>
          <p className="mt-1 text-sm text-red-600">
            Digite <strong>EXCLUIR</strong> para confirmar.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="EXCLUIR"
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400"
              autoFocus
            />
            <button
              type="button"
              disabled={!podeExcluir || pending}
              onClick={() => startTransition(() => excluirConta())}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
            >
              {pending ? "Excluindo…" : "Excluir definitivamente"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmando(false);
                setTexto("");
              }}
              disabled={pending}
              className="px-3 py-1.5 text-sm text-slate hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
