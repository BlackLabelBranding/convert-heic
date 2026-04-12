import React, { useState } from "react";
// FIXED PATH: added ../ to reach the lib folder from the pages folder
import { supabase } from "../lib/customSupabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Success! Redirect to the dashboard
      window.location.href = "/magazine-mockup";
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h2 style={styles.title}>Team Login</h2>
        <p style={styles.subtitle}>Black Label Internal Tools</p>
        
        {error && <div style={styles.error}>{error}</div>}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Verifying..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050505" },
  card: { background: "#111", padding: "40px", borderRadius: "20px", border: "1px solid #222", width: "100%", maxWidth: "400px", textAlign: "center" },
  title: { color: "#39ff14", fontSize: "24px", marginBottom: "8px" },
  subtitle: { color: "#666", marginBottom: "24px", fontSize: "14px" },
  input: { width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #333", background: "#000", color: "#fff", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", borderRadius: "8px", background: "#39ff14", color: "#000", fontWeight: "bold", border: "none", cursor: "pointer" },
  error: { color: "#ff4444", marginBottom: "16px", fontSize: "14px" }
};
