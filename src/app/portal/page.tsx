import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { PORTAL_COOKIE, verifySessionToken } from "@/lib/auth";
import { buttonClasses } from "@/lib/ui";
import StatTile from "@/components/StatTile";
import type { SiteSignals } from "@/lib/site-audit";
import type { MapsListingData } from "@/lib/maps-audit";
import type { DeckContent } from "@/lib/pitchDeck";

export const metadata: Metadata = { title: "Your portal" };
export const dynamic = "force-dynamic";

function LoginForm({ error }: { error?: boolean }) {
  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center px-6 py-24">
      <span className="mb-4 block h-2 w-2 rounded-full bg-jade" />
      <h1 className="font-display text-2xl text-white">Your portal</h1>
      <p className="mt-2 text-sm text-white/60">Sign in to see your dashboard and proposal.</p>
      <form action="/api/portal/login" method="POST" className="mt-6 space-y-3">
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
      <p className="mt-6 text-sm text-white/40">
        Don&rsquo;t have one yet?{" "}
        <Link href="/audit" className="text-jade hover:text-jade-bright">
          Run the free audit
        </Link>{" "}
        to create your account.
      </p>
    </div>
  );
}

function CheckRow({ ok, label }: { ok: boolean | undefined; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-white/70">
      <span className={ok ? "text-jade" : "text-white/25"}>{ok ? "✓" : "✕"}</span>
      {label}
    </li>
  );
}

function ProposalCard({ proposal }: { proposal: DeckContent }) {
  return (
    <div className="mt-6 rounded-2xl border border-jade/20 bg-jade/[0.04] p-8">
      <p className="text-xs uppercase tracking-wide text-jade">Proposal</p>
      <h2 className="mt-2 font-display text-3xl tracking-tight text-white">{proposal.title}</h2>
      <p className="mt-2 text-white/60">{proposal.subtitle}</p>

      <div className="mt-8 space-y-8">
        {proposal.sections?.map((section) => (
          <div key={section.heading} className="border-t border-white/10 pt-6">
            <h3 className="font-display text-lg text-white">{section.heading}</h3>
            <ul className="mt-3 space-y-2">
              {section.bullets?.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm text-white/70">
                  <span className="mt-1 text-jade">→</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="font-display text-lg text-white">{proposal.closingHeadline}</h3>
        <ul className="mt-3 space-y-2">
          {proposal.closingBullets?.map((bullet) => (
            <li key={bullet} className="flex gap-2 text-sm text-white/70">
              <span className="mt-1 text-jade">→</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <Link href="/contact" className={`mt-6 inline-flex ${buttonClasses("primary")}`}>
          Let&rsquo;s talk
        </Link>
      </div>
    </div>
  );
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const clientId = verifySessionToken(cookieStore.get(PORTAL_COOKIE)?.value);

  if (!clientId) {
    return <LoginForm error={Boolean(error)} />;
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { report: true, mapsReport: true },
  });
  if (!client) {
    return <LoginForm />;
  }

  const report = client.report;
  const signals = report?.signals as unknown as SiteSignals | undefined;
  const proposal = report?.proposal as unknown as DeckContent | undefined;
  const hasSiteReport = Boolean(report && signals);

  const mapsReport = client.mapsReport;
  const mapsData = mapsReport?.data as unknown as MapsListingData | undefined;
  const mapsProposal = mapsReport?.proposal as unknown as DeckContent | undefined;
  const hasMapsReport = Boolean(mapsReport && mapsData);

  const socialEntries = signals?.social
    ? (Object.entries(signals.social).filter(([, url]) => url) as [string, string][])
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-jade">Your portal</p>
          <h1 className="font-display text-2xl text-white">{client.company || client.name || "Your dashboard"}</h1>
          {client.website && (
            <a href={client.website} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-white/50 hover:text-jade">
              {client.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
        <form action="/api/portal/logout" method="POST">
          <button className={buttonClasses("outline", "sm")}>Sign out</button>
        </form>
      </div>

      {!hasSiteReport && !hasMapsReport && (
        <div className="mt-10 flex flex-col items-start gap-4 rounded-xl border border-white/10 p-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/60">Nothing here yet — run an audit to build your dashboard.</p>
          <div className="flex gap-3">
            <Link href="/audit" className={buttonClasses("outline", "sm")}>
              Site audit
            </Link>
            <Link href="/maps" className={buttonClasses("outline", "sm")}>
              Maps audit
            </Link>
          </div>
        </div>
      )}

      {hasSiteReport && signals && report && (
        <section className="mt-10">
          <p className="text-xs uppercase tracking-wide text-white/40">Website</p>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Site score" value={`${report.score}/100`} />
            <StatTile label="HTTPS" value={signals.hasHttps ? "Yes" : "No"} />
            <StatTile label="Mobile-friendly" value={signals.hasViewportMeta ? "Yes" : "No"} />
            <StatTile
              label="Marketing tech"
              value={
                [signals.marketingTech?.googleAnalytics, signals.marketingTech?.googleTagManager, signals.marketingTech?.metaPixel].filter(
                  Boolean
                ).length
              }
            />
            <StatTile label="Social profiles linked" value={socialEntries.length} />
            <StatTile label="Image alt-text coverage" value={signals.seo?.imageAltCoveragePct != null ? `${signals.seo.imageAltCoveragePct}%` : "—"} />
            <StatTile label="Load time" value={signals.loadTimeMs ? `${signals.loadTimeMs}ms` : "—"} />
            <StatTile label="Local business signals" value={signals.localBusiness?.hasStructuredData || signals.localBusiness?.hasMapsEmbed ? "Found" : "None found"} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-5">
              <p className="text-xs uppercase tracking-wide text-white/40">Technical SEO</p>
              <ul className="mt-4 space-y-2">
                <CheckRow ok={signals.seo?.hasMetaDescription} label="Meta description" />
                <CheckRow ok={signals.seo?.h1Count === 1} label="Single, clear H1" />
                <CheckRow ok={signals.seo?.hasOpenGraph} label="Open Graph tags" />
                <CheckRow ok={signals.seo?.hasCanonical} label="Canonical tag" />
                <CheckRow ok={signals.seo?.hasRobotsTxt} label="robots.txt" />
                <CheckRow ok={signals.seo?.hasSitemap} label="sitemap.xml" />
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 p-5">
              <p className="text-xs uppercase tracking-wide text-white/40">Marketing & tracking</p>
              <ul className="mt-4 space-y-2">
                <CheckRow ok={signals.marketingTech?.googleAnalytics} label="Google Analytics" />
                <CheckRow ok={signals.marketingTech?.googleTagManager} label="Google Tag Manager" />
                <CheckRow ok={signals.marketingTech?.metaPixel} label="Meta Pixel" />
              </ul>
              {!signals.marketingTech?.googleAnalytics && !signals.marketingTech?.googleTagManager && !signals.marketingTech?.metaPixel && (
                <p className="mt-3 text-xs text-white/40">No tracking detected — you likely can&rsquo;t see who visits your own site.</p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 p-5">
              <p className="text-xs uppercase tracking-wide text-white/40">Social &amp; local presence</p>
              {socialEntries.length === 0 && !signals.localBusiness?.hasStructuredData && !signals.localBusiness?.hasMapsEmbed ? (
                <p className="mt-4 text-sm text-white/40">No linked social profiles or local business data found.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {socialEntries.map(([key, url]) => (
                    <li key={key}>
                      <a href={url} target="_blank" rel="noreferrer" className="text-sm capitalize text-jade hover:text-jade-bright">
                        {key}
                      </a>
                    </li>
                  ))}
                  {(signals.localBusiness?.hasStructuredData || signals.localBusiness?.hasMapsEmbed) && (
                    <li className="text-sm text-white/70">
                      {signals.localBusiness?.name || "Local business info"} found on-site
                      {signals.localBusiness?.hasMapsEmbed ? " (with a Maps embed)" : ""}.
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {proposal && <ProposalCard proposal={proposal} />}
        </section>
      )}

      {hasMapsReport && mapsData && mapsReport && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-white/40">Google Maps</p>
            {mapsData.demo && <p className="text-xs text-amber-400">Demo mode — no live API key connected</p>}
          </div>

          {!mapsData.found ? (
            <div className="mt-3 rounded-xl border border-white/10 p-8 text-white/60">
              {mapsData.error || `No Google Maps listing found for "${mapsReport.query}".`}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile label="Maps score" value={`${mapsReport.score}/100`} />
              <StatTile label="Rating" value={mapsData.rating != null ? `${mapsData.rating}/5` : "—"} />
              <StatTile label="Reviews" value={mapsData.reviewCount ?? 0} />
              <StatTile label="Status" value={mapsData.businessStatus || "—"} />
              <StatTile label="Website listed" value={mapsData.website ? "Yes" : "No"} />
              <StatTile label="Phone listed" value={mapsData.phone ? "Yes" : "No"} />
              <StatTile label="Hours listed" value={mapsData.hasHours ? "Yes" : "No"} />
              <StatTile label="Photos" value={mapsData.photoCount ?? 0} />
            </div>
          )}

          {mapsProposal && <ProposalCard proposal={mapsProposal} />}
        </section>
      )}
    </div>
  );
}
