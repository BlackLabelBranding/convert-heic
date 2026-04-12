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

export default function MagazineMockupPreview() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState("spread");
  const [direction, setDirection] = useState("next");

  useEffect(() => {
    const allProjects = loadProjects();
    const found = allProjects.find((p) => p.id === id);
    setProject(found || null);
  }, [id]);

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
    setDirection("next");
    if (viewMode === "spread") {
      setCurrentIndex((prev) => Math.min(prev + 1, spreads.length - 1));
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, sortedPages.length - 1));
    }
  }

  function prev() {
    setDirection("prev");
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
          <div style={styles.brand}>Black Label Preview</div>
        </div>
        <div style={styles.centerWrap}>
          <div style={styles.notFoundCard}>
            <h1 style={styles.notFoundTitle}>Preview not found</h1>
            <p style={styles.notFoundText}>This project could not be loaded.</p>
            <Link to="/magazine-mockup" style={styles.homeLink}>
              Back to Dashboard
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
          <div style={styles.brand}>Black Label Preview</div>
          <div style={styles.projectTitle}>{project.title}</div>
        </div>

        <div style={styles.topBarRight}>
          <Link to={`/magazine-mockup/${project.id}`} style={styles.controlLink}>
            Back to Editor
          </Link>
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
          <div
            key={`spread-${currentIndex}-${direction}`}
            style={{
              ...styles.stageSpread,
              ...(direction === "next" ? styles.slideInRight : styles.slideInLeft),
            }}
          >
            {renderPage(currentSpread.left)}
            <div style={styles.spineShadow} />
            {renderPage(currentSpread.right)}
          </div>
        ) : (
          <div
            key={`single-${currentIndex}-${direction}`}
            style={{
              ...styles.stageSingle,
              ...(direction === "next" ? styles.slideInRight : styles.slideInLeft),
            }}
          >
            {renderPage(currentSingle)}
          </div>
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
    background: "rgba(0,0,0,0.94)",
    backdropFilter: "blur(12px)",
  },
  brand: {
    fontSize: "14px",
    color: "#39ff14",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  projectTitle: {
    fontSize: "30px",
    fontWeight: "bold",
  },
  topBarRight: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  viewerWrap: {
    maxWidth: "1500px",
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
    minHeight: "700px",
    padding: "30px",
    background: "radial-gradient(circle at center, #111 0%, #060606 100%)",
    borderRadius: "24px",
    border: "1px solid #161616",
  },
  stageSpread: {
    display: "grid",
    gridTemplateColumns: "1fr 18px 1fr",
    alignItems: "center",
    justifyItems: "center",
    minHeight: "700px",
    padding: "30px",
    background: "radial-gradient(circle at center, #111 0%, #060606 100%)",
    borderRadius: "24px",
    border: "1px solid #161616",
    gap: "14px",
  },
  slideInRight: {
    animation: "blbSlideInRight 0.25s ease",
  },
  slideInLeft: {
    animation: "blbSlideInLeft 0.25s ease",
  },
  spineShadow: {
    width: "18px",
    height: "560px",
    borderRadius: "12px",
    background: "linear-gradient(to right, #030303, #1d1d1d, #030303)",
    boxShadow: "inset 0 0 12px rgba(0,0,0,0.6)",
  },
  pageCanvas: {
    width: "100%",
    maxWidth: "460px",
    aspectRatio: "8.5 / 11",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pageCanvasEmpty: {
    width: "100%",
    maxWidth: "460px",
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
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
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
    marginTop: "20px",
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
  controlLink: {
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#171717",
    border: "1px solid #2a2a2a",
    color: "#fff",
    textDecoration: "none",
    fontSize: "14px",
  },
  activeButton: {
    border: "1px solid #39ff14",
    boxShadow: "0 0 0 1px rgba(57,255,20,0.2) inset",
  },
  thumbRow: {
    marginTop: "22px",
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
    minWidth: "120px",
  },
  thumbButtonActive: {
    border: "1px solid #39ff14",
  },
  spreadMiniWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    width: "150px",
  },
  miniPageWrap: {
    width: "100%",
    aspectRatio: "8.5 / 11",
  },
  miniPage: {
    width: "100%",
    aspectRatio: "8.5 / 11",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#fff",
    position: "relative",
    border: "1px solid #ddd",
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
