import { redirect } from "next/navigation";

export default async function BillsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  redirect(`/legislation?${new URLSearchParams(await searchParams)}#bills`);
}
