import Link from "next/link";
import { buttonClasses } from "@/lib/ui";

const NAV = [
  { href: "/work", label: "Proof" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-jade transition group-hover:bg-jade-bright" />
          <span className="font-display text-base tracking-tight text-white">Still Dreaming</span>
        </Link>
        <nav className="flex items-center gap-7">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative hidden text-sm text-white/70 transition hover:text-white sm:block"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-jade transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <Link href="/audit" className={buttonClasses("primary", "sm")}>
            Get the free audit
          </Link>
        </nav>
      </div>
    </header>
  );
}
