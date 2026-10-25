import { notFound } from "next/navigation";
import { isSectionLive } from "@/lib/sections";

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!isSectionLive("/legislation/resolutions")) notFound();
  return children;
}
