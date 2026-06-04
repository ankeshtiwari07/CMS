import { Suspense } from "react";
import { HumainWordmark } from "@/components/brand";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in · HUMAIN" };

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(1200px 480px at 50% -10%, var(--mint-tint) 0%, #f3fbf9 38%, #ffffff 70%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--canvas)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--r-card)",
          boxShadow: "var(--shadow-card)",
          padding: "38px 34px 34px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <HumainWordmark size={30} />
          <div
            style={{
              marginTop: 12,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "var(--studio-primary)",
              textAlign: "center",
            }}
          >
            AI-NATIVE EXPERIENCE PLATFORM
          </div>
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: 21,
            fontWeight: 700,
            color: "var(--ink)",
            margin: "26px 0 0",
          }}
        >
          Sign in to continue
        </h1>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p style={{ textAlign: "center", marginTop: 22, fontSize: 12.5, color: "var(--muted)" }}>
          Sovereign by design · Arabic-first
        </p>
      </section>
    </main>
  );
}
