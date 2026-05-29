"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api, isLoggedIn } from "@/lib/api";

interface Credential {
  id: string;
  fields: Record<string, string>;
  issuerName: string;
  issueDate: string;
  credentialType: string;
}

interface ShareResult {
  shareUrl: string;
  qrCode: string;
  expiresAt: string;
  disclosedFields: string[];
}

export default function SharePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [credential, setCredential] = useState<Credential | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expiry, setExpiry] = useState(24);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [result, setResult] = useState<ShareResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    api.getCredential(id)
      .then(setCredential)
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [id, router]);

  function toggle(field: string) {
    const next = new Set(selected);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    setSelected(next);
  }

  function selectAll() {
    if (!credential) return;
    if (selected.size === Object.keys(credential.fields).length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(Object.keys(credential.fields)));
    }
  }

  async function handleShare() {
    if (selected.size === 0) { setError("Pick at least one field"); return; }
    setError("");
    setSharing(true);
    try {
      const data = await api.shareCredential({
        credentialId: id,
        disclosedFields: Array.from(selected),
        expiresInHours: expiry,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Share failed");
    } finally {
      setSharing(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <><Navbar /><main style={{ maxWidth: "600px", margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </main></>
    );
  }

  if (!credential) return null;

  const fieldNames = Object.keys(credential.fields);

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div className="animate-in">
          <button onClick={() => router.push("/dashboard")} style={{
            background: "none", border: "none", color: "var(--color-text-muted)",
            fontSize: "0.85rem", cursor: "pointer", marginBottom: "1.5rem",
            display: "flex", alignItems: "center", gap: "0.375rem",
          }}>← Back</button>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.375rem" }}>Selective Disclosure</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
            Choose which fields to reveal. Unselected fields stay hidden but their hashes are included for verification.
          </p>

          {error && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1rem",
              background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)",
              color: "var(--color-danger)", fontSize: "0.85rem",
            }}>{error}</div>
          )}

          {!result ? (
            <>
              <div className="card" style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                    Credential Fields ({selected.size}/{fieldNames.length} selected)
                  </h2>
                  <button onClick={selectAll} style={{
                    background: "none", border: "none", color: "var(--color-accent)",
                    fontSize: "0.8rem", cursor: "pointer",
                  }}>
                    {selected.size === fieldNames.length ? "Deselect all" : "Select all"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {fieldNames.map(name => {
                    const checked = selected.has(name);
                    return (
                      <label key={name} style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.75rem", borderRadius: "0.5rem", cursor: "pointer",
                        background: checked ? "rgba(99, 102, 241, 0.08)" : "transparent",
                        border: `1px solid ${checked ? "rgba(99, 102, 241, 0.25)" : "var(--color-border)"}`,
                        transition: "all 0.15s",
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => toggle(name)} style={{
                          width: "16px", height: "16px", accentColor: "var(--color-accent)",
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.125rem" }}>{name}</div>
                          <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{credential.fields[name]}</div>
                        </div>
                        {checked ? (
                          <span className="badge badge-success">visible</span>
                        ) : (
                          <span className="badge" style={{ background: "rgba(148, 163, 184, 0.1)", color: "var(--color-text-muted)" }}>hidden</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.375rem", color: "var(--color-text-muted)" }}>
                  Link expires in
                </label>
                <select value={expiry} onChange={e => setExpiry(Number(e.target.value))} style={{
                  background: "var(--color-surface)", border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem", padding: "0.625rem 0.875rem", color: "var(--color-text)",
                  fontSize: "0.875rem", width: "100%",
                }}>
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                </select>
              </div>

              <button onClick={handleShare} className="btn btn-primary" disabled={sharing || selected.size === 0} style={{ width: "100%" }}>
                {sharing ? "Generating..." : `Share ${selected.size} field${selected.size !== 1 ? "s" : ""}`}
              </button>
            </>
          ) : (
            <div className="card animate-in" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✅</div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Share Link Generated</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                {result.disclosedFields.length} of {fieldNames.length} fields disclosed • Expires {new Date(result.expiresAt).toLocaleString()}
              </p>

              {/* QR Code */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                <img src={result.qrCode} alt="QR Code" style={{
                  width: "180px", height: "180px", borderRadius: "0.75rem",
                  border: "1px solid var(--color-border)", padding: "0.5rem",
                  background: "white",
                }} />
              </div>

              <div style={{
                display: "flex", gap: "0.5rem", alignItems: "center",
                background: "var(--color-bg)", padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem", marginBottom: "1rem",
              }}>
                <input type="text" readOnly value={result.shareUrl} style={{
                  background: "transparent", border: "none", fontSize: "0.8rem",
                  flex: 1, color: "var(--color-text-muted)",
                }} />
                <button onClick={copyLink} className="btn btn-primary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.8rem", flexShrink: 0 }}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                {result.disclosedFields.map(f => (
                  <span key={f} className="badge badge-success">{f}</span>
                ))}
              </div>

              <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button onClick={() => setResult(null)} className="btn btn-outline">Share Again</button>
                <button onClick={() => router.push("/dashboard")} className="btn btn-outline">Dashboard</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
