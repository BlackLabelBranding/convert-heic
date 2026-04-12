import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();

  const isHome = location.pathname === "/";

  return (
    <div style={styles.nav}>
      <div style={styles.left}>
        <img
          src="https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/blacklabellogoog.png"
          alt="Black Label"
          style={styles.logo}
        />

        <div style={styles.brand}>Black Label Tools</div>
      </div>

      <div style={styles.right}>
        {!isHome && (
          <Link to="/" style={styles.button}>
            ← Home
          </Link>
        )}
      </div>
    </div>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 24px",
    background: "rgba(0,0,0,0.9)",
    borderBottom: "1px solid #1f1f1f",
    backdropFilter: "blur(10px)",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logo: {
    height: "32px",
  },
  brand: {
    color: "#39ff14",
    fontWeight: "bold",
    fontSize: "16px",
  },
  right: {},
  button: {
    background: "#39ff14",
    color: "#000",
    padding: "8px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
  },
};
