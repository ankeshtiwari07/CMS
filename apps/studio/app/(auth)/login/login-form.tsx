"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  const field: React.CSSProperties = {
    width: "100%",
    height: 46,
    padding: "0 14px",
    borderRadius: "var(--r-input)",
    border: "1px solid var(--hairline)",
    fontSize: 15,
    outline: "none",
    color: "var(--ink)",
    background: "#fff",
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 16, marginTop: 28 }}>
      <label style={{ display: "grid", gap: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--label, #0e4049)" }}>Email</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@humain.sa"
          style={field}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--studio-primary)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
        />
      </label>
      <label style={{ display: "grid", gap: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--label, #0e4049)" }}>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={field}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--studio-primary)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
        />
      </label>

      {error && (
        <div
          role="alert"
          style={{
            background: "#fdecec",
            color: "#b42318",
            border: "1px solid #f5c2c0",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13.5,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        style={{
          height: 48,
          marginTop: 4,
          border: "none",
          borderRadius: "var(--r-pill)",
          background: busy ? "var(--studio-teal-dark)" : "var(--studio-primary)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15.5,
          letterSpacing: "0.01em",
          transition: "background .15s",
        }}
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
