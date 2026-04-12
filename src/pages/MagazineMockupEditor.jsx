import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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

function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function buildShareUrl(token) {
  if (!token) return "";
  return `${window.location.origin}/m/${token}`;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateToken(length = 24) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
<Link to={`/magazine-mockup/${project.id}/preview`} style={styles.primaryLinkButton}>
  Preview Flipbook
</Link>

export default function MagazineMockupEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("single");

  useEffect(() => {
    const allProjects = loadProjects();
    setProjects(allProjects);

    const found = allProjects.find((p) => p.id === id);
    if (!found) return;

    setProject(found);
    setSelectedPageId(found.pages?.[0]?.id || null);
  }, [id]);

  const selectedPage = useMemo(() => {
    if (!project) return null;
    return project.pages?.find((p) => p.id === selectedPageId) || null;
  }, [project, selectedPageId]);

  const sortedPages = useMemo(() => {
    if (!project?.pages) return [];
    return [...project.pages].sort((a, b) => a.page_number - b.page_number);
  }, [project]);

  const spreadPair = useMemo(() => {
    if (!selectedPage || !sortedPages.length) return { left: null, right: null };
    const index = sortedPages.findIndex((p) => p.id === selectedPage.id);
    if (index === -1) return { left: null, right: null };

    if (index % 2 === 0) {
      return {
        left: sortedPages[index] || null,
        right: sortedPages[index + 1] || null,
      };
    }

    return {
      left: sortedPages[index - 1] || null,
      right: sortedPages[index] || null,
    };
  }, [selectedPage, sortedPages]);

  function syncProject(updatedProject, nextMessage = "Saved.") {
    const allProjects = loadProjects();
    const nextProjects = allProjects.map((p) =>
      p.id === updatedProject.id ? updatedProject : p
    );
    saveProjects(nextProjects);
    setProjects(nextProjects);
    setProject(updatedProject);
    setMessage(nextMessage);
  }

  function updateProject(updater, nextMessage = "Saved.") {
    if (!project) return;
    const updatedProject = {
      ...updater(project),
      updated_at: new Date().toISOString(),
    };
    syncProject(updatedProject, nextMessage);
  }

  function updatePage(pageId, patch, nextMessage = "Page updated.") {
    updateProject(
      (current) => ({
        ...current,
        pages: current.pages.map((page) =>
          page.id === pageId ? { ...page, ...patch } : page
        ),
      }),
      nextMessage
    );
  }

  function renameProject(value) {
    updateProject(
      (current) => ({
        ...current,
        title: value,
      }),
      "Project title updated."
    );
  }

  function addPage() {
    if (!project) return;
    const nextNumber =
      Math.max(0, ...project.pages.map((p) => p.page_number || 0)) + 1;

    const newPage = {
      id: generateId(),
      page_number: nextNumber,
      page_type: "inside",
      background_color: "#ffffff",
      image: null,
      image_fit: "cover",
      image_scale: 1,
      image_x: 0,
      image_y: 0,
    };

    updateProject(
      (current) => ({
        ...current,
        pages: [...current.pages, newPage],
      }),
      "Page added."
    );

    setSelectedPageId(newPage.id);
  }

  function deleteSelectedPage() {
    if (!project || !selectedPage) return;
    if (project.pages.length <= 1) {
      setMessage("A project must have at least one page.");
      return;
    }

    const confirmed = window.confirm(
      `Delete page ${selectedPage.page_number}?`
    );
    if (!confirmed) return;

    const remaining = project.pages
      .filter((p) => p.id !== selectedPage.id)
      .sort((a, b) => a.page_number - b.page_number)
      .map((page, index) => ({
        ...page,
        page_number: index + 1,
      }));

    const updatedProject = {
      ...project,
      pages: remaining,
      updated_at: new Date().toISOString(),
    };

    syncProject(updatedProject, "Page deleted.");
    setSelectedPageId(remaining[0]?.id || null);
  }

  function movePage(direction) {
    if (!project || !selectedPage) return;
    const pages = [...project.pages].sort((a, b) => a.page_number - b.page_number);
    const index = pages.findIndex((p) => p.id === selectedPage.id);
    if (index === -1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= pages.length) return;

    [pages[index], pages[swapIndex]] = [pages[swapIndex], pages[index]];

    const renumbered = pages.map((page, i) => ({
      ...page,
      page_number: i + 1,
    }));

    updateProject(
      (current) => ({
        ...current,
        pages: renumbered,
      }),
      "Page order updated."
    );
  }

  function onUploadClick() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !selectedPage) return;

    const reader = new FileReader();
    reader.onload = () => {
      updatePage(
        selectedPage.id,
        {
          image: reader.result,
          image_name: file.name,
        },
        "Image uploaded."
      );
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  }

  function clearImage() {
    if (!selectedPage) return;
    updatePage(
      selectedPage.id,
      {
        image: null,
        image_name: null,
        image_scale: 1,
        image_x: 0,
        image_y: 0,
      },
      "Image removed."
    );
  }

  function setFitMode(mode) {
    if (!selectedPage) return;
    updatePage(selectedPage.id, { image_fit: mode }, "Fit mode updated.");
  }

  function setScale(value) {
    if (!selectedPage) return;
    updatePage(selectedPage.id, { image_scale: Number(value) }, "Scale updated.");
  }

  function setOffset(axis, value) {
    if (!selectedPage) return;
    const num = Number(value) || 0;
    if (axis === "x") {
      updatePage(selectedPage.id, { image_x: num }, "Horizontal offset updated.");
    } else {
      updatePage(selectedPage.id, { image_y: num }, "Vertical offset updated.");
    }
  }

  function resetTransform() {
    if (!selectedPage) return;
    updatePage(
      selectedPage.id,
      {
        image_scale: 1,
        image_x: 0,
        image_y: 0,
      },
      "Position reset."
    );
  }

  function toggleSharing() {
    if (!project) return;
    updateProject(
      (current) => ({
        ...current,
        is_public: !current.is_public,
        share_token: current.share_token || generateToken(),
      }),
      "Sharing updated."
    );
  }

  function regenerateLink() {
    if (!project) return;
    const nextToken = generateToken();
    updateProject(
      (current) => ({
        ...current,
        share_token: nextToken,
      }),
      "New share link generated."
    );

    navigator.clipboard
      .writeText(buildShareUrl(nextToken))
      .then(() => setMessage("New share link generated and copied."))
      .catch(() => setMessage("New share link generated."));
  }

  function copyShareLink() {
    if (!project?.share_token || !project?.is_public) {
      setMessage("Enable sharing first.");
      return;
    }

    navigator.clipboard
      .writeText(buildShareUrl(project.share_token))
      .then(() => setMessage("Share link copied."))
      .catch(() => setMessage("Could not copy share link."));
  }

  function duplicatePage() {
    if (!project || !selectedPage) return;

    const pages = [...project.pages].sort((a, b) => a.page_number - b.page_number);
    const index = pages.findIndex((p) => p.id === selectedPage.id);

    const cloned = {
      ...selectedPage,
      id: generateId(),
      page_number: selectedPage.page_number + 1,
    };

    const nextPages = [
      ...pages.slice(0, index + 1),
      cloned,
      ...pages.slice(index + 1),
    ].map((page, i) => ({
      ...page,
      page_number: i + 1,
    }));

    updateProject(
      (current) => ({
        ...current,
        pages: nextPages,
      }),
      "Page duplicated."
    );

    setSelectedPageId(cloned.id);
  }

  function renderPage(page, mini = false) {
    if (!page) {
      return <div style={mini ? styles.miniPage : styles.pageCanvasEmpty}>No page</div>;
    }

    const hasImage = !!page.image;
    const fit = page.image_fit || "cover";
    const scale = clamp(Number(page.image_scale) || 1, 0.2, 3);
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
      <div style={mini ? styles.miniPage : styles.pageCanvas}>
        <div
          style={{
            ...styles.pageInner,
            background: page.background_color || "#fff",
          }}
        >
          {hasImage ? (
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
        <nav style={styles.nav}>
          <div style={styles.navLeft}>
            <Link to="/magazine-mockup" style={styles.backLink}>
              ← Back
            </Link>
            <div style={styles.navBrand}>Magazine Mockup Editor</div>
          </div>
        </nav>

        <div style={styles.centerWrap}>
          <div style={styles.notFoundCard}>
            <h1 style={styles.notFoundTitle}>Project not found</h1>
            <p style={styles.notFoundText}>
              This mockup project does not exist in local storage.
            </p>
            <Link to="/magazine-mockup" style={styles.primaryLinkButton}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shareUrl = buildShareUrl(project.share_token);

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <Link to="/magazine-mockup" style={styles.backLink}>
            ← Back
          </Link>
          <div style={styles.navBrand}>Magazine Mockup Editor</div>
        </div>

        <div style={styles.navActions}>
          <button style={styles.secondaryButton} onClick={() => navigate("/magazine-mockup")}>
            Dashboard
          </button>
        </div>
      </nav>

      <div style={styles.editorWrap}>
        <div style={styles.sidebar}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Project</div>

            <div style={styles.field}>
              <label style={styles.label}>Project title</label>
              <input
                style={styles.input}
                value={project.title}
                onChange={(e) => renameProject(e.target.value)}
              />
            </div>

            <div style={styles.metaBox}>
              <div style={styles.metaLine}>Size: {project.page_width} × {project.page_height}</div>
              <div style={styles.metaLine}>DPI: {project.dpi}</div>
              <div style={styles.metaLine}>Created: {formatDate(project.created_at)}</div>
              <div style={styles.metaLine}>Updated: {formatDate(project.updated_at)}</div>
            </div>

            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleTitle}>
                  {project.is_public ? "Public" : "Private"}
                </div>
                <div style={styles.toggleText}>Enable share access for this project.</div>
              </div>

              <input
                type="checkbox"
                checked={!!project.is_public}
                onChange={toggleSharing}
              />
            </div>

            <div style={styles.shareBox}>
              <div style={styles.shareTitle}>Share URL</div>
              <div style={styles.shareText}>
                {project.is_public ? shareUrl : "Sharing disabled"}
              </div>
            </div>

            <div style={styles.buttonCol}>
              <button style={styles.primaryButton} onClick={copyShareLink}>
                Copy Share Link
              </button>
              <button style={styles.secondaryButton} onClick={regenerateLink}>
                Regenerate Link
              </button>
              {project.is_public ? (
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.secondaryLinkButton}
                >
                  Open Share Page
                </a>
              ) : null}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeaderRow}>
              <div style={styles.panelTitle}>Pages</div>
              <button style={styles.smallPrimaryButton} onClick={addPage}>
                + Add
              </button>
            </div>

            <div style={styles.pageList}>
              {sortedPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setSelectedPageId(page.id)}
                  style={{
                    ...styles.pageListItem,
                    ...(selectedPageId === page.id ? styles.pageListItemActive : {}),
                  }}
                >
                  <div style={styles.pageListMain}>
                    <div style={styles.pageListNumber}>Page {page.page_number}</div>
                    <div style={styles.pageListType}>{page.page_type}</div>
                  </div>
                  <div style={styles.pageListThumb}>{page.image ? "Image" : "Empty"}</div>
                </button>
              ))}
            </div>

            <div style={styles.buttonGrid}>
              <button style={styles.secondaryButton} onClick={() => movePage("up")}>
                Move Up
              </button>
              <button style={styles.secondaryButton} onClick={() => movePage("down")}>
                Move Down
              </button>
              <button style={styles.secondaryButton} onClick={duplicatePage}>
                Duplicate
              </button>
              <button style={styles.deleteButton} onClick={deleteSelectedPage}>
                Delete
              </button>
            </div>
          </div>

          {selectedPage ? (
            <div style={styles.panel}>
              <div style={styles.panelTitle}>Selected Page</div>

              <div style={styles.field}>
                <label style={styles.label}>Page type</label>
                <select
                  style={styles.input}
                  value={selectedPage.page_type}
                  onChange={(e) =>
                    updatePage(selectedPage.id, { page_type: e.target.value }, "Page type updated.")
                  }
                >
                  <option value="cover">cover</option>
                  <option value="inside">inside</option>
                  <option value="back_cover">back_cover</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Background color</label>
                <input
                  style={styles.input}
                  value={selectedPage.background_color || "#ffffff"}
                  onChange={(e) =>
                    updatePage(
                      selectedPage.id,
                      { background_color: e.target.value },
                      "Background updated."
                    )
                  }
                />
              </div>

              <div style={styles.buttonCol}>
                <button style={styles.primaryButton} onClick={onUploadClick}>
                  Upload / Replace Image
                </button>
                <button style={styles.secondaryButton} onClick={clearImage}>
                  Remove Image
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />

              <div style={styles.field}>
                <label style={styles.label}>Fit mode</label>
                <select
                  style={styles.input}
                  value={selectedPage.image_fit || "cover"}
                  onChange={(e) => setFitMode(e.target.value)}
                >
                  <option value="cover">cover</option>
                  <option value="contain">contain</option>
                  <option value="stretch">stretch</option>
                  <option value="centered">centered</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Scale ({Number(selectedPage.image_scale || 1).toFixed(2)})
                </label>
                <input
                  style={styles.range}
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.05"
                  value={selectedPage.image_scale || 1}
                  onChange={(e) => setScale(e.target.value)}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Horizontal offset</label>
                <input
                  style={styles.input}
                  type="number"
                  value={selectedPage.image_x || 0}
                  onChange={(e) => setOffset("x", e.target.value)}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Vertical offset</label>
                <input
                  style={styles.input}
                  type="number"
                  value={selectedPage.image_y || 0}
                  onChange={(e) => setOffset("y", e.target.value)}
                />
              </div>

              <button style={styles.secondaryButton} onClick={resetTransform}>
                Reset Position
              </button>
            </div>
          ) : null}
        </div>

        <div style={styles.mainStage}>
          <div style={styles.stageToolbar}>
            <div style={styles.stageToolbarLeft}>
              <div style={styles.stageTitle}>{project.title}</div>
              <div style={styles.stageSubtitle}>
                {selectedPage
                  ? `Editing page ${selectedPage.page_number}`
                  : "Select a page"}
              </div>
            </div>

            <div style={styles.viewModeRow}>
              <button
                style={{
                  ...styles.secondaryButton,
                  ...(viewMode === "single" ? styles.activeModeButton : {}),
                }}
                onClick={() => setViewMode("single")}
              >
                Single
              </button>
              <button
                style={{
                  ...styles.secondaryButton,
                  ...(viewMode === "spread" ? styles.activeModeButton : {}),
                }}
                onClick={() => setViewMode("spread")}
              >
                Spread
              </button>
            </div>
          </div>

          {message ? <div style={styles.message}>{message}</div> : null}

          {viewMode === "single" ? (
            <div style={styles.stageSingle}>{renderPage(selectedPage)}</div>
          ) : (
            <div style={styles.stageSpread}>
              {renderPage(spreadPair.left)}
              <div style={styles.spineShadow} />
              {renderPage(spreadPair.right)}
            </div>
          )}

          <div style={styles.bottomThumbRow}>
            {sortedPages.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelectedPageId(page.id)}
                style={{
                  ...styles.thumbButton,
                  ...(selectedPageId === page.id ? styles.thumbButtonActive : {}),
                }}
              >
                {renderPage(page, true)}
              </button>
            ))}
          </div>
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
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "18px 24px",
    borderBottom: "1px solid #1f1f1f",
    background: "rgba(0,0,0,0.92)",
    backdropFilter: "blur(10px)",
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  navBrand: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#39ff14",
  },
  navActions: {
    display: "flex",
    gap: "10px",
  },
  backLink: {
    color: "#b3b3b3",
    textDecoration: "none",
    fontSize: "14px",
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
  editorWrap: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: "24px",
    padding: "24px",
    alignItems: "start",
  },
  sidebar: {
    display: "grid",
    gap: "18px",
    position: "sticky",
    top: "84px",
    alignSelf: "start",
    maxHeight: "calc(100vh - 110px)",
    overflowY: "auto",
    paddingRight: "6px",
  },
  panel: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "20px",
    padding: "20px",
  },
  panelTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "14px",
  },
  panelHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "14px",
  },
  field: {
    marginBottom: "14px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    color: "#ddd",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #2a2a2a",
    background: "#0b0b0b",
    color: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  range: {
    width: "100%",
  },
  metaBox: {
    background: "#0b0b0b",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "14px",
  },
  metaLine: {
    color: "#b3b3b3",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "14px",
    border: "1px solid #222",
    borderRadius: "16px",
    background: "#0b0b0b",
    marginBottom: "14px",
  },
  toggleTitle: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "4px",
  },
  toggleText: {
    fontSize: "12px",
    color: "#999",
    lineHeight: 1.4,
  },
  shareBox: {
    background: "#0b0b0b",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "14px",
  },
  shareTitle: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "8px",
  },
  shareText: {
    fontSize: "12px",
    color: "#9fdc90",
    wordBreak: "break-all",
    lineHeight: 1.5,
  },
  buttonCol: {
    display: "grid",
    gap: "10px",
  },
  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "14px",
  },
  primaryButton: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#39ff14",
    color: "#000",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
  },
  smallPrimaryButton: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#39ff14",
    color: "#000",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
  },
  activeModeButton: {
    border: "1px solid #39ff14",
    boxShadow: "0 0 0 1px rgba(57,255,20,0.2) inset",
  },
  secondaryLinkButton: {
    display: "inline-block",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#fff",
    fontSize: "14px",
    textDecoration: "none",
    textAlign: "center",
  },
  primaryLinkButton: {
    display: "inline-block",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#39ff14",
    color: "#000",
    fontWeight: "bold",
    textDecoration: "none",
  },
  deleteButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#220909",
    border: "1px solid #4a1b1b",
    color: "#ffb3b3",
    fontSize: "14px",
    cursor: "pointer",
  },
  pageList: {
    display: "grid",
    gap: "10px",
  },
  pageListItem: {
    width: "100%",
    textAlign: "left",
    background: "#0b0b0b",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "12px",
    color: "#fff",
    cursor: "pointer",
  },
  pageListItemActive: {
    border: "1px solid #39ff14",
    boxShadow: "0 0 0 1px rgba(57,255,20,0.15) inset",
  },
  pageListMain: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "6px",
  },
  pageListNumber: {
    fontSize: "14px",
    fontWeight: "bold",
  },
  pageListType: {
    fontSize: "12px",
    color: "#999",
  },
  pageListThumb: {
    fontSize: "12px",
    color: "#b3b3b3",
  },
  mainStage: {
    minWidth: 0,
    background: "#0b0b0b",
    border: "1px solid #1f1f1f",
    borderRadius: "24px",
    padding: "20px",
  },
  stageToolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  stageToolbarLeft: {
    minWidth: 0,
  },
  stageTitle: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "6px",
  },
  stageSubtitle: {
    fontSize: "14px",
    color: "#999",
  },
  viewModeRow: {
    display: "flex",
    gap: "10px",
  },
  message: {
    marginBottom: "16px",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "14px",
    color: "#d9d9d9",
    fontSize: "14px",
  },
  stageSingle: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "520px",
    padding: "20px",
    background: "radial-gradient(circle at center, #111 0%, #070707 100%)",
    borderRadius: "20px",
    border: "1px solid #161616",
  },
  stageSpread: {
    display: "grid",
    gridTemplateColumns: "1fr 12px 1fr",
    alignItems: "center",
    justifyItems: "center",
    minHeight: "520px",
    padding: "20px",
    background: "radial-gradient(circle at center, #111 0%, #070707 100%)",
    borderRadius: "20px",
    border: "1px solid #161616",
    gap: "10px",
  },
  spineShadow: {
    width: "12px",
    height: "420px",
    borderRadius: "12px",
    background: "linear-gradient(to right, #050505, #1a1a1a, #050505)",
  },
  pageCanvas: {
    width: "100%",
    maxWidth: "340px",
    aspectRatio: "8.5 / 11",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pageCanvasEmpty: {
    width: "100%",
    maxWidth: "340px",
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
  bottomThumbRow: {
    marginTop: "18px",
    display: "flex",
    gap: "12px",
    overflowX: "auto",
    paddingBottom: "8px",
  },
  thumbButton: {
    flex: "0 0 auto",
    width: "110px",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "8px",
    cursor: "pointer",
  },
  thumbButtonActive: {
    border: "1px solid #39ff14",
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
};
