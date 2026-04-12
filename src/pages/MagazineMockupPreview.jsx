import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/customSupabaseClient";

// ... buildViewerItems and getProjectIdFromUrl functions remain the same ...
function buildViewerItems(pages) {
  if (!pages.length) return [];
  const sorted = [...pages].sort((a, b) => a.page_number - b.page_number);
  const items = [];
  if (sorted.length >= 1) {
    items.push({ type: "cover", left: null, right: sorted[0], label: "Cover" });
  }
  let i = 1;
  while (i < sorted.length) {
    const left = sorted[i] || null;
    const right = sorted[i + 1] || null;
    if (left && right) {
      items.push({ type: "spread", left, right, label: `${left.page_number}-${right.page_number}` });
      i += 2;
    } else if (left) {
      items.push({ type: "single", left, right: null, label: `${left.page_number}` });
      i += 1;
    } else break;
  }
  return items;
}

function getProjectIdFromUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("magazine-mockup");
  return parts[idx + 1] || "";
}

export default function MagazineMockupPreview() {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isTeam, setIsTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  const projectId = useMemo(() => getProjectIdFromUrl(), []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      
      // 1. Check if user is a logged-in team member
      const { data: { user } } = await supabase.auth.getUser();
      let isMember = false;
      if (user) {
        const { data: member } = await supabase.from("team_members").select("user_id").eq("user_id", user.id).single();
        isMember = !!member;
        setIsTeam(isMember);
      }

      // 2. Load the project
      const { data: projectData } = await supabase
        .from("magazine_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (!projectData) {
        setLoading(false);
        return;
      }

      // 3. ENFORCE TOGGLE: If project is NOT public and user is NOT team, deny access
      if (projectData.is_public === false && !isMember) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // 4. Load pages
      const { data: pageData } = await supabase
        .from("magazine_pages")
        .select("*")
        .eq("project_id", projectId)
        .order("page_number", { ascending: true });

      setProject(projectData);
      setPages(pageData || []);
      setLoading(false);
    }
    load();
  }, [projectId]);

  const viewerItems = useMemo(() => buildViewerItems(pages), [pages]);
  const currentItem = viewerItems[currentIndex] || null;

  if (loading) return <div style={styles.centerWrap}><div style={{color: "#39ff14"}}>Loading Preview...</div></div>;

  if (accessDenied) {
    return (
      <div style={styles.page}>
        <div style={styles.centerWrap}>
          <div style={styles.notFoundCard}>
            <h1 style={{ color: "#ff4444" }}>Link Disabled</h1>
            <p style={{ color: "#ccc" }}>This project is no longer being shared publicly.</p>
            <button style={styles.controlButton} onClick={() => window.location.href = "/"}>Return Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ... rest of your existing render code (getImageStyle, renderSpreadPage, etc.) ...
  // Ensure you use {isTeam && ...} to hide the "Back to Editor" buttons from clients.

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.brand}>Black Label Preview</div>
          <div style={styles.projectTitle}>{project?.title || "Untitled"}</div>
        </div>
        <div style={styles.topBarRight}>
          {isTeam && (
            <>
              <button style={styles.controlButton} onClick={() => window.location.href=`/magazine-mockup/${projectId}`}>Back to Editor</button>
              <button style={styles.controlButton} onClick={() => window.location.href="/magazine-mockup"}>Dashboard</button>
            </>
          )}
        </div>
      </div>
      {/* ... the rest of your viewer UI ... */}
    </div>
  );
}

// ... include your styles object here ...
const styles = {
  // same as before
};
