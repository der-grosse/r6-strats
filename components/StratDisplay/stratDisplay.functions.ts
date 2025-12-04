export function getStratViewModifierFromCookies(cookieStore: {
  get: (name: string) => { value: string | undefined } | undefined;
}) {
  const cookie = cookieStore.get("strat_view_modifier")?.value;
  if (cookie === "hideForeign") return "hideForeign";
  if (cookie === "grayscaleForeign") return "grayscaleForeign";
  if (cookie === "none") return "none";
  return undefined;
}

export type StratViewModifier =
  | "hideForeign"
  | "grayscaleForeign"
  | "none"
  | undefined;
