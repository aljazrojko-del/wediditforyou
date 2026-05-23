export default function SampleBanner({
  business,
}: {
  business: string;
}) {
  return (
    <div className="w-full bg-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs">
        <span className="text-zinc-400">
          <span className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-orange-500 align-middle" />
          Sample build for{" "}
          <span className="font-medium text-white">{business}</span> — they
          don&apos;t know yet.
        </span>
        <a
          href="https://wediditforyou.vercel.app"
          className="font-mono uppercase tracking-wider text-orange-500 hover:text-orange-400"
        >
          Get yours →
        </a>
      </div>
    </div>
  );
}
