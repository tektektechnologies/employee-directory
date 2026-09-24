"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { quietLink } from "@/components/styles";

type NavLink = {
  href: string;
  label: string;
  activePaths: string[];
};

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return links.map((link) => {
    const active = link.activePaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={`${quietLink} aria-[current=page]:bg-stone-100 aria-[current=page]:font-medium aria-[current=page]:text-stone-900`}
      >
        {link.label}
      </Link>
    );
  });
}
