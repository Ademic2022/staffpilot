/**
 * Where to go after signing in: a page of this app only. "//evil.example" and "/\\evil.example"
 * (browsers read a backslash as a slash) would leave the site, so anything that does not stay
 * on this origin goes Home.
 */
export function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/home";
  try {
    const url = new URL(value, "https://staffpilot.invalid");
    return url.origin === "https://staffpilot.invalid" ? `${url.pathname}${url.search}${url.hash}` : "/home";
  } catch {
    return "/home";
  }
}
