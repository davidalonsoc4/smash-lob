type SetGameScoreProps = {
  value: number;
  won: boolean;
};

export function SetGameScore({ value, won }: SetGameScoreProps) {
  return (
    <span
      className={
        won
          ? "flex min-w-6 items-center justify-center rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-sm text-neutral-950 shadow-sm"
          : "flex min-w-6 items-center justify-center rounded-md border border-transparent bg-neutral-100 px-1.5 py-1 text-xs text-neutral-400"
      }
      style={{ fontWeight: won ? 900 : 400 }}
    >
      {value}
    </span>
  );
}
