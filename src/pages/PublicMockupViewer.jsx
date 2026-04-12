import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/customSupabaseClient";

function buildItems(pages, isMobile) {
  if (!pages.length) return [];
  if (isMobile) {
    return pages.map(p => ({ type: "single", page: p, label: `Page ${p.page_number}` }));
  }
  const items = [{ type: "cover", page: pages[0], label: "Cover" }];
  for (let i = 1; i < pages.length; i += 2) {
    const left = pages[i];
    const right = pages[i + 1];
    if (left && right) items.push({ type: "spread", left, right, label: `${left.page_number}-${right.page_number}` });
    else if (left) items.push({ type: "single", page: left, label: `${left.page_number}` });
  }
  return items;
}

export default function PublicMockupViewer() {
  const { token } = useParams(); // Using token from /m/:token
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const touchStart = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    
    async function load() {
      // Fetch project by share_token or id depending on your setup
      // We'll try share_token first, then fallback to id
      let { data: proj } = await supabase
        .from("magazine_projects")
        .select("*")
        .eq("share_token", token)
        .single();

      if (!proj) {
        const { data: fallback } = await supabase
          .from("magazine_projects")
          .select("*")
          .eq("id", token)
          .single();
        proj = fallback;
      }

      if (proj) {
        const { data: pgs } = await supabase
          .from("magazine_pages")
          .select("*")
          .eq("project_id", proj.id)
          .order("page_number", { ascending: true });
        
        setProject(proj);
        setPages(pgs || []);
      }
      setLoading(false);
    }
    
    load();
    return () => window.removeEventListener("resize", handleResize);
  }, [token]);

  const viewerItems = useMemo(() => buildItems(pages, isMobile), [pages, isMobile]);
  const currentItem = viewerItems[currentIndex];

  const onTouchStart = (e) => (touchStart.current = e.targetTouches[0].clientX);
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart.current - touchEnd;
    if (distance > 50) setCurrentIndex(prev => Math.min(prev + 1, viewerItems.length - 1));
    if (distance < -50) setCurrentIndex(prev => Math.max(prev - 1, 0));
    touchStart.current = null;
  };

  const imgStyle = (p) => ({
    width: "100%", height: "100%", 
    objectFit: p?.image_fit === "contain" ? "contain" : "cover",
    transform: `scale(${p?.image_scale || 1})`,
    pointerEvents: "none"
  });

  if (loading) return <div style={styles.page}><div style={{padding: "50px", textAlign: "center", color: "#39ff14"}}>Loading...</div></div>;
  if (!project) return <div style={styles.page}><div style={{padding: "50px", textAlign: "center"}}>Project not found or link expired.</div></div>;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.headerLeft}>
          <img 
            src="https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/blacklabellogoog.png" 
            alt="Logo" 
            style={styles.logo} 
          />
          <div style={styles.headerTextWrapper}>
            <div style={styles.brand}>Black Label Tools</div>
            <div style={styles.title}>{project.title}</div>
          </div>
        </div>
      </div>

      <div style={styles.stage} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div style={styles.counter}>{currentIndex + 1} / {viewerItems.length}</div>
        
        <div style={styles.viewContainer}>
          {isMobile || currentItem?.type !== "spread" ? (
            <div style={{...styles.pageFrame, width: isMobile ? "92vw" : "520px", height: isMobile ? "75vh" : "720px"}}>
              <img src={(currentItem?.page || currentItem?.right)?.image_url} style={imgStyle(currentItem?.page || currentItem?.right)} />
            </div>
          ) : (
            <div style={styles.spreadFrame}>
              <div style={{...styles.pageFrame, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none'}}>
                <img src={currentItem.left.image_url} style={imgStyle(currentItem.left)} />
              </div>
              <div style={{...styles.pageFrame, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none'}}>
                <img src={currentItem.right.image_url} style={imgStyle(currentItem.right)} />
              </div>
              <div style={styles.seam} />
            </div>
          )}
        </div>

        {!isMobile && (
           <div style={styles.controls}>
             <button style={styles.btn} onClick={() => setCurrentIndex(c => Math.max(0, c - 1))}>← Prev</button>
             <button style={styles.btn} onClick={() => setCurrentIndex(c => Math.min(viewerItems.length - 1, c + 1))}>Next →</button>
           </div>
        )}
        {isMobile && <div style={styles.hint}>← Swipe to flip →</div>}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "sans-serif", overflow: "hidden" },
  topBar: { padding: "12px 20px", borderBottom: "1px solid #1a1a1a", background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center" },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logo: { height: "36px", width: "auto" },
  headerTextWrapper: { display: "flex", flexDirection: "column", justifyContent: "center" },
  brand: { color: "#39ff14", fontSize: "10px", fontWeight: "bold", letterSpacing: "1.5px", textTransform: "uppercase" },
  title: { fontSize: "16px", fontWeight: "bold", marginTop: "2px" },
  stage: { height: "calc(100vh - 75px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" },
  counter: { fontSize: "12px", color: "#444", marginBottom: "12px" },
  viewContainer: { display: "flex", justifyContent: "center", alignItems: "center", width: "100%" },
  pageFrame: { position: "relative", background: "#111", borderRadius: "10px", overflow: "hidden", border: "1px solid #1f1f1f", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" },
  spreadFrame: { position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", width: "95%", maxWidth: "1100px", height: "720px" },
  seam: { 
    position: "absolute", left: "50%", top: 0, bottom: 0, width: "40px", transform: "translateX(-50%)", zIndex: 10, pointerEvents: "none",
    background: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 48%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 52%, rgba(0,0,0,0) 100%)"
  },
  controls: { marginTop: "30px", display: "flex", gap: "20px" },
  btn: { padding: "12px 28px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  hint: { marginTop: "20px", color: "#444", fontSize: "11px", letterSpacing: "1px" }
};
