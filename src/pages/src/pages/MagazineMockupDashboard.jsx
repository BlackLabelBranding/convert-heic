import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { supabase } from "@/lib/customSupabaseClient";

import * as Lucide from "lucide-react";
const {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  Copy,
  RefreshCcw,
  Trash2,
  Eye,
  EyeOff,
  FileImage,
  Clock3,
  AlertCircle,
  Loader2,
} = Lucide;

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const ACCENT = "#39ff14";

const PAGE_PRESETS = [
  { label: "Magazine Standard", width: 2550, height: 3300, dpi: 300 },
  { label: "US Letter Portrait", width: 2550, height: 3300, dpi: 300 },
  { label: "Square Catalog", width: 3000, height: 3000, dpi: 300 },
  { label: "Tabloid", width: 3300, height: 5100, dpi: 300 },
];

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
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

function generateToken(length = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function buildShareUrl(token) {
  if (!token) return "";
  return `${window.location.origin}/m/${token}`;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
      <div className="mx-auto mb-3 w-fit rounded-2xl border border-white/10 bg-black/20 p-3">
        <AlertCircle className="h-6 w-6 text-gray-300" />
      </div>
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-gray-400">{description}</div>
    </div>
  );
}

function LoadingPill({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-2 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

function ProjectCard({
  project,
  pageCount,
  onCopyLink,
  onTogglePublic,
  onRegenerateLink,
  onDelete,
  busy,
}) {
  const shareUrl = buildShareUrl(project.share_token);

  return (
    <Card className="rounded-2xl border border-white/10 bg-white/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="truncate text-white">{project.title}</CardTitle>
          <CardDescription className="mt-1 text-gray-400">
            Updated {relativeTime(project.updated_at || project.created_at)}
          </CardDescription>
        </div>

        <Badge className="border border-white/10 bg-white/10 text-gray-200">
          {project.status || "draft"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Pages" value={pageCount} />
          <StatTile label="Size" value={`${project.page_width}×${project.page_height}`} />
          <StatTile label="DPI" value={project.dpi || 300} />
          <StatTile label="Shared" value={project.is_public ? "Yes" : "No"} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">Public share link</div>
              <div className="mt-1 break-all text-xs text-gray-400">
                {project.is_public && shareUrl ? shareUrl : "Sharing disabled"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!project.is_public}
                onCheckedChange={(next) => onTogglePublic(project, next)}
                disabled={busy}
              />
              <span className="text-sm text-gray-300">
                {project.is_public ? "Public" : "Private"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="font-semibold text-black" style={{ background: ACCENT }}>
            <Link to={`/tools/magazine-mockup/${project.id}`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Open Editor
            </Link>
          </Button>

          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => onCopyLink(project)}
            disabled={!project.is_public || !project.share_token || busy}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>

          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => onRegenerateLink(project)}
            disabled={busy}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Regenerate Link
          </Button>

          {project.is_public && project.share_token ? (
            <Button
              asChild
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <a href={shareUrl} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Share Page
              </a>
            </Button>
          ) : null}

          <Button
            variant="outline"
            className="border-red-500/20 bg-red-500/10 text-red-100 hover:bg-red-500/20"
            onClick={() => onDelete(project)}
            disabled={busy}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs text-gray-500 md:grid-cols-3">
          <div>Created: {formatDateTime(project.created_at)}</div>
          <div>Updated: {formatDateTime(project.updated_at)}</div>
          <div>Token: {project.share_token || "—"}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MagazineMockupDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [pageCounts, setPageCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    preset: PAGE_PRESETS[0].label,
    initialPages: 8,
    coverMode: false,
  });

  const selectedPreset = useMemo(
    () => PAGE_PRESETS.find((p) => p.label === form.preset) || PAGE_PRESETS[0],
    [form.preset]
  );

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) =>
      [project.title, project.slug, project.status, project.share_token]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [projects, search]);

  const totalProjects = projects.length;
  const sharedProjects = projects.filter((p) => p.is_public).length;
  const draftProjects = projects.filter((p) => (p.status || "draft") === "draft").length;
  const totalPages = Object.values(pageCounts).reduce((sum, count) => sum + count, 0);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(currentUser);

      const { data: projectRows, error: projectError } = await supabase
        .from("mockup_projects")
        .select("*")
        .eq("owner_user_id", currentUser.id)
        .order("updated_at", { ascending: false });

      if (projectError) throw projectError;

      const projectList = projectRows || [];
      setProjects(projectList);

      if (projectList.length) {
        const projectIds = projectList.map((p) => p.id);
        const { data: pageRows, error: pageError } = await supabase
          .from("mockup_pages")
          .select("project_id")
          .in("project_id", projectIds);

        if (pageError) throw pageError;

        const counts = {};
        for (const row of pageRows || []) {
          counts[row.project_id] = (counts[row.project_id] || 0) + 1;
        }
        setPageCounts(counts);
      } else {
        setPageCounts({});
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to load magazine mockup projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function createProject() {
    if (!user) return;
    const title = form.title.trim();
    if (!title) {
      setMessage("Project title is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80);

      const { data: projectRow, error: projectError } = await supabase
        .from("mockup_projects")
        .insert({
          owner_user_id: user.id,
          title,
          slug,
          share_token: generateToken(),
          is_public: false,
          status: "draft",
          page_width: selectedPreset.width,
          page_height: selectedPreset.height,
          dpi: selectedPreset.dpi,
          cover_mode: !!form.coverMode,
          theme: "magazine",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      const totalPagesToCreate = Math.max(1, Number(form.initialPages) || 1);
      const pageRows = Array.from({ length: totalPagesToCreate }, (_, index) => ({
        project_id: projectRow.id,
        page_number: index + 1,
        page_type:
          index === 0
            ? "cover"
            : index === totalPagesToCreate - 1
              ? "back_cover"
              : "inside",
        background_color: "#ffffff",
      }));

      const { error: pageInsertError } = await supabase
        .from("mockup_pages")
        .insert(pageRows);

      if (pageInsertError) throw pageInsertError;

      navigate(`/tools/magazine-mockup/${projectRow.id}`);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to create project.");
    } finally {
      setSaving(false);
    }
  }

  async function copyShareLink(project) {
    try {
      if (!project?.share_token || !project?.is_public) return;
      await navigator.clipboard.writeText(buildShareUrl(project.share_token));
      setMessage(`Copied share link for “${project.title}”.`);
    } catch {
      setMessage("Could not copy the share link.");
    }
  }

  async function togglePublic(project, next) {
    setBusyProjectId(project.id);
    setMessage("");

    try {
      const updates = {
        is_public: !!next,
        updated_at: new Date().toISOString(),
      };

      if (next && !project.share_token) {
        updates.share_token = generateToken();
      }

      const { error } = await supabase
        .from("mockup_projects")
        .update(updates)
        .eq("id", project.id)
        .eq("owner_user_id", user.id);

      if (error) throw error;

      await loadDashboard();
      setMessage(`${next ? "Enabled" : "Disabled"} sharing for “${project.title}”.`);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to update sharing.");
    } finally {
      setBusyProjectId(null);
    }
  }

  async function regenerateLink(project) {
    setBusyProjectId(project.id);
    setMessage("");

    try {
      const newToken = generateToken();
      const { error } = await supabase
        .from("mockup_projects")
        .update({
          share_token: newToken,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)
        .eq("owner_user_id", user.id);

      if (error) throw error;

      await loadDashboard();
      await navigator.clipboard.writeText(buildShareUrl(newToken));
      setMessage(`Generated a new share link for “${project.title}”.`);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to regenerate link.");
    } finally {
      setBusyProjectId(null);
    }
  }

  async function deleteProject(project) {
    const confirmed = window.confirm(
      `Delete “${project.title}”? This will remove all pages and layers for this project.`
    );
    if (!confirmed) return;

    setBusyProjectId(project.id);
    setMessage("");

    try {
      const { error } = await supabase
        .from("mockup_projects")
        .delete()
        .eq("id", project.id)
        .eq("owner_user_id", user.id);

      if (error) throw error;

      await loadDashboard();
      setMessage(`Deleted “${project.title}”.`);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to delete project.");
    } finally {
      setBusyProjectId(null);
    }
  }

  return (
    <>
      <Helmet>
        <title>Magazine Mockup | Black Label Tools</title>
        <meta
          name="description"
          content="Create, manage, and share magazine mockup projects for Black Label Tools."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="rounded-2xl border p-3"
                style={{ borderColor: `${ACCENT}55`, background: `${ACCENT}14` }}
              >
                <BookOpen className="h-6 w-6" style={{ color: ACCENT }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white md:text-4xl">Magazine Mockup</h1>
                <p className="text-gray-400">
                  Build flipbook-style magazine previews and generate safe share links.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatTile label="Projects" value={totalProjects} hint="All mockup projects" />
          <StatTile label="Shared" value={sharedProjects} hint="Public share links enabled" />
          <StatTile label="Drafts" value={draftProjects} hint="Still being built" />
          <StatTile label="Pages" value={totalPages} hint="Across all projects" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px,1fr]">
          <Card className="rounded-2xl border border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">New Project</CardTitle>
              <CardDescription className="text-gray-400">
                Create a private magazine mockup project and jump straight into the editor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-title" className="text-gray-200">
                  Project title
                </Label>
                <Input
                  id="project-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Spring issue mockup"
                  className="border-white/10 bg-black/20 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset" className="text-gray-200">
                  Size preset
                </Label>
                <select
                  id="preset"
                  value={form.preset}
                  onChange={(e) => setForm((prev) => ({ ...prev, preset: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                >
                  {PAGE_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.label} className="bg-neutral-900">
                      {preset.label} — {preset.width} × {preset.height} @ {preset.dpi}dpi
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial-pages" className="text-gray-200">
                  Starting page count
                </Label>
                <Input
                  id="initial-pages"
                  type="number"
                  min={1}
                  max={100}
                  value={form.initialPages}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, initialPages: Number(e.target.value) || 1 }))
                  }
                  className="border-white/10 bg-black/20 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3">
                <div>
                  <div className="text-sm font-medium text-white">Enable cover mode</div>
                  <div className="text-xs text-gray-400">
                    Marks the first and last pages as cover pages.
                  </div>
                </div>
                <Switch
                  checked={form.coverMode}
                  onCheckedChange={(next) => setForm((prev) => ({ ...prev, coverMode: !!next }))}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="mb-2 font-medium text-white">Preset summary</div>
                <div className="space-y-1 text-gray-400">
                  <div>Width: {selectedPreset.width}px</div>
                  <div>Height: {selectedPreset.height}px</div>
                  <div>DPI: {selectedPreset.dpi}</div>
                </div>
              </div>

              <Button
                onClick={createProject}
                disabled={saving || loading}
                className="w-full font-semibold text-black"
                style={{ background: ACCENT }}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-2xl border border-white/10 bg-white/5">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search projects"
                      className="border-white/10 bg-black/20 pl-9 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {loading ? <LoadingPill label="Loading projects..." /> : null}
                </div>
              </CardContent>
            </Card>

            {message ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                {message}
              </div>
            ) : null}

            {loading ? null : filteredProjects.length === 0 ? (
              <EmptyState
                title="No mockup projects yet"
                description="Create your first project on the left, then start building magazine spreads."
              />
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    pageCount={pageCounts[project.id] || 0}
                    onCopyLink={copyShareLink}
                    onTogglePublic={togglePublic}
                    onRegenerateLink={regenerateLink}
                    onDelete={deleteProject}
                    busy={busyProjectId === project.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
