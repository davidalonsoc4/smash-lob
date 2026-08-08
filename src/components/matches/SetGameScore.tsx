type SetGameScoreProps = {
  value: number;
  won: boolean;
};

export function SetGameScore({ value, won }: SetGameScoreProps) {
  return (
    <span
      className="flex min-w-6 items-center justify-center rounded-md border border-transparent bg-neutral-100 px-1.5 py-1 text-xs text-neutral-400"
      style={{ fontWeight: won ? 700 : 400 }}
    >
      {value}
    </span>
  );
}
