import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const tools = [
    {
      name: "Magazine Mockup",
      href: "/magazine-mockup",
      description:
        "Preview images on realistic magazine pages and generate private share links.",
      featured: true,
    },
    {
      name: "HEIC to JPG",
      href: "/heic-to-jpg",
      description: "Convert iPhone HEIC and HEIF images into JPG files.",
    },
    {
      name: "Banner Calculator",
      href: "/banner-calculator",
      description: "Quote banners with live material, add-on, and margin pricing.",
    },
    {
      name: "Image Resize",
      href: "#",
      description: "Coming soon.",
      disabled: true,
    },
    {
      name: "PDF Tools",
      href: "#",
      description: "Coming soon.",
      disabled: true,
    },
    {
      name: "Background Remove",
      href: "#",
      description: "Coming soon.",
      disabled: true,
    },
  ];

  return (
    <div style={styles.page}>
      {/* 🔥 BRANDED NAV */}
      <nav style={styles.nav}>
        <div style={styles.navBrandWrap}>
          <img
            src="https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/blacklabellogoog.png"
            alt="Black Label"
            style={styles.navLogo}
          />
          <div style={styles.navBrand}>Black Label Tools</div>
        </div>
      </nav>

      <div style={styles.container}>
        {/* 🔥 HERO LOGO */}
        <img
          src="https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/blacklabellogoog.png"
          alt="Black Label Branding"
          style={styles.logo}
        />

        <h1 style={styles.title}>Black Label Tools</h1>
        <p style={styles.subtitle}>
          Internal tools, calculators, and utilities for Black Label Branding.
        </p>

        <div style={styles.grid}>
          {tools.map((tool) =>
            tool.disabled ? (
              <div key={tool.name} style={styles.cardDisabled}>
                <div style={styles.cardTitleDisabled}>{tool.name}</div>
                <div style={styles.cardText}>{tool.description}</div>
              </div>
            ) : (
              <Link
                key={tool.name}
                to={tool.href}
                style={{
                  ...styles.card,
                  ...(tool.featured ? styles.featuredCard : {}),
                }}
              >
                {tool.featured && <div style={styles.badge}>NEW</div>}
                <div style={styles.cardTitle}>{tool.name}</div>
                <div style={styles.cardText}>{tool.description}</div>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  },

  /* 🔥 NAV */
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid #1f1f1f",
    background: "rgba(0,0,0,0.92)",
    backdropFilter: "blur(10px)",
  },
  navBrandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  navLogo: {
    width: "40px",
    height: "40px",
    objectFit: "contain",
  },
  navBrand: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#39ff14",
  },

  /* 🔥 CONTENT */
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "50px 20px 70px",
    textAlign: "center",
  },
  logo: {
    display: "block",
    margin: "0 auto 20px auto",
    maxWidth: "200px",
    width: "100%",
  },
  title: {
    fontSize: "42px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#b3b3b3",
    marginBottom: "40px",
    fontSize: "18px",
    maxWidth: "760px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  /* 🔥 GRID */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },

  /* 🔥 CARDS */
  card: {
    position: "relative",
    display: "block",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "18px",
    padding: "24px",
    textAlign: "left",
    textDecoration: "none",
    color: "#fff",
    transition: "0.2s ease",
  },
  featuredCard: {
    border: "1px solid #39ff14",
    boxShadow: "0 0 20px rgba(57,255,20,0.2)",
  },
  badge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "#39ff14",
    color: "#000",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: "6px",
  },

  /* 🔥 DISABLED */
  cardDisabled: {
    background: "#0b0b0b",
    border: "1px solid #1b1b1b",
    borderRadius: "18px",
    padding: "24px",
    textAlign: "left",
    color: "#666",
  },

  /* 🔥 TEXT */
  cardTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#39ff14",
    marginBottom: "10px",
  },
  cardTitleDisabled: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#666",
    marginBottom: "10px",
  },
  cardText: {
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#b3b3b3",
  },
};
