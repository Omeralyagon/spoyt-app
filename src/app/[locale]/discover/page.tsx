import { setRequestLocale } from "next-intl/server";
import { DiscoverScreen } from "@/components/discover-screen";

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DiscoverScreen />;
}
