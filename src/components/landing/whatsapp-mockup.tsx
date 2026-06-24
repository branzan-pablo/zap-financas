// Realistic WhatsApp phone mockup. Chat is card-focused (fatura/parcelas),
// our differentiator vs a generic finance assistant.

const WA_GREEN = "#1fa855";

function Incoming({
  children,
  time,
}: {
  children: React.ReactNode;
  time: string;
}) {
  return (
    <div className="max-w-[82%] self-start rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug text-ink shadow-[0_1px_1px_rgba(11,18,32,.14)]">
      {children}
      <span className="ml-2 inline-block translate-y-0.5 font-num text-[10px] text-slate/60">
        {time}
      </span>
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
    <div className="max-w-[82%] self-end rounded-xl rounded-tr-sm bg-[#d6f5cf] px-3 py-2 text-[13px] leading-snug text-ink shadow-[0_1px_1px_rgba(11,18,32,.14)]">
      {children}
      <span className="ml-2 inline-block translate-y-0.5 whitespace-nowrap font-num text-[10px] text-slate/60">
        {time} <span className="text-[#34b7f1]">✓✓</span>
      </span>
    </div>
  );
}

export function WhatsappMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="cz-rise relative rounded-[3rem] bg-[#0d0f14] p-2.5 shadow-[0_30px_80px_-24px_rgba(11,18,32,.5)]">
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-3.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

        <div className="overflow-hidden rounded-[2.5rem] bg-[#e5ddd5]">
          {/* WhatsApp header */}
          <div
            className="flex items-center gap-2.5 px-4 pt-10 pb-3 text-white"
            style={{ backgroundColor: WA_GREEN }}
          >
            <span className="grid size-8 place-items-center rounded-full bg-white/25 font-display text-sm font-bold">
              Z
            </span>
            <div className="flex-1 leading-tight">
              <p className="flex items-center gap-1 text-sm font-semibold">
                Zap Finanças
                <span className="grid size-3.5 place-items-center rounded-full bg-[#34b7f1] text-[8px] leading-none text-white">
                  ✓
                </span>
              </p>
              <p className="text-[11px] text-white/85">online</p>
            </div>
            <span className="text-lg leading-none text-white/90">⋮</span>
          </div>

          {/* Chat */}
          <div className="flex flex-col gap-2 px-3 py-4">
            <div className="mx-auto rounded-md bg-white/70 px-2.5 py-0.5 font-num text-[10px] text-slate">
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

          {/* Input bar */}
          <div className="flex items-center gap-2 px-3 pb-5">
            <div className="flex-1 rounded-full bg-white px-4 py-2.5 text-[13px] text-slate/70">
              Mensagem
            </div>
            <span
              className="grid size-10 shrink-0 place-items-center rounded-full text-white"
              style={{ backgroundColor: WA_GREEN }}
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-white">
                <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
