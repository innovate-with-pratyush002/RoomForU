"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, Search, UserCircle, X } from "lucide-react";
import { useState } from "react";
import { backendPath } from "@/services/backend";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [["Home", "/"], ["Listings", "/listings"], ["Add New-Location", "/listings/new"], ["Logout", backendPath("/logout")]] as const;
  return <header className="sticky top-0 z-50 h-14 border-b border-zinc-300 bg-[#f8f9fa]"><nav className="relative mx-auto flex h-full max-w-none items-center gap-3 px-5"><Link href="/listings" className="flex shrink-0 items-center gap-1.5 text-xl font-bold text-black"><Image src="/images/logo.png" alt="RoomForU logo" width={34} height={34} />RoomForU</Link><form action={backendPath("/search")} className="flex h-10 min-w-0 max-w-[520px] flex-1 items-center rounded-[13px] border border-[#0695a2] bg-white md:absolute md:left-1/2 md:w-[min(520px,42vw)] md:-translate-x-1/2"><input name="search" placeholder="Search by city, area, keywords..." className="min-w-0 flex-1 border-0 bg-transparent px-4 outline-none" /><button aria-label="Search" className="px-3"><Search size={18} /></button></form><button onClick={() => setOpen(!open)} className="ml-auto md:hidden" aria-label="Toggle navigation">{open ? <X size={26} /> : <Menu size={28} />}</button><div className={`${open ? "flex" : "hidden"} absolute top-14 right-0 left-0 flex-col gap-4 border-b border-zinc-200 bg-[#f8f9fa] p-4 md:static md:ml-auto md:flex md:flex-row md:items-center md:gap-5 md:border-0 md:bg-transparent md:p-0`}>{links.map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)} className="text-sm text-black hover:text-teal-700">{label}</Link>)}<Link href="/profile" aria-label="Profile" className="hidden text-[#0695a2] md:block"><UserCircle size={34} /></Link><Link href="/profile" className="text-sm md:hidden">Profile</Link></div></nav></header>;
}
