import "server-only";
import { cookies } from "next/headers";
import { CMS_URL, TOKEN_COOKIE } from "./env";

export type CurrentUser = {
  id: string | number;
  email: string;
  name?: string;
  roles: string[];
  notificationsReadAt?: string | null;
};

export async function getToken(): Promise<string | null> {
  return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
}

/** Server-side fetch to the Payload REST API, authenticated with the session JWT. */
export async function payloadFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  return fetch(`${CMS_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await payloadFetch("/api/users/me");
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      roles: data.user.roles ?? [],
      notificationsReadAt: data.user.notificationsReadAt ?? null,
    };
  } catch {
    return null;
  }
}

export function hasRole(user: CurrentUser | null, roles: string[]): boolean {
  return Boolean(user?.roles?.some((r) => roles.includes(r)));
}
