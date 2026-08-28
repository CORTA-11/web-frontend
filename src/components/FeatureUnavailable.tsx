import Link from "next/link";

export function FeatureUnavailable({ feature }: { feature: string }) {
  return <div className="mx-auto w-full max-w-xl rounded-xl border bg-white p-8 text-center dark:bg-slate-900">
    <h1 className="text-xl font-semibold">{feature} unavailable</h1>
    <p className="mt-2 text-sm text-zinc-500">This feature is not exposed by the current backend API.</p>
    <Link href="/orgs" className="mt-5 inline-block text-sm font-medium underline">Return to organizations</Link>
  </div>;
}
