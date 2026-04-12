import React from "react";

export default function Header({ title = "Black Label Tools" }) {
  return (
    <div style={styles.nav}>
      <div style={styles.left}>
        <img
          src="https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/blacklabellogoog.png"
          alt="Black Label"
          style={styles.logo}
        />
        <div style={styles.title}>{title}</div>
      </div>
    </div>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #1f1f1f",
    background: "rgba(0,0,0,0.95)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    width: "42px",
    height: "42px",
    objectFit: "contain",
  },
  title: {
    color: "#39ff14",
    fontWeight: "bold",
    fontSize: "18px",
  },
};
