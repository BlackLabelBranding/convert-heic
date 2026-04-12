import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/customSupabaseClient";

const BUCKET = "magazine-mockups";

function getProjectIdFromUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("magazine-mockup");
  if (idx === -1) return "";
  return parts[idx + 1] || "";
}

function buildShareUrl(token) {
  if (!token) return "";
  return `${window.location.origin}/m/${token}`;
}

function generateToken(length = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

async function splitImageIntoSpread(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = dataUrl;
  });

  const width = img.width;
  const height = img.height;
  const halfWidth = Math.floor(width / 2);
  const rightWidth = width - halfWidth;

  const leftCanvas = document.createElement("canvas");
  leftCanvas.width = halfWidth;
  leftCanvas.height = height;
  const leftCtx = leftCanvas.getContext("2d");
  leftCtx.drawImage(img, 0, 0, halfWidth, height, 0, 0, halfWidth, height);

  const rightCanvas = document.createElement("canvas");
  rightCanvas.width = rightWidth;
  rightCanvas.height = height;
  const rightCtx = rightCanvas.getContext("2d");
  rightCtx.drawImage(
    img,
    halfWidth,
    0,
    rightWidth,
    height,
    0,
    0,
    rightWidth,
    height
  );

  return {
    leftBlob: dataUrlToBlob(leftCanvas.toDataURL("image/png")),
    rightBlob: dataUrlToBlob(rightCanvas.toDataURL("image/png")),
  };
}

function buildSpreadOptions(pages) {
  const sorted = [...pages].sort((a, b) => a.page_number - b.page_number);
  const spreads = [];

  for (let i = 1; i < sorted.length - 1; i += 2) {
    const left = sorted[i];
    const right = sorted[i + 1];
    if (!left || !right) continue;

    spreads.push({
      key: `${left.id}:${right.id}`,
      leftId: left.id,
      rightId: right.id,
      leftPageNumber: left.page_number,
      rightPageNumber: right.page_number,
      label: `Pages ${left.page_number}-${right.page_number}`,
    });
  }

  return spreads;
}

async function uploadFileToStorage(projectId, filename, fileOrBlob) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${projectId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, fileOrBlob, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    path,
    url: data.publicUrl,
  };
}

export default function MagazineMockupEditor() {
  const fileInputRef = useRef(null);
  const spreadInputRef = useRef(null);
  const projectId = useMemo(() => getProjectIdFromUrl(), []);

  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [selectedSpreadKey, setSelectedSpreadKey] = useState("");
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("single");
  const [loading, setLoading] = useState(true);

  async function loadProject() {
    setLoading(true);
    setMessage("");

    const { data: projectData, error: projectError } = await supabase
      .from("magazine_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      setMessage(projectError.message);
      setLoading(false);
      return;
    }

    const { data: pageData, error: pageError } = await supabase
      .from("magazine_pages")
      .select("*")
      .eq("project_id", projectId)
      .order("page_number", { ascending: true });

    if (pageError) {
      setMessage(pageError.message);
      setLoading(false);
      return;
    }

    setProject(projectData);
    setPages(pageData || []);
    setSelectedPageId(pageData?.[0]?.id || null);
    setLoading(false);
  }

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => a.page_number - b.page_number);
  }, [pages]);

  const spreadOptions = useMemo(() => buildSpreadOptions(sortedPages), [sortedPages]);

  const selectedPage = useMemo(() => {
    return sortedPages.find((p) => p.id === selectedPageId) || null;
  }, [sortedPages, selectedPageId]);

  const detectedSpread = useMemo(() => {
    if (!selectedPage || !sortedPages.length) return null;

    const index = sortedPages.findIndex((p) => p.id === selectedPage.id);
    if (index <= 0) return null;

    const leftIndex = index % 2 === 0 ? index - 1 : index;
    const rightIndex = leftIndex + 1;

    const left = sortedPages[leftIndex] || null;
    const right = sortedPages[rightIndex] || null;

    if (!left || !right) return null;

    return {
      key: `${left.id}:${right.id}`,
      leftId: left.id,
      rightId: right.id,
      leftPageNumber: left.page_number,
      rightPageNumber: right.page_number,
      label: `Pages ${left.page_number}-${right.page_number}`,
    };
  }, [selectedPage, sortedPages]);

  useEffect(() => {
    if (!spreadOptions.length) {
      setSelectedSpreadKey("");
      return;
    }

    if (detectedSpread?.key) {
      setSelectedSpreadKey(detectedSpread.key);
      return;
    }

    setSelectedSpreadKey(spreadOptions[0].key);
  }, [detectedSpread, spreadOptions]);

  const selectedSpreadOption = useMemo(() => {
    return spreadOptions.find((s) => s.key === selectedSpreadKey) || null;
  }, [spreadOptions, selectedSpreadKey]);

  const spreadPair = useMemo(() => {
    if (!selectedPage || !sortedPages.length) return { left: null, right: null };
    const index = sortedPages.findIndex((p) => p.id === selectedPage.id);
    if (index === -1) return { left: null, right: null };

    if (index === 0) {
      return { left: null, right: null };
    }

    const leftIndex = index % 2 === 0 ? index - 1 : index;
    return {
      left: sortedPages[leftIndex] || null,
      right: sortedPages[leftIndex + 1] || null,
    };
  }, [selectedPage, sortedPages]);

  async function updateProject(patch, nextMessage = "Saved.") {
    if (!project) return;

    const payload = {
      ...patch,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("magazine_projects")
      .update(payload)
      .eq("id", project.id)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setProject(data);
    setMessage(nextMessage);
  }

  async function updatePage(pageId, patch, nextMessage = "Page updated.") {
    const { error } = await supabase
      .from("magazine_pages")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadProject();
    setSelectedPageId(pageId);
    setMessage(nextMessage);
  }

  function goBack() {
    window.location.href = "/magazine-mockup";
  }

  function goDashboard() {
    window.location.href = "/magazine-mockup";
  }

  function goPreview() {
    window.location.href = `/magazine-mockup/${projectId}/preview`;
  }

  async function renameProject(value) {
    await updateProject({ title: value }, "Project title updated.");
  }

  async function addPage() {
    const nextNumber =
      Math.max(0, ...pages.map((p) => p.page_number || 0)) + 1;

    const pageType = nextNumber === 1 ? "cover" : "inside";

    const { data, error } = await supabase
      .from("magazine_pages")
      .insert({
        project_id: projectId,
        page_number: nextNumber,
        page_type: pageType,
        background_color: "#ffffff",
        image_fit: "cover",
        image_scale: 1,
        image_x: 0,
        image_y: 0,
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    await updateBackCoverAfterPageChange(nextNumber + 1);
    await loadProject();
    setSelectedPageId(data.id);
    setMessage("Page added.");
  }

  async function updateBackCoverAfterPageChange(totalPages) {
    const refreshedPages = await supabase
      .from("magazine_pages")
      .select("*")
      .eq("project_id", projectId)
      .order("page_number", { ascending: true });

    if (refreshedPages.error) return;

    const rows = refreshedPages.data || [];
    const last = rows[rows.length - 1];
    if (!last) return;

    await supabase
      .from("magazine_pages")
      .update({ page_type: "back_cover", updated_at: new Date().toISOString() })
      .eq("id", last.id);

    const others = rows.filter((p) => p.id !== last.id && p.page_type === "back_cover");
    for (const page of others) {
      await supabase
        .from("magazine_pages")
        .update({ page_type: "inside", updated_at: new Date().toISOString() })
        .eq("id", page.id);
    }
  }

  async function deleteSelectedPage() {
    if (!selectedPage) return;
    if (pages.length <= 1) {
      setMessage("A project must have at least one page.");
      return;
    }

    const confirmed = window.confirm(`Delete page ${selectedPage.page_number}?`);
    if (!confirmed) return;

    const remaining = pages
      .filter((p) => p.id !== selectedPage.id)
      .sort((a, b) => a.page_number - b.page_number);

    const { error } = await supabase
      .from("magazine_pages")
      .delete()
      .eq("id", selectedPage.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    for (let i = 0; i < remaining.length; i += 1) {
      const page = remaining[i];
      await supabase
        .from("magazine_pages")
        .update({
          page_number: i + 1,
          page_type: i === remaining.length - 1 ? "back_cover" : i === 0 ? "cover" : "inside",
          updated_at: new Date().toISOString(),
        })
        .eq("id", page.id);
    }

    await loadProject();
    setSelectedPageId(remaining[0]?.id || null);
    setMessage("Page deleted.");
  }

  async function movePage(direction) {
    if (!selectedPage) return;

    const pageList = [...pages].sort((a, b) => a.page_number - b.page_number);
    const index = pageList.findIndex((p) => p.id === selectedPage.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (index === -1 || swapIndex < 0 || swapIndex >= pageList.length) return;

    [pageList[index], pageList[swapIndex]] = [pageList[swapIndex], pageList[index]];

    for (let i = 0; i < pageList.length; i += 1) {
      const page = pageList[i];
      await supabase
        .from("magazine_pages")
        .update({
          page_number: i + 1,
          page_type: i === pageList.length - 1 ? "back_cover" : i === 0 ? "cover" : "inside",
          updated_at: new Date().toISOString(),
        })
        .eq("id", page.id);
    }

    await loadProject();
    setSelectedPageId(selectedPage.id);
    setMessage("Page order updated.");
  }

  async function duplicatePage() {
    if (!selectedPage) return;

    const pageList = [...pages].sort((a, b) => a.page_number - b.page_number);
    const index = pageList.findIndex((p) => p.id === selectedPage.id);
    if (index === -1) return;

    const newPages = [
      ...pageList.slice(0, index + 1),
      {
        ...selectedPage,
        id: undefined,
      },
      ...pageList.slice(index + 1),
    ];

    for (let i = 0; i < newPages.length; i += 1) {
      const page = newPages[i];
      if (page.id) continue;

      const { error } = await supabase.from("magazine_pages").insert({
        project_id: projectId,
        page_number: i + 1,
        page_type: "inside",
        background_color: page.background_color,
        image_path: page.image_path,
        image_url: page.image_url,
        image_name: page.image_name,
        image_fit: page.image_fit,
        image_scale: page.image_scale,
        image_x: page.image_x,
        image_y: page.image_y,
      });

      if (error) {
        setMessage(error.message);
        return;
      }
    }

    const refreshed = await supabase
      .from("magazine_pages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (refreshed.error) {
      setMessage(refreshed.error.message);
      return;
    }

    const all = refreshed.data || [];
    const sorted = [...all].sort((a, b) => a.page_number - b.page_number);

    for (let i = 0; i < sorted.length; i += 1) {
      await supabase
        .from("magazine_pages")
        .update({
          page_number: i + 1,
          page_type: i === sorted.length - 1 ? "back_cover" : i === 0 ? "cover" : "inside",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sorted[i].id);
    }

    await loadProject();
    setMessage("Page duplicated.");
  }

  function onUploadClick() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function onSpreadUploadClick() {
    if (!selectedSpreadOption) {
      setMessage("No valid spread is selected.");
      return;
    }
    if (spreadInputRef.current) spreadInputRef.current.click();
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !selectedPage) return;

    try {
      const uploaded = await uploadFileToStorage(
        projectId,
        `${selectedPage.page_number}-${file.name}`,
        file
      );

      await updatePage(
        selectedPage.id,
        {
          image_path: uploaded.path,
          image_url: uploaded.url,
          image_name: file.name,
        },
        "Image uploaded."
      );
    } catch (error) {
      setMessage(error.message || "Upload failed.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSpreadUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !selectedSpreadOption) return;

    try {
      const { leftBlob, rightBlob } = await splitImageIntoSpread(file);

      const leftUpload = await uploadFileToStorage(
        projectId,
        `${selectedSpreadOption.leftPageNumber}-${file.name}-left.png`,
        leftBlob
      );

      const rightUpload = await uploadFileToStorage(
        projectId,
        `${selectedSpreadOption.rightPageNumber}-${file.name}-right.png`,
        rightBlob
      );

      await supabase
        .from("magazine_pages")
        .update({
          image_path: leftUpload.path,
          image_url: leftUpload.url,
          image_name: `${file.name} (left)`,
          image_fit: "cover",
          image_scale: 1,
          image_x: 0,
          image_y: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedSpreadOption.leftId);

      await supabase
        .from("magazine_pages")
        .update({
          image_path: rightUpload.path,
          image_url: rightUpload.url,
          image_name: `${file.name} (right)`,
          image_fit: "cover",
          image_scale: 1,
          image_x: 0,
          image_y: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedSpreadOption.rightId);

      await loadProject();
      setSelectedPageId(selectedSpreadOption.leftId);
      setMessage(`Spread image applied to pages ${selectedSpreadOption.leftPageNumber}-${selectedSpreadOption.rightPageNumber}.`);
    } catch (error) {
      setMessage(error.message || "Failed to split spread image.");
    } finally {
      event.target.value = "";
    }
  }

  async function clearImage() {
    if (!selectedPage) return;

    await updatePage(
      selectedPage.id,
      {
        image_path: null,
        image_url: null,
        image_name: null,
        image_scale: 1,
        image_x: 0,
        image_y: 0,
      },
      "Image removed."
    );
  }

  async function setFitMode(mode) {
    if (!selectedPage) return;
    await updatePage(selectedPage.id, { image_fit: mode }, "Fit mode updated.");
  }

  async function setScale(value) {
    if (!selectedPage) return;
    await updatePage(selectedPage.id, { image_scale: Number(value) }, "Scale updated.");
  }

  async function setOffset(axis, value) {
    if (!selectedPage) return;
    const num = Number(value) || 0;
    if (axis === "x") {
      await updatePage(selectedPage.id, { image_x: num }, "Horizontal offset updated.");
    } else {
      await updatePage(selectedPage.id, { image_y: num }, "Vertical offset updated.");
    }
  }

  async function resetTransform() {
    if (!selectedPage) return;
    await updatePage(
      selectedPage.id,
      {
        image_scale: 1,
        image_x: 0,
        image_y: 0,
      },
      "Position reset."
    );
  }

  async function toggleSharing() {
    if (!project) return;
    await updateProject(
      {
        is_public: !project.is_public,
        share_token: project.share_token || generateToken(),
      },
      "Sharing updated."
    );
  }

  async function regenerateLink() {
    if (!project) return;
    const nextToken = generateToken();

    await updateProject(
      {
        share_token: nextToken,
      },
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

  function getImageStyle(page) {
    const fit = page.image_fit || "cover";
    const scale = clamp(Number(page.image_scale) || 1, 0.2, 3);
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

  function renderPage(page, mini = false) {
    if (!page) {
      return <div style={mini ? styles.miniPage : styles.pageCanvasEmpty}>No page</div>;
    }

    return (
      <div style={mini ? styles.miniPage : styles.pageCanvas}>
        <div
          style={{
            ...styles.pageInner,
            background: page.background_color || "#fff",
          }}
        >
          {page.image_url ? (
            <img src={page.image_url} alt={page.image_name || "Page asset"} style={getImageStyle(page)} />
          ) : (
            <div style={styles.noImageText}>No image on this page</div>
          )}

          <div style={styles.pageNumberBadge}>Page {page.page_number}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.centerWrap}>
          <div style={styles.notFoundCard}>Loading editor...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={styles.page}>
        <nav style={styles.nav}>
          <div style={styles.navLeft}>
            <button style={styles.backButton} onClick={goBack}>
              ← Back
            </button>
            <div style={styles.navBrand}>Magazine Mockup Editor</div>
          </div>
        </nav>

        <div style={styles.centerWrap}>
          <div style={styles.notFoundCard}>
            <h1 style={styles.notFoundTitle}>Project not found</h1>
            <p style={styles.notFoundText}>This project could not be loaded.</p>
            <button style={styles.primaryButton} onClick={goDashboard}>
              Back to Dashboard
            </button>
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
          <button style={styles.backButton} onClick={goBack}>
            ← Back
          </button>
          <div style={styles.navBrand}>Magazine Mockup Editor</div>
        </div>

        <div style={styles.navActions}>
          <button style={styles.primaryButtonSmall} onClick={goPreview}>
            Preview Flipbook
          </button>
          <button style={styles.secondaryButton} onClick={goDashboard}>
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
                  <div style={styles.pageListThumb}>{page.image_url ? "Image" : "Empty"}</div>
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

              <div style={styles.spreadInfoBox}>
                <div style={styles.spreadInfoTitle}>Spread Upload Target</div>
                <div style={styles.spreadInfoText}>
                  {selectedSpreadOption
                    ? `This upload will apply to ${selectedSpreadOption.label}.`
                    : "No valid spread is available."}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Choose spread pair</label>
                  <select
                    style={styles.input}
                    value={selectedSpreadKey}
                    onChange={(e) => setSelectedSpreadKey(e.target.value)}
                  >
                    {spreadOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.buttonCol}>
                <button style={styles.primaryButton} onClick={onUploadClick}>
                  Upload / Replace Image
                </button>

                <button
                  style={styles.secondaryButton}
                  onClick={onSpreadUploadClick}
                  disabled={!selectedSpreadOption}
                >
                  Upload One Image For {selectedSpreadOption?.label || "Spread"}
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

              <input
                ref={spreadInputRef}
                type="file"
                accept="image/*"
                onChange={handleSpreadUpload}
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
                {selectedPage ? `Editing page ${selectedPage.page_number}` : "Select a page"}
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
              <div style={styles.spreadFrame}>
                <div style={styles.spreadPage}>{renderPage(spreadPair.left)}</div>
                <div style={styles.spreadSeam} />
                <div style={styles.spreadPage}>{renderPage(spreadPair.right)}</div>
              </div>
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
    flexWrap: "wrap",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#b3b3b3",
    fontSize: "14px",
    cursor: "pointer",
    padding: 0,
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
  spreadInfoBox: {
    background: "#0b0b0b",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "14px",
  },
  spreadInfoTitle: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "6px",
  },
  spreadInfoText: {
    fontSize: "12px",
    color: "#b3b3b3",
    lineHeight: 1.5,
    marginBottom: "12px",
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
  primaryButtonSmall: {
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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "520px",
    padding: "20px",
    background: "radial-gradient(circle at center, #111 0%, #070707 100%)",
    borderRadius: "20px",
    border: "1px solid #161616",
  },
  spreadFrame: {
    width: "700px",
    maxWidth: "100%",
    height: "420px",
    display: "grid",
    gridTemplateColumns: "1fr 2px 1fr",
  },
  spreadPage: {
    width: "100%",
    height: "100%",
  },
  spreadSeam: {
    width: "2px",
    background: "linear-gradient(to right, #0f0f0f, #1e1e1e)",
    boxShadow: "0 0 12px rgba(0,0,0,0.8)",
  },
  pageCanvas: {
    width: "100%",
    maxWidth: "340px",
    height: "420px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pageCanvasEmpty: {
    width: "100%",
    maxWidth: "340px",
    height: "420px",
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
    height: "130px",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#fff",
    position: "relative",
    border: "1px solid #ddd",
  },
};
