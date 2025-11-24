import { cookies } from "next/headers";
import {
  LEADING_COOKIE_KEY,
  parseCookies,
} from "@/components/context/FilterContext.functions";
import Providers from "./Providers";
import { getAllStrats } from "@/lib/strats/strats";
import { getBannedOps } from "@/lib/bannedOps/bannedOps";

export default async function ProvidersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookiesStore = await cookies();
  const filter = parseCookies(cookiesStore);
  const jwt = cookiesStore.get("jwt")?.value;
  const leading = cookiesStore.get(LEADING_COOKIE_KEY)?.value === "true";
  const allStrats = await getAllStrats();
  const bannedOps = await getBannedOps();
  return (
    <Providers
      cookieFilter={filter}
      jwt={jwt}
      defaultLeading={leading}
      allStrats={allStrats}
      bannedOps={bannedOps}
    >
      {children}
    </Providers>
  );
}
