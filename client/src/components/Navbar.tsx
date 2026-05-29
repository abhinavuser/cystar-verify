"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isLoggedIn, logout, getUser } from "@/lib/api";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [logged, setLogged] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setLogged(isLoggedIn());
    const u = getUser();
    if (u) setUserName(u.name);
  }, []);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(10, 10, 15, 0.8)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.875rem 1.5rem",
      }}>
        <Link href={logged ? "/dashboard" : "/"} style={{
          fontSize: "1.125rem", fontWeight: 700, color: "var(--color-accent)",
          textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          CyStar Verify
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {logged ? (
            <>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                {userName}
              </span>
              <button className="btn btn-outline" style={{ padding: "0.4rem 0.875rem", fontSize: "0.8rem" }}
                onClick={() => { logout(); router.push("/login"); }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline" style={{ padding: "0.4rem 0.875rem", fontSize: "0.8rem", textDecoration: "none" }}>
                Login
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: "0.4rem 0.875rem", fontSize: "0.8rem", textDecoration: "none" }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
