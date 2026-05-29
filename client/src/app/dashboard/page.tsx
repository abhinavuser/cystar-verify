"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api, isLoggedIn } from "@/lib/api";

interface Credential {
  id: string;
  fields: Record<string, string>;
  issuerName: string;
  issueDate: string;
  credentialType: string;
  rootHash: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    api.getCredentials()
      .then(setCredentials)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Loading credentials...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>My Credentials</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              {credentials.length} credential{credentials.length !== 1 ? "s" : ""} issued
            </p>
          </div>
          <Link href="/dashboard/issue" className="btn btn-primary" style={{ textDecoration: "none" }}>
            + Issue New
          </Link>
        </div>

        {credentials.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📄</p>
            <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>No credentials yet</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Issue your first credential to get started
            </p>
            <Link href="/dashboard/issue" className="btn btn-primary" style={{ textDecoration: "none" }}>
              Issue Credential
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {credentials.map((cred, i) => (
              <div key={cred.id} className="card animate-in" style={{ animationDelay: `${i * 0.05}s`, cursor: "pointer" }}
                onClick={() => router.push(`/dashboard/share/${cred.id}`)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: "0.5rem" }}>{cred.credentialType}</span>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: "0.375rem" }}>
                      {cred.fields.name || cred.fields.holderName || "Credential"}
                    </h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Issued by</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{cred.issuerName}</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                  {Object.entries(cred.fields).slice(0, 5).map(([key, val]) => (
                    <div key={key} style={{
                      padding: "0.3rem 0.625rem", borderRadius: "0.375rem",
                      background: "var(--color-bg)", fontSize: "0.75rem",
                    }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{key}:</span>{" "}
                      <span style={{ fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                  {Object.keys(cred.fields).length > 5 && (
                    <div style={{ padding: "0.3rem 0.625rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      +{Object.keys(cred.fields).length - 5} more
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {new Date(cred.createdAt).toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-accent)", fontWeight: 500 }}>
                    Select fields to share →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
