"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api, isLoggedIn } from "@/lib/api";

const DEFAULT_FIELDS = [
  { key: "holderName", label: "Holder Name", placeholder: "Rahul Sharma" },
  { key: "degree", label: "Degree", placeholder: "B.Tech Computer Science" },
  { key: "institution", label: "Institution", placeholder: "IIT Madras" },
  { key: "graduationYear", label: "Graduation Year", placeholder: "2025" },
  { key: "cgpa", label: "CGPA", placeholder: "8.5" },
  { key: "rollNumber", label: "Roll Number", placeholder: "CS21B042" },
];

export default function IssuePage() {
  const router = useRouter();
  const [issuerName, setIssuerName] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [credentialType, setCredentialType] = useState("academic");
  const [fields, setFields] = useState<{ key: string; value: string }[]>(
    DEFAULT_FIELDS.map(f => ({ key: f.key, value: "" }))
  );
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) router.push("/login");
  }, [router]);

  function updateField(index: number, value: string) {
    const updated = [...fields];
    updated[index].value = value;
    setFields(updated);
  }

  function addCustomField() {
    setCustomFields([...customFields, { key: "", value: "" }]);
  }

  function updateCustomField(index: number, prop: "key" | "value", val: string) {
    const updated = [...customFields];
    updated[index][prop] = val;
    setCustomFields(updated);
  }

  function removeCustomField(index: number) {
    setCustomFields(customFields.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const allFields: Record<string, string> = {};
    fields.forEach(f => { if (f.value.trim()) allFields[f.key] = f.value.trim(); });
    customFields.forEach(f => {
      if (f.key.trim() && f.value.trim()) allFields[f.key.trim()] = f.value.trim();
    });

    if (Object.keys(allFields).length < 2) {
      setError("Fill in at least 2 fields");
      return;
    }
    if (!issuerName.trim()) {
      setError("Issuer name is required");
      return;
    }

    setLoading(true);
    try {
      await api.issueCredential({
        fields: allFields,
        issuerName: issuerName.trim(),
        issueDate,
        credentialType,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to issue credential");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div className="animate-in">
          <button onClick={() => router.push("/dashboard")} style={{
            background: "none", border: "none", color: "var(--color-text-muted)",
            fontSize: "0.85rem", cursor: "pointer", marginBottom: "1.5rem",
            display: "flex", alignItems: "center", gap: "0.375rem",
          }}>
            ← Back to dashboard
          </button>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Issue New Credential</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
            Each field will be individually hashed and signed for selective disclosure
          </p>

          {error && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1rem",
              background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)",
              color: "var(--color-danger)", fontSize: "0.85rem",
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="card" style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text-muted)" }}>
                Credential Info
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.375rem", color: "var(--color-text-muted)" }}>Issuer Name *</label>
                  <input type="text" value={issuerName} onChange={e => setIssuerName(e.target.value)} placeholder="IIT Madras" required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.375rem", color: "var(--color-text-muted)" }}>Issue Date</label>
                  <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.375rem", color: "var(--color-text-muted)" }}>Type</label>
                <select value={credentialType} onChange={e => setCredentialType(e.target.value)} style={{
                  background: "var(--color-surface)", border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem", padding: "0.625rem 0.875rem", color: "var(--color-text)",
                  fontSize: "0.875rem", width: "100%",
                }}>
                  <option value="academic">Academic</option>
                  <option value="professional">Professional</option>
                  <option value="identity">Identity</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="card" style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text-muted)" }}>
                Credential Fields
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {fields.map((f, i) => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.375rem", color: "var(--color-text-muted)" }}>
                      {DEFAULT_FIELDS[i].label}
                    </label>
                    <input
                      type="text"
                      value={f.value}
                      onChange={e => updateField(i, e.target.value)}
                      placeholder={DEFAULT_FIELDS[i].placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {customFields.length > 0 && (
              <div className="card" style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text-muted)" }}>
                  Custom Fields
                </h2>
                {customFields.map((f, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem", color: "var(--color-text-muted)" }}>Field Name</label>
                      <input type="text" value={f.key} onChange={e => updateCustomField(i, "key", e.target.value)} placeholder="e.g. marks" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem", color: "var(--color-text-muted)" }}>Value</label>
                      <input type="text" value={f.value} onChange={e => updateCustomField(i, "value", e.target.value)} placeholder="e.g. 92" />
                    </div>
                    <button type="button" onClick={() => removeCustomField(i)} style={{
                      background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)",
                      color: "var(--color-danger)", borderRadius: "0.375rem", padding: "0.5rem 0.75rem",
                      cursor: "pointer", fontSize: "0.85rem",
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={addCustomField} className="btn btn-outline" style={{ width: "100%", marginBottom: "1.25rem" }}>
              + Add Custom Field
            </button>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Issuing..." : "Issue Credential"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
