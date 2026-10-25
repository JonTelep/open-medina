import { notFound } from "next/navigation";
import { isSectionLive } from "@/lib/sections";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!isSectionLive("/legislation")) notFound();
  return <>{children}</>;
}
