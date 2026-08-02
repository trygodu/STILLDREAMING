import Link from "next/link";

const NAV = [
  { href: "/work", label: "Proof" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm font-semibold tracking-tight text-white">
          Still Dreaming
        </Link>
        <nav className="flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden text-sm text-white/70 transition hover:text-white sm:block"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/audit"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Get the free audit
          </Link>
        </nav>
      </div>
    </header>
  );
}
