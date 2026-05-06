import { unstable_noStore as noStore } from "next/cache";
import { SITE_NAME } from "@/lib/constants";
import { SiteHeaderClient } from "@/components/site-header-client";

export async function SiteHeader() {
  noStore();
  return <SiteHeaderClient siteName={SITE_NAME} />;
}
