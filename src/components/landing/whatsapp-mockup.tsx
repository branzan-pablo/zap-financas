// WhatsApp-style phone mockup. The chat is card-focused (fatura/parcelas),
// not a generic finance assistant — that's our differentiator.

function Incoming({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug text-ink shadow-sm">
      {children}
    </div>
  );
}

function Outgoing({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-emerald-soft px-3 py-2 text-[13px] leading-snug text-ink shadow-sm">
      {children}
    </div>
  );
}

export function WhatsappMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Phone frame */}
      <div className="cz-rise rounded-[2.4rem] border-[6px] border-ink bg-ink shadow-[0_20px_60px_rgba(11,18,32,.18)]">
        <div className="overflow-hidden rounded-[1.9rem] bg-[#ece5dd]">
          {/* WhatsApp header */}
          <div className="flex items-center gap-3 bg-emerald px-4 py-3 text-white">
            <span className="grid size-8 place-items-center rounded-full bg-white/20 font-display text-sm font-bold">
              C
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">CartãoZap</p>
              <p className="text-[11px] text-white/80">online</p>
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col gap-2 px-3 py-4">
            <Outgoing>comprei uma TV em 10x de 300</Outgoing>
            <Incoming>
              Registrado ✓ mais <span className="font-num">R$ 300/mês</span> até
              abr/2027.
              <br />
              Sua fatura projetada agora:{" "}
              <span className="font-num font-semibold">R$ 2.180</span>, fecha em
              4 dias.
            </Incoming>
            <Outgoing>quanto já comprometi pros próximos meses?</Outgoing>
            <Incoming>
              <span className="font-num font-semibold">R$ 1.240/mês</span> até
              setembro. No ritmo atual, novembro aperta. Quer um alerta antes do
              fechamento? 🔔
            </Incoming>
          </div>

          {/* Input bar (decorative) */}
          <div className="flex items-center gap-2 px-3 pb-4">
            <div className="flex-1 rounded-full bg-white px-4 py-2 text-[13px] text-slate">
              Mensagem
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald text-white">
              ➤
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
