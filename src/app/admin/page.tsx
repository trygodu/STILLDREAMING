import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { userCount } from "@/lib/users";
import { buttonClasses } from "@/lib/ui";
import { bucketByDay, countBy, daysAgo } from "@/lib/analytics";
import StatTile from "@/components/StatTile";
import BarList from "@/components/BarList";
import TrendBars from "@/components/admin/TrendBars";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;
const TREND_DAYS = 14;
const LIGHT_FETCH_CAP = 5000;

function SetupForm({ error }: { error?: boolean }) {
  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center px-6 py-24">
      <span className="mb-4 block h-2 w-2 rounded-full bg-jade" />
      <h1 className="font-display text-2xl text-white">Create your admin account</h1>
      <p className="mt-2 text-sm text-white/60">
        No account exists yet — the first one created here becomes the owner account for this
        dashboard. This form only works once.
      </p>
      <form action="/api/admin/signup" method="POST" className="mt-6 space-y-3">
        <input
          type="text"
          name="name"
          placeholder="Name (optional)"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-jade/60 focus:outline-none"
        />
        <input
          type="email"
          name="email"
          required
          autoFocus
          placeholder="Email"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-jade/60 focus:outline-none"
        />
        <input
          type="password"
          name="password"
          required
          minLength={8}
          placeholder="Password (min. 8 characters)"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-jade/60 focus:outline-none"
        />
        {error && <p className="text-sm text-red-400">Enter a valid email and an 8+ character password.</p>}
        <button type="submit" className={`w-full ${buttonClasses("primary", "sm")}`}>
          Create account
        </button>
      </form>
    </div>
  );
}

function LoginForm({ error }: { error?: boolean }) {
  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center px-6 py-24">
      <span className="mb-4 block h-2 w-2 rounded-full bg-jade" />
      <h1 className="font-display text-2xl text-white">Admin</h1>
      <p className="mt-2 text-sm text-white/60">Sign in to view the pipeline and analytics.</p>
      <form action="/api/admin/login" method="POST" className="mt-6 space-y-3">
        <input
          type="email"
          name="email"
          required
          autoFocus
          placeholder="Email"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-jade/60 focus:outline-none"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-jade/60 focus:outline-none"
        />
        {error && <p className="text-sm text-red-400">Incorrect email or password.</p>}
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
  const userId = verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value);

  if (!userId) {
    const accounts = await userCount();
    return accounts === 0 ? <SetupForm error={Boolean(error)} /> : <LoginForm error={Boolean(error)} />;
  }

  const sevenDaysAgo = daysAgo(7);
  const trendStart = daysAgo(TREND_DAYS);

  const [
    totalLeads,
    newLeadsWeek,
    leadsLight,
    leadsForTable,
    totalPageViews,
    recentPageViews,
    pageViewsLight,
    chatMessagesLight,
    recentActivity,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.findMany({
      select: { source: true, status: true, utmSource: true, score: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: LIGHT_FETCH_CAP,
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { activities: true, messages: true } } },
    }),
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.pageView.findMany({
      select: { path: true, sessionId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: LIGHT_FETCH_CAP,
    }),
    prisma.chatMessage.findMany({
      select: { sessionId: true, leadId: true },
      take: LIGHT_FETCH_CAP,
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { lead: { select: { email: true, name: true } } },
    }),
  ]);

  const avgScore = leadsLight.length
    ? Math.round(leadsLight.reduce((sum, l) => sum + l.score, 0) / leadsLight.length)
    : 0;
  const wonCount = leadsLight.filter((l) => l.status === "WON").length;
  const conversionRate = totalLeads ? Math.round((wonCount / totalLeads) * 100) : 0;

  const sourceBreakdown = countBy(leadsLight, (l) => l.source.replace("_", " "));
  const statusBreakdown = STATUSES.map((s) => ({
    label: s,
    count: leadsLight.filter((l) => l.status === s).length,
  }));
  const utmBreakdown = countBy(leadsLight, (l) => l.utmSource).slice(0, 5);
  const topPages = countBy(pageViewsLight, (p) => p.path).slice(0, 5);

  const leadsTrend = bucketByDay(leadsLight.filter((l) => l.createdAt >= trendStart), TREND_DAYS);
  const pageViewsTrend = bucketByDay(pageViewsLight.filter((p) => p.createdAt >= trendStart), TREND_DAYS);

  const uniqueVisitors7d = new Set(
    pageViewsLight.filter((p) => p.createdAt >= sevenDaysAgo).map((p) => p.sessionId)
  ).size;

  const chatSessionIds = new Set(chatMessagesLight.map((m) => m.sessionId));
  const chatSessionsWithLead = new Set(
    chatMessagesLight.filter((m) => m.leadId).map((m) => m.sessionId)
  ).size;
  const chatConversionRate = chatSessionIds.size
    ? Math.round((chatSessionsWithLead / chatSessionIds.size) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">Everything captured automatically by the site.</p>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button className={buttonClasses("outline", "sm")}>Sign out</button>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total leads" value={totalLeads} />
        <StatTile label="New leads (7d)" value={newLeadsWeek} />
        <StatTile label="Avg. lead score" value={avgScore} />
        <StatTile label="Won" value={`${wonCount} (${conversionRate}%)`} />
        <StatTile label="Page views (7d)" value={recentPageViews} />
        <StatTile label="Page views (all-time)" value={totalPageViews} />
        <StatTile label="Unique visitors (7d)" value={uniqueVisitors7d} />
        <StatTile label="Chat → lead rate" value={`${chatConversionRate}%`} />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <TrendBars title={`Leads / day (last ${TREND_DAYS}d)`} data={leadsTrend} />
        <TrendBars title={`Page views / day (last ${TREND_DAYS}d)`} data={pageViewsTrend} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BarList title="Leads by source" items={sourceBreakdown} />
        <BarList title="Pipeline by status" items={statusBreakdown} />
        <BarList title="Top pages" items={topPages} emptyLabel="No page views yet." />
        <BarList title="Top campaigns (UTM)" items={utmBreakdown} emptyLabel="No campaign traffic yet." />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Attribution</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Pitch deck</th>
              </tr>
            </thead>
            <tbody>
              {leadsForTable.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{lead.name || "—"}</p>
                    <p className="text-white/50">{lead.email}</p>
                    {lead.company && <p className="text-white/40">{lead.company}</p>}
                    {lead.website && (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-jade hover:text-jade-bright"
                      >
                        {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
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
                    {lead.createdAt.toLocaleDateString()}{" "}
                    {lead.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/admin/leads/${lead.id}/pitch-deck`}
                      className="rounded-lg border border-jade/30 px-2 py-1 text-xs text-jade transition hover:border-jade hover:bg-jade/10"
                    >
                      Generate
                    </a>
                  </td>
                </tr>
              ))}
              {leadsForTable.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-white/40">
                    No leads yet — go fill out the audit form or talk to the chatbot.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-white/10 p-5">
          <p className="text-xs uppercase tracking-wide text-white/40">Recent activity</p>
          {recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">Nothing logged yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="text-sm">
                  <p className="text-white/80">
                    <span className="text-jade">{activity.type.replace(/_/g, " ").toLowerCase()}</span>{" "}
                    — {activity.lead?.name || activity.lead?.email || "unknown lead"}
                  </p>
                  {activity.detail && <p className="mt-0.5 text-xs text-white/40">{activity.detail}</p>}
                  <p className="mt-0.5 text-xs text-white/30">
                    {activity.createdAt.toLocaleDateString()}{" "}
                    {activity.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
