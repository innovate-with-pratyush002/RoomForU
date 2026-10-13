import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = { title: "RoomForU", description: "Student housing made simple" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className="flex min-h-screen flex-col font-sans"><Navbar /><main className="flex-1 bg-[radial-gradient(circle_at_top_left,rgba(14,165,164,.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(249,115,22,.12),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#f5f7fb_100%)]">{children}</main><Footer /></body></html>; }
