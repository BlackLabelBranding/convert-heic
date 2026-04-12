import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/customSupabaseClient";

export default function MagazineMockupPreview() {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTeam, setIsTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const projectId = useMemo(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("magazine-mockup");
    return parts[idx + 1] || "";
  }, []);

  // Responsive Listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase.from("team_members").select("user_id").eq("user_id", user.id).single();
        setIsTeam(!!member);
      }

      const { data: proj } = await supabase.from("magazine_projects").select("*").eq("id", projectId).single();
      const { data: pgs } = await supabase.from("magazine_pages").select("*").eq("project_id", projectId).order("page_number", { ascending: true });

      setProject(proj);
      setPages(pgs || []);
      setLoading(false);
    }
    load();
  }, [projectId]);

  // If mobile, we treat every page as a single item. If desktop, we group into spreads.
  const viewerItems = useMemo(() => {
    if (!pages.length) return [];
    if (isMobile) {
      return pages.map(p => ({ type: "single", left: p, label: `Page ${p.page_number}` }));
    }
    // Desktop Spread Logic
    const items = [{ type: "cover", left: null, right: pages[0], label: "Cover" }];
    for (let i = 1; i < pages.length; i += 2) {
      const left = pages[i];
      const right = pages[i + 1];
      if (left && right) items.push({ type: "spread", left, right, label: `${left.page_number}-${right.page_number}` });
      else if (left) items.push({ type: "single", left, label: `${left.page_number}` });
    }
    return items;
  }, [pages, isMobile]);

  const currentItem = viewerItems[currentIndex];

  function getImageStyle(page) {
    const fit = page?.image_fit || "cover";
    const scale = Number(page?.image_scale) || 1;
    return {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: `translate(-50%, -50%) scale(${scale})`,
      width: "100%",
      height: "100%",
      objectFit: fit === "cover" ? "cover" : "contain",
    };
  }

  if (loading) return <div style={styles.page}>Loading...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.brand}>Black Label</div>
          <div style={{...styles.projectTitle, fontSize: isMobile ? '18px' : '24px'}}>{project?.title}</div>
        </div>
        {isTeam && !isMobile && (
          <div style={styles.topBarRight}>
            <button style={styles.controlButton} onClick={() => window.location.href=`/magazine-mockup/${projectId}`}>Editor</button>
          </div>
        )}
      </div>

      <div style={{...styles.viewerWrap, padding: isMobile ? "10px" : "24px"}}>
        <div style={styles.counter}>{currentIndex + 1} / {viewerItems.length}</div>

        <div style={{...styles.stage, minHeight: isMobile ? "400px" : "600px", padding: isMobile ? "10px" : "28px"}}>
          {/* MOBILE VIEW or SINGLE PAGE */}
          {isMobile || currentItem?.type !== "spread" ? (
            <div style={styles.singleStage}>
              <div style={{...styles.pageBox, width: isMobile ? "100%" : "450px", height: isMobile ? "70vh" : "600px"}}>
                 <div style={styles.fullInner}>
                    <img src={(currentItem?.right || currentItem?.left)?.image_url} style={getImageStyle(currentItem?.right || currentItem?.left)} />
                 </div>
              </div>
            </div>
          ) : (
            /* DESKTOP SPREAD VIEW */
            <div style={styles.spreadStage}>
              <div style={styles.spreadFrame}>
                <div style={{...styles.fullInner, borderTopRightRadius: 0, borderBottomRightRadius: 0}}>
                  <img src={currentItem.left.image_url} style={getImageStyle(currentItem.left)} />
                </div>
                <div style={styles.seam} />
                <div style={{...styles.fullInner, borderTopLeftRadius: 0, borderBottomLeftRadius: 0}}>
                  <img src={currentItem.right.image_url} style={getImageStyle(currentItem.right)} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.controls}>
          <button style={styles.controlButton} onClick={() => setCurrentIndex(c => Math.max(0, c-1))}>Prev</button>
          <button style={styles.controlButton} onClick={() => setCurrentIndex(c => Math.min(viewerItems.length-1, c+1))}>Next</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "sans-serif" },
  topBar: { display: "flex", justifyContent: "space-between", padding: "15px 20px", background: "#000", borderBottom: "1px solid #111" },
  brand: { color: "#39ff14", fontSize: "12px", fontWeight: "bold" },
  projectTitle: { fontWeight: "bold" },
  viewerWrap: { maxWidth: "1200px", margin: "0 auto" },
  counter: { textAlign: "center", padding: "10px", color: "#666" },
  stage: { background: "#0a0a0a", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center" },
  singleStage: { width: "100%", display: "flex", justifyContent: "center" },
  spreadStage: { width: "100%", display: "flex", justifyContent: "center" },
  spreadFrame: { display: "grid", gridTemplateColumns: "1fr 2px 1fr", width: "900px", height: "600px" },
  pageBox: { position: "relative" },
  fullInner: { position: "relative", width: "100%", height: "100%", background: "#111", borderRadius: "8px", overflow: "hidden", border: "1px solid #222" },
  seam: { background: "linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0))", width: "2px", zIndex: 5 },
  controls: { display: "flex", justifyContent: "center", gap: "20px", padding: "20px" },
  controlButton: { padding: "10px 25px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "8px", cursor: "pointer" }
};
