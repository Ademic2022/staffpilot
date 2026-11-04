import { CombinedError, Client, cacheExchange, fetchExchange } from "urql";

function cookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfPromise: Promise<void> | null = null;

/** Django wants its CSRF token back on every POST; the first request fetches the cookie. */
async function ensureCsrf() {
  if (cookie("csrftoken")) return;
  csrfPromise ??= fetch("/api/csrf/", { credentials: "include" }).then(() => undefined);
  await csrfPromise;
  csrfPromise = null;
}

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  await ensureCsrf();
  const headers = new Headers(init?.headers);
  const token = cookie("csrftoken");
  if (token) headers.set("X-CSRFToken", token);
  const response = await fetch(input, { ...init, headers, credentials: "include" });
  // The company closed its account (apps/tenants/closure.py): say so instead of failing quietly.
  if (response.status === 410 && typeof window !== "undefined" && window.location.pathname !== "/closed") {
    // A full page load on purpose: it drops every cached record of the closed company.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/closed";
  }
  return response;
}

/** A fresh client, with an empty cache. Made again on sign-in and sign-out. */
export function makeClient() {
  return new Client({
    url: "/graphql",
    exchanges: [cacheExchange, fetchExchange],
    fetch: apiFetch,
    preferGetMethod: false,
    requestPolicy: "cache-and-network",
  });
}

/** The code the API attached to its first error ("forbidden", "not_found"…), if any. */
export function errorCode(error: CombinedError | undefined): string | undefined {
  return error?.graphQLErrors[0]?.extensions?.code as string | undefined;
}

export function errorMessage(error: CombinedError | undefined): string | undefined {
  if (!error) return undefined;
  if (error.networkError) return "Could not reach the server. Check your connection and try again.";
  return error.graphQLErrors[0]?.message ?? "Something went wrong.";
}

/**
 * POST a multipart form (file uploads) to a Django endpoint. Answers the JSON body with
 * `errors` filled in for any failure, including a lost connection.
 */
export async function postForm<T>(path: string, form: FormData): Promise<T & { errors?: { field: string | null; message: string }[] }> {
  try {
    const response = await apiFetch(path, { method: "POST", body: form });
    return await response.json();
  } catch {
    return { errors: [{ field: null, message: "Could not reach the server. Check your connection and try again." }] } as T & {
      errors: { field: string | null; message: string }[];
    };
  }
}
