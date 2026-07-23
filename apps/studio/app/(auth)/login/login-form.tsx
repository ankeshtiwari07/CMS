"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Field, Input } from "@humain/ui";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/studio";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setBusy(false);
        return;
      }
      router.replace(from);
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setBusy(false);
    }
  }

  // NOTE: the docs show `<Input label="Email" />`, and InputProps really does
  // extend FieldProps — but @humain/ui@2.1.58 ships that d.ts importing
  // FieldProps through its own internal `@/` path alias, which cannot resolve
  // from a consumer, so the field props vanish from the public type. We already
  // map `@/*` to our own app root, so we can't remap it. Use the documented
  // compound Field escape hatch instead; it is unaffected.
  // The system owns the focus ring, so no manual border juggling here, and
  // Button `loading` handles the busy state and disabling.
  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 16, marginTop: 28 }}>
      <Field>
        <Field.Label>Email</Field.Label>
        <Input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@humain.sa"
        />
      </Field>
      <Field>
        <Field.Label>Password</Field.Label>
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>

      {error && <Alert variant="destructive" appearance="soft" description={error} />}

      <Button type="submit" size="lg" shape="round" loading={busy} style={{ marginTop: 4 }}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
