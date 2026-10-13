"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, Search, UserCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { backendPath } from "@/services/backend";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  username: string;
  picture?: string | null;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(backendPath("/api/v1/auth/current-user"), {
      credentials: "include"
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Listings", href: "/listings" }
  ];

  if (user) {
    navLinks.push({ label: "Add New-Location", href: "/listings/new" });
  }

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-zinc-300 bg-[#f8f9fa]">
      <nav className="relative mx-auto flex h-full max-w-none items-center gap-3 px-5">
        <Link href="/listings" className="flex shrink-0 items-center gap-1.5 text-xl font-bold text-black">
          <Image src="/images/logo.png" alt="RoomForU logo" width={34} height={34} />
          RoomForU
        </Link>
        <form
          action={backendPath("/search")}
          className="flex h-10 min-w-0 max-w-[520px] flex-1 items-center rounded-[13px] border border-[#0695a2] bg-white md:absolute md:left-1/2 md:w-[min(520px,42vw)] md:-translate-x-1/2"
        >
          <input
            name="search"
            placeholder="Search by city, area, keywords..."
            className="min-w-0 flex-1 border-0 bg-transparent px-4 outline-none"
          />
          <button aria-label="Search" className="px-3">
            <Search size={18} />
          </button>
        </form>
        <button
          onClick={() => setOpen(!open)}
          className="ml-auto md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X size={26} /> : <Menu size={28} />}
        </button>
        <div
          className={`${
            open ? "flex" : "hidden"
          } absolute top-14 right-0 left-0 flex-col gap-4 border-b border-zinc-200 bg-[#f8f9fa] p-4 md:static md:ml-auto md:flex md:flex-row md:items-center md:gap-5 md:border-0 md:bg-transparent md:p-0`}
        >
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-black hover:text-teal-700"
            >
              {label}
            </Link>
          ))}

          {!loading && !user && (
            <Link
              href="/signin"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Sign In
            </Link>
          )}

          {user && (
            <>
              <a
                href={backendPath("/logout")}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-rose-600 hover:text-rose-700"
              >
                Logout
              </a>
              <Link
                href="/profile"
                aria-label="Profile"
                onClick={() => setOpen(false)}
                className="hidden text-[#0695a2] hover:opacity-80 md:block"
                title={user.name || "Profile"}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="size-8 rounded-full border border-teal-600 object-cover"
                  />
                ) : (
                  <UserCircle size={32} />
                )}
              </Link>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-black hover:text-teal-700 md:hidden"
              >
                Profile ({user.name})
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
