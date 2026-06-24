export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-paper px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5 font-display text-xl font-bold text-ink">
        <span className="grid size-8 place-items-center rounded-lg bg-emerald text-white text-sm">
          Z
        </span>
        Zap Finanças
      </div>
      {children}
    </div>
  );
}
