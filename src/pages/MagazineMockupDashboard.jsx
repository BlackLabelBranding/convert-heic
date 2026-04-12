import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const STORAGE_KEY = "blb_magazine_mockup_projects";

const PAGE_PRESETS = [
  { label: "Magazine Standard", width: 2550, height: 3300, dpi: 300 },
  { label: "US Letter Portrait", width: 2550, height: 3300, dpi: 300 },
  { label: "Square Catalog", width: 3000, height: 3000, dpi: 300 },
  { label: "Tabloid", width: 3300, height: 5100, dpi: 300 },
];

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

function relativeTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function buildShareUrl(token) {
  if (!token) return "";
  return `${window.location.origin}/m/${token}`;
}

export default function MagazineMockupDashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    preset: PAGE_PRESETS[0].label,
    initialPages: 8,
    coverMode: true,
  });

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const selectedPreset = useMemo(() => {
    return PAGE_PRESETS.find((p) => p.label === form.preset) || PAGE_PRESETS[0];
  }, [form.preset]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) =>
      [
        project.title,
        project.status,
        project.share_token,
        String(project.page_width),
        String(project.page_height),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [projects, search]);

  const stats = useMemo(() => {
    return {
      totalProjects: projects.length,
      sharedProjects: projects.filter((p) => p.is_public).length,
      draftProjects: projects.filter((p) => p.status === "draft").length,
      totalPages: projects.reduce(
        (sum, project) => sum + (project.pages?.length || 0),
        0
      ),
    };
  }, [projects]);

  function syncProjects(nextProjects) {
    setProjects(nextProjects);
    saveProjects(nextProjects);
  }

  function createProject() {
    const title = form.title.trim();
    if (!title) {
      setMessage("Project title is required.");
      return;
    }

    const pageCount = Math.max(1, Number(form.initialPages) || 1);

    const pages = Array.from({ length: pageCount }, (_, index) => ({
      id: generateId(),
      page_number: index + 1,
      page_type:
        form.coverMode && index === 0
          ? "cover"
          : form.coverMode && index === pageCount - 1
            ? "back_cover"
            : "inside",
      background_color: "#ffffff",
      image: null,
      image_fit: "cover",
      image_scale: 1,
      image_x: 0,
      image_y: 0,
    }));

    const project = {
      id: generateId(),
      title,
      status: "draft",
      share_token: generateToken(),
      is_public: false,
      page_width: selectedPreset.width,
      page_height: selectedPreset.height,
      dpi: selectedPreset.dpi,
      cover_mode: !!form.coverMode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pages,
    };

    const nextProjects = [project, ...projects];
    syncProjects(nextProjects);
    setForm({
      title: "",
      preset: PAGE_PRESETS[0].label,
      initialPages: 8,
      coverMode: true,
    });
    setMessage(`Created project "${project.title}".`);
    navigate(`/magazine-mockup/${project.id}`);
  }

  function togglePublic(projectId) {
    const nextProjects = projects.map((project) => {
      if (project.id !== projectId) return project;
      return {
        ...project,
        is_public: !project.is_public,
        share_token: project.share_token || generateToken(),
        updated_at: new Date().toISOString(),
      };
    });
    syncProjects(nextProjects);
    setMessage("Sharing updated.");
  }

  function regenerateLink(projectId) {
    const nextProjects = projects.map((project) => {
      if (project.id !== projectId) return project;
      return {
        ...project,
        share_token: generateToken(),
        updated_at: new Date().toISOString(),
      };
    });
    syncProjects(nextProjects);

    const updated = nextProjects.find((p) => p.id === projectId);
    if (updated?.share_token) {
      navigator.clipboard
        .writeText(buildShareUrl(updated.share_token))
        .then(() => setMessage("New share link generated and copied."))
        .catch(() => setMessage("New share link generated."));
    } else {
      setMessage("New share link generated.");
    }
  }

  function copyLink(project) {
    if (!project.is_public || !project.share_token) {
      setMessage("Enable sharing first.");
      return;
    }

    navigator.clipboard
      .writeText(buildShareUrl(project.share_token))
      .then(() => setMessage("Share link copied."))
      .catch(() => setMessage("Could not copy share link."));
  }

  function deleteProject(projectId) {
    const project = projects.find((p) => p.id === projectId);
    const confirmed = window.confirm(
      `Delete "${project?.title || "this project"}"?`
    );
    if (!confirmed) return;

    const nextProjects = projects.filter((project) => project.id !== projectId);
    syncProjects(nextProjects);
    setMessage("Project deleted.");
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <Link to="/" style={styles.backLink}>
            ← Back
          </Link>
          <div style={styles.navBrand}>Magazine Mockup</div>
        </div>
      </nav>

      <div style={styles.container}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Magazine Mockup</h1>
          <p style={styles.subtitle}>
            Create mockup projects, organize pages, and generate private share
            links.
          </p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Projects</div>
            <div style={styles.statValue}>{stats.totalProjects}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Shared</div>
            <div style={styles.statValue}>{stats.sharedProjects}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Drafts</div>
            <div style={styles.statValue}>{stats.draftProjects}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Pages</div>
            <div style={styles.statValue}>{stats.totalPages}</div>
          </div>
        </div>

        <div style={styles.layout}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>New Project</div>
            <div style={styles.panelText}>
              Start a new magazine preview project.
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Project title</label>
              <input
                style={styles.input}
                type="text"
                placeholder="April issue mockup"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Size preset</label>
              <select
                style={styles.input}
                value={form.preset}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, preset: e.target.value }))
                }
              >
                {PAGE_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.label}>
                    {preset.label} — {preset.width} × {preset.height} @{" "}
                    {preset.dpi}dpi
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Starting page count</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                max="100"
                value={form.initialPages}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    initialPages: Number(e.target.value) || 1,
                  }))
                }
              />
            </div>

            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleTitle}>Cover mode</div>
                <div style={styles.toggleText}>
                  First and last pages become cover pages.
                </div>
              </div>

              <input
                type="checkbox"
                checked={form.coverMode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    coverMode: e.target.checked,
                  }))
                }
              />
            </div>

            <div style={styles.summaryBox}>
              <div style={styles.summaryTitle}>Preset Summary</div>
              <div style={styles.summaryText}>Width: {selectedPreset.width}px</div>
              <div style={styles.summaryText}>
                Height: {selectedPreset.height}px
              </div>
              <div style={styles.summaryText}>DPI: {selectedPreset.dpi}</div>
            </div>

            <button style={styles.primaryButton} onClick={createProject}>
              + Create Project
            </button>
          </div>

          <div style={styles.rightCol}>
            <div style={styles.searchBar}>
              <input
                style={styles.input}
                type="text"
                placeholder="Search projects"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {message ? <div style={styles.message}>{message}</div> : null}

            {filteredProjects.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyTitle}>No projects yet</div>
                <div style={styles.emptyText}>
                  Create your first magazine mockup project to get started.
                </div>
              </div>
            ) : (
              <div style={styles.projectList}>
                {filteredProjects.map((project) => {
                  const shareUrl = buildShareUrl(project.share_token);

                  return (
                    <div key={project.id} style={styles.projectCard}>
                      <div style={styles.projectHeader}>
                        <div>
                          <div style={styles.projectTitle}>{project.title}</div>
                          <div style={styles.projectMeta}>
                            Updated {relativeTime(project.updated_at)}
                          </div>
                        </div>

                        <div style={styles.statusBadge}>
                          {project.status || "draft"}
                        </div>
                      </div>

                      <div style={styles.projectStats}>
                        <div style={styles.projectStatBox}>
                          <div style={styles.projectStatLabel}>Pages</div>
                          <div style={styles.projectStatValue}>
                            {project.pages?.length || 0}
                          </div>
                        </div>

                        <div style={styles.projectStatBox}>
                          <div style={styles.projectStatLabel}>Size</div>
                          <div style={styles.projectStatValueSmall}>
                            {project.page_width} × {project.page_height}
                          </div>
                        </div>

                        <div style={styles.projectStatBox}>
                          <div style={styles.projectStatLabel}>DPI</div>
                          <div style={styles.projectStatValue}>{project.dpi}</div>
                        </div>

                        <div style={styles.projectStatBox}>
                          <div style={styles.projectStatLabel}>Shared</div>
                          <div style={styles.projectStatValue}>
                            {project.is_public ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>

                      <div style={styles.shareBox}>
                        <div style={styles.shareTitle}>Public share link</div>
                        <div style={styles.shareText}>
                          {project.is_public ? shareUrl : "Sharing disabled"}
                        </div>
                      </div>

                      <div style={styles.toggleRow}>
                        <div>
                          <div style={styles.toggleTitle}>
                            {project.is_public ? "Public" : "Private"}
                          </div>
                          <div style={styles.toggleText}>
                            Toggle share access for this project.
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={!!project.is_public}
                          onChange={() => togglePublic(project.id)}
                        />
                      </div>

                      <div style={styles.buttonRow}>
                        <Link
                          to={`/magazine-mockup/${project.id}`}
                          style={styles.primaryLinkButton}
                        >
                          Open Editor
                        </Link>

                        <button
                          style={styles.secondaryButton}
                          onClick={() => copyLink(project)}
                        >
                          Copy Link
                        </button>

                        <button
                          style={styles.secondaryButton}
                          onClick={() => regenerateLink(project.id)}
                        >
                          Regenerate Link
                        </button>

                        {project.is_public ? (
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.secondaryLinkButton}
                          >
                            View Share Page
                          </a>
                        ) : null}

                        <button
                          style={styles.deleteButton}
                          onClick={() => deleteProject(project.id)}
                        >
                          Delete
                        </button>
                      </div>

                      <div style={styles.footerMeta}>
                        <div>Created: {formatDate(project.created_at)}</div>
                        <div>Updated: {formatDate(project.updated_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
  backLink: {
    color: "#b3b3b3",
    textDecoration: "none",
    fontSize: "14px",
  },
  navBrand: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#39ff14",
  },
  container: {
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "40px 20px 70px",
  },
  hero: {
    marginBottom: "30px",
  },
  title: {
    fontSize: "42px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#b3b3b3",
    fontSize: "18px",
    maxWidth: "760px",
    lineHeight: 1.5,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "18px",
    padding: "18px",
  },
  statLabel: {
    fontSize: "12px",
    color: "#999",
    marginBottom: "6px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#fff",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "24px",
    alignItems: "start",
  },
  panel: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "20px",
    padding: "24px",
  },
  panelTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  panelText: {
    color: "#b3b3b3",
    fontSize: "14px",
    lineHeight: 1.5,
    marginBottom: "20px",
  },
  field: {
    marginBottom: "16px",
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
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "14px",
    border: "1px solid #222",
    borderRadius: "16px",
    background: "#0b0b0b",
    marginBottom: "16px",
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
  summaryBox: {
    padding: "16px",
    borderRadius: "16px",
    background: "#0b0b0b",
    border: "1px solid #222",
    marginBottom: "18px",
  },
  summaryTitle: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#fff",
  },
  summaryText: {
    fontSize: "13px",
    color: "#b3b3b3",
    lineHeight: 1.6,
  },
  primaryButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "none",
    background: "#39ff14",
    color: "#000",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
  },
  rightCol: {
    minWidth: 0,
  },
  searchBar: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "16px",
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
  emptyCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "20px",
    padding: "32px",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  emptyText: {
    color: "#b3b3b3",
    fontSize: "14px",
  },
  projectList: {
    display: "grid",
    gap: "18px",
  },
  projectCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "20px",
    padding: "22px",
  },
  projectHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  projectTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "6px",
  },
  projectMeta: {
    fontSize: "13px",
    color: "#999",
  },
  statusBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#ddd",
    fontSize: "12px",
    textTransform: "capitalize",
  },
  projectStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  projectStatBox: {
    background: "#0b0b0b",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "14px",
  },
  projectStatLabel: {
    fontSize: "12px",
    color: "#999",
    marginBottom: "6px",
  },
  projectStatValue: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#fff",
  },
  projectStatValueSmall: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 1.4,
  },
  shareBox: {
    background: "#0b0b0b",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "16px",
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
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "8px",
    marginBottom: "16px",
  },
  primaryLinkButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#39ff14",
    color: "#000",
    fontWeight: "bold",
    textDecoration: "none",
    fontSize: "14px",
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
  secondaryLinkButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#fff",
    fontSize: "14px",
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
  footerMeta: {
    display: "grid",
    gap: "6px",
    color: "#777",
    fontSize: "12px",
  },
};
