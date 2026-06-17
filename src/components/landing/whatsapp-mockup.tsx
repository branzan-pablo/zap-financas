// WhatsApp-style phone mockup. The chat is card-focused (fatura/parcelas),
// not a generic finance assistant — that's our differentiator.

function Time({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 inline-block translate-y-0.5 font-num text-[10px] text-slate/70">
      {children}
    </span>
  );
}

function Incoming({
  children,
  time,
}: {
  children: React.ReactNode;
  time: string;
}) {
  return (
    <div className="max-w-[82%] self-start rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug text-ink shadow-[0_1px_1px_rgba(11,18,32,.12)]">
      <span>{children}</span>
      <Time>{time}</Time>
    </div>
  );
}

function Outgoing({
  children,
  time,
}: {
  children: React.ReactNode;
  time: string;
}) {
  return (
    <div className="max-w-[82%] self-end rounded-2xl rounded-tr-sm bg-[#d6f5cf] px-3 py-2 text-[13px] leading-snug text-ink shadow-[0_1px_1px_rgba(11,18,32,.12)]">
      <span>{children}</span>
      <span className="ml-2 inline-block translate-y-0.5 whitespace-nowrap font-num text-[10px] text-slate/70">
        {time} <span className="text-[#34b7f1]">✓✓</span>
      </span>
    </div>
  );
}

export function WhatsappMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* Phone frame */}
      <div className="cz-rise rounded-[2.6rem] border-[7px] border-ink bg-ink shadow-[0_24px_70px_rgba(11,18,32,.22)]">
        {/* Notch */}
        <div className="relative">
          <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-ink" />
        </div>

        <div className="overflow-hidden rounded-[2.05rem] bg-[#e5ddd5]">
          {/* Status bar */}
          <div className="flex items-center justify-between bg-emerald px-5 pt-2.5 pb-1 font-num text-[10px] text-white/90">
            <span>20:14</span>
            <span className="tracking-tight">▮▮▮ 􀙇 100%</span>
          </div>

          {/* WhatsApp header */}
          <div className="flex items-center gap-2.5 bg-emerald px-3 pb-3 text-white">
            <span className="text-lg leading-none">‹</span>
            <span className="grid size-8 place-items-center rounded-full bg-white/20 font-display text-sm font-bold">
              C
            </span>
            <div className="flex-1 leading-tight">
              <p className="text-sm font-semibold">CartãoZap</p>
              <p className="text-[11px] text-white/80">online</p>
            </div>
            <span className="text-base opacity-90">📹</span>
            <span className="text-base opacity-90">📞</span>
          </div>

          {/* Chat */}
          <div className="flex flex-col gap-2 px-3 py-4">
            <div className="mx-auto rounded-full bg-white/70 px-3 py-1 font-num text-[10px] text-slate">
              hoje
            </div>
            <Outgoing time="20:13">comprei uma TV em 10x de 300</Outgoing>
            <Incoming time="20:13">
              Registrado ✓ mais <span className="font-num">R$ 300/mês</span> até
              abr/2027.
              <br />
              Fatura projetada agora:{" "}
              <span className="font-num font-semibold">R$ 2.180</span>, fecha em
              4 dias.
            </Incoming>
            <Outgoing time="20:14">
              quanto já comprometi pros próximos meses?
            </Outgoing>
            <Incoming time="20:14">
              <span className="font-num font-semibold">R$ 1.240/mês</span> até
              setembro. No ritmo atual, novembro aperta. Quer um alerta antes do
              fechamento? 🔔
            </Incoming>
          </div>

          {/* Input bar (decorative) */}
          <div className="flex items-center gap-2 px-3 pb-4">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] text-slate">
              <span className="opacity-60">😊</span>
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
