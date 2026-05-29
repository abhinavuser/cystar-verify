import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
        <div className="animate-in">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.375rem 1rem", borderRadius: "9999px",
            background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)",
            fontSize: "0.8rem", color: "var(--color-accent)", marginBottom: "1.5rem",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Cryptographically Verified Credentials
          </div>

          <h1 style={{ fontSize: "2.75rem", fontWeight: 700, lineHeight: 1.15, marginBottom: "1.25rem" }}>
            Share only what matters.
            <br />
            <span style={{ color: "var(--color-accent)" }}>Prove it&apos;s real.</span>
          </h1>

          <p style={{ fontSize: "1.1rem", color: "var(--color-text-muted)", maxWidth: "560px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            Issue digital credentials, selectively disclose specific fields, and let
            anyone verify their authenticity — all backed by Ed25519 cryptographic signatures.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem", textDecoration: "none" }}>
              Get Started
            </Link>
            <Link href="/login" className="btn btn-outline" style={{ padding: "0.75rem 2rem", fontSize: "1rem", textDecoration: "none" }}>
              Sign In
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginTop: "5rem" }}>
          {[
            { icon: "📝", title: "Issue Credentials", desc: "Create signed digital credentials with multiple claims — name, degree, CGPA, and more." },
            { icon: "🔒", title: "Selective Disclosure", desc: "Choose exactly which fields to share. Hidden fields stay cryptographically sealed." },
            { icon: "✅", title: "Instant Verification", desc: "Verifiers confirm authenticity in one click. No login needed, no data leaks." },
          ].map((f, i) => (
            <div key={i} className="card animate-in" style={{ textAlign: "left", animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>{f.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{f.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: "4rem", textAlign: "left", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            {[
              { step: "1", title: "Issue", desc: "Holder creates a credential with multiple fields. Backend signs it with Ed25519." },
              { step: "2", title: "Select & Share", desc: "Pick which fields to reveal. A verifiable presentation is generated with a secure link." },
              { step: "3", title: "Verify", desc: "Anyone with the link can verify — hashes are recomputed and the signature is checked." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: "var(--color-accent)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.8rem", fontWeight: 600,
                }}>{s.step}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{s.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
