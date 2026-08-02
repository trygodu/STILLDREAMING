import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Still Dreaming. Built with Claude, end to end.</p>
        <div className="flex gap-6">
          <Link href="/work" className="hover:text-white">
            Proof
          </Link>
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
          <a href="mailto:info@trygodu.com" className="hover:text-white">
            info@trygodu.com
          </a>
        </div>
      </div>
    </footer>
  );
}
