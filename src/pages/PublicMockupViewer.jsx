import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const STORAGE_KEY = "blb_magazine_mockup_projects";

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function PublicMockupViewer() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState("spread");

  useEffect(() => {
    const allProjects = loadProjects();
    const found = allProjects.find(
      (p) => p.share_token === token && p.is_public
    );
    setProject(found || null);
  }, [token]);

  const sortedPages = useMemo(() => {
    if (!project?.pages) return [];
    return [...project.pages].sort((a, b) => a.page_number - b.page_number);
  }, [project]);

  const spreads = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < sortedPages.length; i += 2) {
      pairs.push({
        left: sortedPages[i] || null,
        right: sortedPages[i + 1] || null,
      });
    }
    return pairs;
  }, [sortedPages]);

  const currentSpread = spreads[currentIndex] || { left: null, right: null };
  const currentSingle = sortedPages[currentIndex] || null;

  function next() {
    if (viewMode === "spread") {
      setCurrentIndex((prev) => Math.min(prev + 1, spreads.length - 1));
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, sortedPages.length - 1));
    }
  }

  function prev() {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function renderPage(page, mini = false) {
    if (!page) {
      return <div style={mini ? styles.miniPage : styles.pageCanvasEmpty}>No page</div>;
    }

    const fit = page.image_fit || "cover";
    const scale = Number(page.image_scale) || 1;
    const x = Number(page.image_x) || 0;
    const y = Number(page.image_y) || 0;

    const imageStyle = {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
      maxWidth: fit === "contain" || fit === "centered" ? "100%" : "none",
      maxHeight: fit === "contain" || fit === "centered" ? "100%" : "none",
      width: fit === "stretch" ? "100%" : fit === "cover" ? "100%" : "auto",
      height: fit === "stretch" ? "100%" : fit === "cover" ? "100%" : "auto",
      objectFit:
        fit === "cover"
          ? "cover"
          : fit === "contain"
            ? "contain"
            : fit === "stretch"
              ? "fill"
              : "contain",
      objectPosition: "center center",
      pointerEvents: "none",
    };

    return (
      <div style={mini ? styles.miniPageWrap : styles.pageCanvas}>
        <div
          style={{
            ...styles.pageInner,
            background: page.background_color || "#fff",
          }}
        >
          {page.image ? (
            <img src={page.image} alt={page.image_name || "Page asset"} style={imageStyle} />
          ) : (
            <div style={styles.noImageText}>No image on this page</div>
          )}
          <div style={styles.pageNumberBadge}>Page {page.page_number}</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={styles.page}>
        <div style={styles.topBar}>
          <div style={styles.brand}>Black Label Mockups</div>
        </div>

        <div style={styles.centerWrap}>
          <div style={styles.notFoundCard}>
            <h1 style={styles.notFoundTitle}>Mockup not found</h1>
            <p style={styles.notFoundText}>
              This share link is invalid or no longer public.
            </p>
            <Link to="/" style={styles.homeLink}>
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalCount = viewMode === "spread" ? spreads.length : sortedPages.length;
  const currentDisplay = currentIndex + 1;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.brand}>Black Label Mockups</div>
          <div style={styles.projectTitle}>{project.title}</div>
        </div>

        <div style={styles.topBarRight}>
          <button
            style={{
              ...styles.controlButton,
              ...(viewMode === "single" ? styles.activeButton : {}),
            }}
            onClick={() => {
              setViewMode("single");
              setCurrentIndex(0);
            }}
          >
            Single
          </button>
          <button
            style={{
              ...styles.controlButton,
              ...(viewMode === "spread" ? styles.activeButton : {}),
            }}
            onClick={() => {
              setViewMode("spread");
              setCurrentIndex(0);
            }}
          >
            Spread
          </button>
        </div>
      </div>

      <div style={styles.viewerWrap}>
        <div style={styles.counter}>
          {currentDisplay} / {totalCount}
        </div>

        {viewMode === "spread" ? (
          <div style={styles.stageSpread}>
            {renderPage(currentSpread.left)}
            <div style={styles.spineShadow} />
            {renderPage(currentSpread.right)}
          </div>
        ) : (
          <div style={styles.stageSingle}>{renderPage(currentSingle)}</div>
        )}

        <div style={styles.controls}>
          <button style={styles.controlButton} onClick={prev} disabled={currentIndex <= 0}>
            Previous
          </button>
          <button
            style={styles.controlButton}
            onClick={next}
            disabled={currentIndex >= totalCount - 1}
          >
            Next
          </button>
        </div>

        <div style={styles.thumbRow}>
          {(viewMode === "spread" ? spreads : sortedPages).map((item, index) => (
            <button
              key={viewMode === "spread" ? `spread-${index}` : item.id}
              style={{
                ...styles.thumbButton,
                ...(index === currentIndex ? styles.thumbButtonActive : {}),
              }}
              onClick={() => setCurrentIndex(index)}
            >
              {viewMode === "spread" ? (
                <div style={styles.spreadMiniWrap}>
                  {renderPage(item.left, true)}
                  {renderPage(item.right, true)}
                </div>
              ) : (
                renderPage(item, true)
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#050505",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "20px 24px",
    borderBottom: "1px solid #1a1a1a",
    background: "rgba(0,0,0,0.92)",
    backdropFilter: "blur(10px)",
  },
  brand: {
    fontSize: "14px",
    color: "#39ff14",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  projectTitle: {
    fontSize: "28px",
    fontWeight: "bold",
  },
  topBarRight: {
    display: "flex",
    gap: "10px",
  },
  viewerWrap: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "24px 20px 40px",
  },
  counter: {
    color: "#b3b3b3",
    fontSize: "14px",
    marginBottom: "14px",
    textAlign: "center",
  },
  stageSingle: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "560px",
    padding: "20px",
    background: "radial-gradient(circle at center, #111 0%, #070707 100%)",
    borderRadius: "20px",
    border: "1px solid #161616",
  },
  stageSpread: {
    display: "grid",
    gridTemplateColumns: "1fr 14px 1fr",
    alignItems: "center",
    justifyItems: "center",
    minHeight: "560px",
    padding: "20px",
    background: "radial-gradient(circle at center, #111 0%, #070707 100%)",
    borderRadius: "20px",
    border: "1px solid #161616",
    gap: "12px",
  },
  spineShadow: {
    width: "14px",
    height: "450px",
    borderRadius: "12px",
    background: "linear-gradient(to right, #040404, #1a1a1a, #040404)",
  },
  pageCanvas: {
    width: "100%",
    maxWidth: "360px",
    aspectRatio: "8.5 / 11",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pageCanvasEmpty: {
    width: "100%",
    maxWidth: "360px",
    aspectRatio: "8.5 / 11",
    borderRadius: "14px",
    border: "1px dashed #333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    background: "#111",
  },
  pageInner: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
    border: "1px solid #ddd",
  },
  noImageText: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    fontSize: "14px",
    background: "repeating-linear-gradient(45deg, #fafafa, #fafafa 12px, #f2f2f2 12px, #f2f2f2 24px)",
  },
  pageNumberBadge: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.75)",
    color: "#fff",
    padding: "5px 8px",
    borderRadius: "999px",
    fontSize: "11px",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "18px",
  },
  controlButton: {
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#171717",
    border: "1px solid #2a2a2a",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  },
  activeButton: {
    border: "1px solid #39ff14",
    boxShadow: "0 0 0 1px rgba(57,255,20,0.2) inset",
  },
  thumbRow: {
    marginTop: "20px",
    display: "flex",
    gap: "12px",
    overflowX: "auto",
    paddingBottom: "8px",
  },
  thumbButton: {
    flex: "0 0 auto",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "8px",
    cursor: "pointer",
    minWidth: "110px",
  },
  thumbButtonActive: {
    border: "1px solid #39ff14",
  },
  spreadMiniWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    width: "140px",
  },
  miniPageWrap: {
    width: "100%",
    aspectRatio: "8.5 / 11",
  },
  centerWrap: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "60px 20px",
  },
  notFoundCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "20px",
    padding: "32px",
    textAlign: "center",
  },
  notFoundTitle: {
    fontSize: "32px",
    marginBottom: "10px",
  },
  notFoundText: {
    color: "#b3b3b3",
    marginBottom: "20px",
  },
  homeLink: {
    display: "inline-block",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#39ff14",
    color: "#000",
    fontWeight: "bold",
    textDecoration: "none",
  },
};
