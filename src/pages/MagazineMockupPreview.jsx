import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const STORAGE_KEY = "blb_magazine_mockup_projects";
const VERSION = "preview-v2-debug";

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

function buildViewerItems(pages) {
  if (!pages.length) return [];

  const sorted = [...pages].sort((a, b) => a.page_number - b.page_number);
  const items = [];

  if (sorted.length >= 1) {
    items.push({
      type: "cover",
      left: null,
      right: sorted[0],
      label: "Cover",
    });
  }

  let i = 1;
  while (i < sorted.length) {
    const left = sorted[i] || null;
    const right = sorted[i + 1] || null;

    if (!left && !right) break;

    if (left && right) {
      items.push({
        type: "spread",
        left,
        right,
        label: `${left.page_number}-${right.page_number}`,
      });
      i += 2;
    } else {
      items.push({
        type: "single",
        left,
        right: null,
        label: `${left.page_number}`,
      });
      i += 1;
    }
  }

  return items;
}

export default function MagazineMockupPreview() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const allProjects = loadProjects();
    const found = allProjects.find((p) => p.id === id);
    setProject(found || null);
  }, [id]);

  const sortedPages = useMemo(() => {
    if (!project?.pages) return [];
    return [...project.pages].sort((a, b) => a.page_number - b.page_number);
  }, [project]);

  const viewerItems = useMemo(() => buildViewerItems(sortedPages), [sortedPages]);
  const currentItem = viewerItems[currentIndex] || null;

  function next() {
    setCurrentIndex((prev) => Math.min(prev + 1, viewerItems.length - 1));
  }

  function prev() {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function goToEditor() {
    window.location.href = `/magazine-mockup/${id}`;
  }

  function goToDashboard() {
    window.location.href = `/magazine-mockup`;
  }

  function getImageStyle(page) {
    const fit = page.image_fit || "cover";
    const scale = Number(page.image_scale) || 1;
    const x = Number(page.image_x) || 0;
    const y = Number(page.image_y) || 0;

    return {
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
  }

  function renderMiniPage(page) {
    if (!page) {
      return (
        <div style={styles.miniShell}>
          <div style={styles.miniEmpty} />
        </div>
      );
    }

    return (
      <div style={styles.miniShell}>
        <div style={styles.miniInner}>
          {page.image ? (
            <img
              src={page.image}
              alt={page.image_name || "Page asset"}
              style={getImageStyle(page)}
            />
          ) : (
            <div style={styles.miniNoImage} />
          )}
        </div>
      </div>
    );
  }

  function renderFullPage(page, mode = "spread") {
    if (!page) {
      return (
        <div style={mode === "single" ? styles.singlePageBox : styles.spreadPageBox}>
          <div style={styles.fullEmpty}>No page</div>
        </div>
      );
    }

    const boxStyle = mode === "single" ? styles.singlePageBox : styles.spreadPageBox;

    return (
      <div style={boxStyle}>
        <div
          style={{
            ...styles.fullInner,
            background: page.background_color || "#fff",
          }}
        >
          {page.image ? (
            <img
              src={page.image}
              alt={page.image_name || "Page asset"}
              style={getImageStyle(page)}
            />
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
          <div>
            <div style={styles.brand}>Black Label Preview</div>
            <div style={styles.projectTitle}>Preview not found</div>
            <div style={styles.version}>{VERSION}</div>
          </div>

          <div style={styles.topBarRight}>
            <button style={styles.controlButton} onClick={goToDashboard}>
              Dashboard
            </button>
          </div>
        </div>

        <div style={styles.centerWrap}>
          <div style={styles.notFoundCard}>
            <h1 style={styles.notFoundTitle}>Preview not found</h1>
            <p style={styles.notFoundText}>This project could not be loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.brand}>Black Label Preview</div>
          <div style={styles.projectTitle}>{project.title}</div>
          <div style={styles.version}>{VERSION}</div>
        </div>

        <div style={styles.topBarRight}>
          <button style={styles.controlButton} onClick={goToEditor}>
            Back to Editor
          </button>
          <button style={styles.controlButton} onClick={goToDashboard}>
            Dashboard
          </button>
        </div>
      </div>

      <div style={styles.viewerWrap}>
        <div style={styles.counter}>
          {currentIndex + 1} / {viewerItems.length}
          {currentItem?.label ? ` • ${currentItem.label}` : ""}
        </div>

        <div style={styles.stage}>
          {currentItem?.type === "cover" || currentItem?.type === "single" ? (
            <div style={styles.singleStage}>
              {renderFullPage(currentItem.right || currentItem.left, "single")}
            </div>
          ) : (
            <div style={styles.spreadStage}>
              <div style={styles.spreadShadow} />
              <div style={styles.spreadFrame}>
                {renderFullPage(currentItem?.left, "spread")}
                <div style={styles.seam} />
                {renderFullPage(currentItem?.right, "spread")}
              </div>
            </div>
          )}
        </div>

        <div style={styles.controls}>
          <button
            style={styles.controlButton}
            onClick={prev}
            disabled={currentIndex <= 0}
          >
            Previous
          </button>
          <button
            style={styles.controlButton}
            onClick={next}
            disabled={currentIndex >= viewerItems.length - 1}
          >
            Next
          </button>
        </div>

        <div style={styles.thumbRow}>
          {viewerItems.map((item, index) => (
            <button
              key={`thumb-${index}`}
              onClick={() => setCurrentIndex(index)}
              style={{
                ...styles.thumbButton,
                ...(index === currentIndex ? styles.thumbButtonActive : {}),
              }}
            >
              {item.type === "spread" ? (
                <div style={styles.miniSpread}>
                  {renderMiniPage(item.left)}
                  {renderMiniPage(item.right)}
                </div>
              ) : (
                renderMiniPage(item.right || item.left)
              )}
              <div style={styles.thumbLabel}>{item.label}</div>
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
  version: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#999",
  },
  topBarRight: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  viewerWrap: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "24px 20px 40px",
  },
  counter: {
    color: "#b3b3b3",
    fontSize: "14px",
    marginBottom: "14px",
    textAlign: "center",
  },
  stage: {
    minHeight: "760px",
    padding: "28px",
    background: "radial-gradient(circle at center, #111 0%, #060606 100%)",
    borderRadius: "24px",
    border: "1px solid #161616",
  },

  singleStage: {
    minHeight: "680px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  singlePageBox: {
    width: "490px",
    maxWidth: "92%",
    height: "635px",
    flex: "0 0 auto",
  },

  spreadStage: {
    minHeight: "680px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  spreadShadow: {
    position: "absolute",
    width: "980px",
    maxWidth: "92%",
    height: "635px",
    background: "rgba(0,0,0,0.35)",
    filter: "blur(26px)",
    borderRadius: "24px",
    transform: "translateY(18px)",
  },
  spreadFrame: {
    position: "relative",
    zIndex: 2,
    width: "980px",
    maxWidth: "92%",
    height: "635px",
    display: "grid",
    gridTemplateColumns: "1fr 2px 1fr",
  },
  spreadPageBox: {
    width: "100%",
    height: "100%",
    flex: "0 0 auto",
  },
  seam: {
    width: "2px",
    background: "linear-gradient(to right, #0f0f0f, #1e1e1e)",
    boxShadow: "0 0 12px rgba(0,0,0,0.8)",
  },

  fullInner: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
    border: "1px solid #ddd",
  },
  fullEmpty: {
    width: "100%",
    height: "100%",
    borderRadius: "12px",
    border: "1px dashed #333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    background: "#111",
  },
  noImageText: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    fontSize: "14px",
    background:
      "repeating-linear-gradient(45deg, #fafafa, #fafafa 12px, #f2f2f2 12px, #f2f2f2 24px)",
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
    color: "#fff",
  },
  thumbButtonActive: {
    border: "1px solid #39ff14",
    boxShadow: "0 0 0 1px rgba(57,255,20,0.15) inset",
  },
  thumbLabel: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#b3b3b3",
    textAlign: "center",
  },

  miniSpread: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2px",
    width: "152px",
  },
  miniShell: {
    width: "100%",
    aspectRatio: "8.5 / 11",
  },
  miniInner: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #ddd",
  },
  miniEmpty: {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
    border: "1px dashed #333",
    background: "#111",
  },
  miniNoImage: {
    position: "absolute",
    inset: 0,
    background:
      "repeating-linear-gradient(45deg, #fafafa, #fafafa 12px, #f2f2f2 12px, #f2f2f2 24px)",
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
};
