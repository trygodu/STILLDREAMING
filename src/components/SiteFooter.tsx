import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="h-px w-full bg-gradient-to-r from-jade/0 via-jade/40 to-jade/0" />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Still Dreaming. Built with Claude, end to end.</p>
        <div className="flex gap-6">
          <Link href="/work" className="transition hover:text-jade">
            Proof
          </Link>
          <Link href="/contact" className="transition hover:text-jade">
            Contact
          </Link>
          <a href="mailto:info@trygodu.com" className="transition hover:text-jade">
            info@trygodu.com
          </a>
          <Link href="/maps" className="transition hover:text-jade">
            Maps audit
          </Link>
          <Link href="/portal" className="transition hover:text-jade">
            Portal
          </Link>
          <Link href="/admin" className="transition hover:text-jade">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
