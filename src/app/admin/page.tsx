import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/auth";
import { buttonClasses } from "@/lib/ui";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;

function sevenDaysAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 p-5">
      <span className="absolute inset-x-0 top-0 h-px bg-jade/40" />
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-2 font-display text-2xl text-white">{value}</p>
    </div>
  );
}

function LoginForm({ error }: { error?: boolean }) {
  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center px-6 py-24">
      <span className="mb-4 block h-2 w-2 rounded-full bg-jade" />
      <h1 className="font-display text-2xl text-white">Admin</h1>
      <p className="mt-2 text-sm text-white/60">Enter the admin password to view the lead pipeline.</p>
      <form action="/api/admin/login" method="POST" className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Password"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-jade/60 focus:outline-none"
        />
        {error && <p className="text-sm text-red-400">Incorrect password.</p>}
        <button type="submit" className={`w-full ${buttonClasses("primary", "sm")}`}>
          Sign in
        </button>
      </form>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const authed = isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);

  if (!authed) {
    return <LoginForm error={Boolean(error)} />;
  }

  const [leads, totalPageViews, recentPageViews] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { activities: true, messages: true } } },
    }),
    prisma.pageView.count(),
    prisma.pageView.count({
      where: { createdAt: { gte: sevenDaysAgo() } },
    }),
  ]);

  const avgScore = leads.length
    ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
    : 0;
  const wonCount = leads.filter((l) => l.status === "WON").length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Lead pipeline</h1>
          <p className="mt-1 text-sm text-white/50">Everything captured automatically by the site.</p>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button className={buttonClasses("outline", "sm")}>Sign out</button>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total leads" value={leads.length} />
        <StatCard label="Avg. score" value={avgScore} />
        <StatCard label="Won" value={wonCount} />
        <StatCard label="Page views (7d)" value={recentPageViews} />
        <StatCard label="Page views (all-time)" value={totalPageViews} />
      </div>

      <div className="mt-10 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Attribution</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-white/5 align-top last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{lead.name || "—"}</p>
                  <p className="text-white/50">{lead.email}</p>
                  {lead.company && <p className="text-white/40">{lead.company}</p>}
                  {lead.message && (
                    <p className="mt-1 max-w-xs truncate text-white/40" title={lead.message}>
                      {lead.message}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-white/70">{lead.source.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-jade/15 px-2 py-1 text-xs font-medium text-jade">
                    {lead.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/50">
                  {lead.utmSource ? (
                    <span>
                      {lead.utmSource}
                      {lead.utmMedium ? ` / ${lead.utmMedium}` : ""}
                    </span>
                  ) : (
                    lead.referrer || "direct"
                  )}
                  <p className="text-xs text-white/30">{lead.page}</p>
                </td>
                <td className="px-4 py-3">
                  <form
                    action={`/api/admin/leads/${lead.id}/status`}
                    method="POST"
                    className="flex items-center gap-2"
                  >
                    <select
                      name="status"
                      defaultValue={lead.status}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-jade/60 focus:outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-neutral-900">
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60 transition hover:border-jade/50 hover:text-jade"
                    >
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-white/50">
                  {lead.createdAt.toLocaleDateString()} {lead.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-white/40">
                  No leads yet — go fill out the audit form or talk to the chatbot.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
