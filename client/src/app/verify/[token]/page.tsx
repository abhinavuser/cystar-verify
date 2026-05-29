"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PresentationData {
  disclosed: Record<string, { value: string; salt: string }>;
  issuerName: string;
  issueDate: string;
  credentialType: string;
  expiresAt: string;
  totalFields: number;
  disclosedCount: number;
}

interface VerifyResult {
  valid: boolean;
  reason: string;
  disclosedFields?: string[];
  totalFields?: number;
  issuerName: string;
  issueDate: string;
  credentialType: string;
  verifiedAt: string;
}

export default function VerifyPage() {
  const params = useParams();
  const token = params.token as string;

  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [verification, setVerification] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/share/public/${token}`)
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error);
        return res.json();
      })
      .then(setPresentation)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function runVerification() {
    setVerifying(true);
    try {
      const res = await fetch(`${API}/api/share/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerification(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading credential...</p>
      </div>
    );
  }

  if (error && !presentation) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div className="card" style={{ maxWidth: "400px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Link Invalid</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!presentation) return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* minimal header for public page */}
      <nav style={{ borderBottom: "1px solid var(--color-border)", padding: "0.875rem 1.5rem" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>CyStar Verify</span>
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginLeft: "auto" }}>Public Verification</span>
        </div>
      </nav>

      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div className="animate-in">
          {/* verification status banner */}
          {verification && (
            <div style={{
              padding: "1.25rem 1.5rem", borderRadius: "0.75rem", marginBottom: "1.5rem",
              background: verification.valid ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
              border: `1px solid ${verification.valid ? "rgba(16, 185, 129, 0.25)" : "rgba(244, 63, 94, 0.25)"}`,
              display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
            }}>
              <div style={{ fontSize: "1.75rem" }}>{verification.valid ? "✅" : "❌"}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "1rem", fontWeight: 600,
                  color: verification.valid ? "var(--color-success)" : "var(--color-danger)",
                }}>
                  {verification.valid ? "Credential Verified" : "Verification Failed"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.125rem" }}>
                  {verification.reason}
                </div>
              </div>
              {verification.valid && (
                <span className="badge badge-success">
                  Ed25519 Signature Valid
                </span>
              )}
            </div>
          )}

          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: "0.5rem" }}>{presentation.credentialType}</span>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.375rem" }}>Shared Credential</h1>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Issued by</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{presentation.issuerName}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  {presentation.issueDate}
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
              Showing {presentation.disclosedCount} of {presentation.totalFields} fields
              {" "}({presentation.totalFields - presentation.disclosedCount} hidden)
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {Object.entries(presentation.disclosed).map(([name, data]) => (
                <div key={name} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.75rem 1rem", borderRadius: "0.5rem",
                  background: "var(--color-bg)", border: "1px solid var(--color-border)",
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.125rem" }}>{name}</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 500 }}>{data.value}</div>
                  </div>
                  {verification?.valid && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </div>
              ))}

              {/* show placeholders for hidden fields */}
              {Array.from({ length: presentation.totalFields - presentation.disclosedCount }).map((_, i) => (
                <div key={`hidden-${i}`} style={{
                  padding: "0.75rem 1rem", borderRadius: "0.5rem",
                  background: "var(--color-bg)", border: "1px dashed var(--color-border)",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                    Field hidden (hash-protected)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* verification details */}
          {verification?.valid && (
            <div className="card animate-in" style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text-muted)" }}>
                Verification Details
              </h2>
              <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.85rem" }}>
                {[
                  ["Algorithm", "Ed25519 + HMAC-SHA256"],
                  ["Disclosed Fields", `${verification.disclosedFields?.length} of ${verification.totalFields}`],
                  ["Issuer", verification.issuerName],
                  ["Issue Date", verification.issueDate],
                  ["Verified At", new Date(verification.verifiedAt).toLocaleString()],
                  ["Hash Integrity", "All field hashes verified ✓"],
                  ["Root Signature", "Valid ✓"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!verification && (
            <button onClick={runVerification} className="btn btn-primary" disabled={verifying} style={{ width: "100%" }}>
              {verifying ? "Verifying..." : "🔍 Verify Credential Authenticity"}
            </button>
          )}

          <div style={{
            marginTop: "1.5rem", textAlign: "center",
            fontSize: "0.75rem", color: "var(--color-text-muted)",
          }}>
            Expires {new Date(presentation.expiresAt).toLocaleString()} •
            Only selected fields are visible
          </div>
        </div>
      </main>
    </div>
  );
}
