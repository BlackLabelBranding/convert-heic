import React, { useEffect, useState } from "react";
import { supabase } from "../lib/customSupabaseClient";

function generateToken(length = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createDefaultPages(projectId) {
  const pages = [
    {
      project_id: projectId,
      page_number: 1,
      page_type: "cover",
    },
    {
      project_id: projectId,
      page_number: 2,
      page_type: "inside",
    },
    {
      project_id: projectId,
      page_number: 3,
      page_type: "inside",
    },
    {
      project_id: projectId,
      page_number: 4,
      page_type: "inside",
    },
    {
      project_id: projectId,
      page_number: 5,
      page_type: "back_cover",
    },
  ];

  const { error } = await supabase.from("magazine_pages").insert(pages);
  if (error) throw error;
}

export default function MagazineMockupDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function loadProjects() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("magazine_projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setProjects(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function createProject() {
    try {
      setCreating(true);
      setMessage("");

      const { data, error } = await supabase
        .from("magazine_projects")
        .insert({
          title: "Untitled Project",
          page_width: 2550,
          page_height: 3300,
          dpi: 300,
          is_public: false,
          share_token: generateToken(),
        })
        .select()
        .single();

      if (error) throw error;

      await createDefaultPages(data.id);

      window.location.href = `/magazine-mockup/${data.id}`;
    } catch (error) {
      setMessage(error.message || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(projectId) {
    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("magazine_projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navBrand}>Magazine Mockup Dashboard</div>
        <button style={styles.primaryButton} onClick={createProject} disabled={creating}>
          {creating ? "Creating..." : "New Project"}
        </button>
      </nav>

      <div style={styles.container}>
        <h1 style={styles.title}>Magazine Mockups</h1>
        <p style={styles.subtitle}>
          Build, edit, and preview magazine spreads with Supabase-backed storage.
        </p>

        {message ? <div style={styles.message}>{message}</div> : null}

        {loading ? (
          <div style={styles.empty}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div style={styles.empty}>No projects yet.</div>
        ) : (
          <div style={styles.grid}>
            {projects.map((project) => (
              <div key={project.id} style={styles.card}>
                <div style={styles.cardTitle}>{project.title}</div>
                <div style={styles.cardText}>
                  Updated {new Date(project.updated_at).toLocaleString()}
                </div>

                <div style={styles.cardActions}>
                  <button
                    style={styles.primaryButton}
                    onClick={() => {
                      window.location.href = `/magazine-mockup/${project.id}`;
                    }}
                  >
                    Open
                  </button>

                  <button
                    style={styles.secondaryButton}
                    onClick={() => {
                      window.location.href = `/magazine-mockup/${project.id}/preview`;
                    }}
                  >
                    Preview
                  </button>

                  <button
                    style={styles.deleteButton}
                    onClick={() => deleteProject(project.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    borderBottom: "1px solid #1f1f1f",
    background: "rgba(0,0,0,0.92)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  navBrand: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#39ff14",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px 70px",
  },
  title: {
    fontSize: "40px",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#b3b3b3",
    marginBottom: "30px",
  },
  message: {
    marginBottom: "20px",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "14px",
    color: "#ddd",
  },
  empty: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "20px",
    padding: "40px",
    textAlign: "center",
    color: "#b3b3b3",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "20px",
    padding: "20px",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  cardText: {
    color: "#b3b3b3",
    fontSize: "14px",
    marginBottom: "16px",
  },
  cardActions: {
    display: "grid",
    gap: "10px",
  },
  primaryButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#39ff14",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#fff",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#220909",
    border: "1px solid #4a1b1b",
    color: "#ffb3b3",
    cursor: "pointer",
  },
};
