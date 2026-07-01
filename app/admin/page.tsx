"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  Clapperboard,
  ChevronLeft,
  Download,
  Eye,
  LayoutGrid,
  Palette,
  Plus,
  Save,
  Settings,
  Shield,
  SunMoon,
  Trash2,
  Upload,
  Wand2
} from "lucide-react";
import { resolveMediaUrl, saveMediaFile } from "../media-store";

const ADMIN_STORAGE_KEY = "tee-stitches-admin-config";
const INQUIRIES_KEY = "tee-stitches-inquiries";
const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASSWORD = "tee-stitches-admin";

type ManagedPost = {
  id: string;
  kind: "video" | "photo";
  label: string;
  title: string;
  link: string;
  thumbnail?: string;
  featured?: boolean;
  media?: MediaAsset;
};

type MediaAsset = {
  id: string;
  name: string;
  type: "image" | "video" | "animation";
  url: string;
  placement:
    | "hero-main"
    | "about-portrait"
    | "gallery"
    | "collection-bridal"
    | "collection-gowns"
    | "collection-ready"
    | "collection-native"
    | "collection-runway";
  caption: string;
};

type ManagedConfig = {
  brand: {
    name: string;
    shortName: string;
    tagline: string;
    location: string;
    email: string;
    tiktokUrl: string;
    about: string;
  };
  booking: {
    whatsapp: string;
    consultationTypes: string[];
    requireDeposit: boolean;
    deliveryAreas: string;
  };
  security: {
    username: string;
    password: string;
  };
  animation: {
    intensity: "minimal" | "cinematic" | "runway";
    loader: boolean;
    cursor: boolean;
    fabricScene: boolean;
  };
  posts: ManagedPost[];
  mediaAssets: MediaAsset[];
};

type Inquiry = {
  type: string;
  name: string;
  date: string;
  notes: string;
  createdAt: string;
};

type AdminPageKey = "overview" | "brand" | "animation" | "posts" | "media" | "booking" | "inquiries" | "security" | "notes";
type ThemeMode = "dark" | "light";

const defaultConfig: ManagedConfig = {
  brand: {
    name: "Tee Stitches of Bida",
    shortName: "Tee Stitches",
    tagline: "Crafting elegance beyond fabric.",
    location: "Bida, Niger State",
    email: "hello@teestitches.example",
    tiktokUrl: "https://www.tiktok.com/@temi_tee03",
    about:
      "Tee Stitches of Bida is a modern fashion atelier shaped by precision, femininity, and the intimate ritual of fittings. From bridal consultations to native styles and statement gowns, every piece is treated like a personal runway moment."
  },
  booking: {
    whatsapp: "2348000000000",
    consultationTypes: ["Bridal consultation", "Measurement request", "Private fitting"],
    requireDeposit: false,
    deliveryAreas: "Bida, Niger State, nationwide delivery on request"
  },
  security: {
    username: DEFAULT_ADMIN_USER,
    password: DEFAULT_ADMIN_PASSWORD
  },
  animation: {
    intensity: "cinematic",
    loader: true,
    cursor: true,
    fabricScene: true
  },
  mediaAssets: [],
  posts: []
};

function mergeConfig(config: Partial<ManagedConfig>): ManagedConfig {
  return {
    ...defaultConfig,
    ...config,
    brand: { ...defaultConfig.brand, ...config.brand },
    booking: { ...defaultConfig.booking, ...config.booking },
    security: { ...defaultConfig.security, ...config.security },
    animation: { ...defaultConfig.animation, ...config.animation },
    posts: Array.isArray(config.posts) ? config.posts : defaultConfig.posts,
    mediaAssets: config.mediaAssets?.length ? config.mediaAssets : []
  };
}

function extractTikTokId(value: string) {
  return value.match(/(?:video|photo)\/(\d+)/)?.[1] ?? value.match(/(\d{15,})/)?.[1] ?? "";
}

function confirmAction(message: string) {
  return window.confirm(message);
}

function dataUrlToBlob(dataUrl: string) {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
  const bytes = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

async function migrateAsset(asset: MediaAsset) {
  if (!asset.url.startsWith("data:")) return asset;

  const id = `${Date.now()}-${crypto.randomUUID()}-${asset.name}`;
  await saveMediaFile(id, new File([dataUrlToBlob(asset.url)], asset.name));
  return { ...asset, id, url: `idb:${id}` };
}

async function migrateMediaConfig(config: ManagedConfig) {
  return {
    ...config,
    posts: await Promise.all(config.posts.map(async (post) => ({
      ...post,
      media: post.media ? await migrateAsset(post.media) : undefined
    }))),
    mediaAssets: await Promise.all(config.mediaAssets.map(migrateAsset))
  };
}

function AdminMediaPreview({ asset, alt }: { asset: MediaAsset; alt: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let objectUrl = "";
    resolveMediaUrl(asset.url).then((resolved) => {
      objectUrl = resolved.startsWith("blob:") ? resolved : "";
      setSrc(resolved);
    });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset.url]);

  if (!src) return <div className="post-preview-empty">Media loading</div>;

  return asset.type === "video" || asset.type === "animation" ? (
    <video src={src} muted loop autoPlay playsInline />
  ) : (
    <img src={src} alt={alt} />
  );
}

export default function AdminPage() {
  const [config, setConfig] = useState<ManagedConfig>(defaultConfig);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [savedAt, setSavedAt] = useState<string>("");
  const [activePanel, setActivePanel] = useState<AdminPageKey>("overview");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [cloudStatus, setCloudStatus] = useState("Local browser mode");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; detail?: string; tone?: "success" | "error" | "info" }>>([]);
  const consultationText = useMemo(() => config.booking.consultationTypes.join(", "), [config.booking.consultationTypes]);
  const overviewMetrics = useMemo(() => [
    { label: "Posts", value: String(config.posts.length), detail: "Published showcase entries" },
    { label: "Media files", value: String(config.mediaAssets.length), detail: "Uploaded assets in library" },
    { label: "Leads", value: String(inquiries.length), detail: "Local booking inquiries" },
    { label: "Security", value: config.security?.username || "set", detail: "Dashboard login username" }
  ], [config.posts.length, config.mediaAssets.length, inquiries.length, config.security?.username]);

  const pushToast = (title: string, detail?: string, tone: "success" | "error" | "info" = "info") => {
    const id = `${Date.now()}-${crypto.randomUUID()}`;
    setToasts((current) => [...current, { id, title, detail, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  };

  useEffect(() => {
    const loadConfig = async () => {
      let localConfig: ManagedConfig | null = null;
      try {
      const saved = window.localStorage.getItem(ADMIN_STORAGE_KEY);
        if (saved) {
          localConfig = mergeConfig(JSON.parse(saved));
          setConfig(localConfig);
        }
      setInquiries(JSON.parse(window.localStorage.getItem(INQUIRIES_KEY) ?? "[]"));
    } catch {
      setConfig(defaultConfig);
    }

      try {
        const response = await fetch("/api/site-config", { cache: "no-store" });
        if (!response.ok) {
          setCloudStatus(localConfig ? "Using laptop draft. Publish to Cloudinary to share it." : "No cloud config published yet.");
          return;
        }
        const cloudConfig = mergeConfig(await response.json());
        setConfig(cloudConfig);
        window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(cloudConfig));
        setCloudStatus("Cloudinary config loaded. Changes can sync across devices.");
      } catch {
        setCloudStatus(localConfig ? "Cloud config unavailable. Using laptop draft." : "Cloud config unavailable.");
      }
    };

    loadConfig();

    const loadSession = async () => {
      try {
        const response = await fetch("/api/admin/session", { credentials: "include", cache: "no-store" });
        if (response.ok) {
          const data = await response.json() as { ok?: boolean };
          setIsAuthed(Boolean(data.ok));
        } else {
          setIsAuthed(false);
        }
      } catch {
        setIsAuthed(false);
      }
    };

    loadSession();
  }, []);

  const updateBrand = (key: keyof ManagedConfig["brand"], value: string) => {
    setConfig((current) => ({ ...current, brand: { ...current.brand, [key]: value } }));
  };

  const updateBooking = (key: keyof ManagedConfig["booking"], value: string | boolean | string[]) => {
    setConfig((current) => ({ ...current, booking: { ...current.booking, [key]: value } }));
  };

  const updateSecurity = (key: keyof ManagedConfig["security"], value: string) => {
    setConfig((current) => ({ ...current, security: { ...current.security, [key]: value } }));
  };

  const updatePost = (index: number, key: keyof ManagedPost, value: string | boolean | MediaAsset | undefined) => {
    setConfig((current) => {
      const posts = current.posts.map((post, postIndex) => {
        if (key === "featured") return { ...post, featured: postIndex === index ? Boolean(value) : false };
        if (key === "link" && postIndex === index && typeof value === "string") {
          return { ...post, link: value, id: extractTikTokId(value) || post.id };
        }
        return postIndex === index ? { ...post, [key]: value } : post;
      });
      return { ...current, posts };
    });
  };

  const deletePost = (index: number) => {
    if (!confirmAction("Delete this post? This removes it from the public site after saving.")) return;
    setConfig((current) => {
      const posts = current.posts.filter((_, postIndex) => postIndex !== index);
      return {
        ...current,
        posts: posts.some((post) => post.featured) ? posts : posts.map((post, postIndex) => ({ ...post, featured: postIndex === 0 }))
      };
    });
    pushToast("Post removed", "Delete is pending until you save changes.", "info");
  };

  const addPost = () => {
    setConfig((current) => ({
      ...current,
      posts: [
        ...current.posts,
        {
          id: "",
          kind: "video",
          label: "",
          title: "",
          link: ""
        }
      ]
    }));
  };

  const publishConfig = async (nextConfig: ManagedConfig) => {
    const response = await fetch("/api/admin/config", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextConfig)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  };

  const save = async () => {
    setIsPublishing(true);
    try {
      const storageSafeConfig = await migrateMediaConfig(config);
      setConfig(storageSafeConfig);
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(storageSafeConfig));
      await publishConfig(storageSafeConfig);
      setSavedAt(new Date().toLocaleTimeString());
      setCloudStatus("Published online. Phones and laptops will load these changes.");
      pushToast("Published", "Changes are live across devices.", "success");
    } catch {
      window.alert("The settings were saved on this laptop, but could not publish online. Check Cloudinary/Vercel environment settings.");
      setCloudStatus("Cloud publish failed. Laptop draft is still saved locally.");
      pushToast("Publish failed", "Saved locally, but the online publish did not finish.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const reset = () => {
    if (!confirmAction("Reset the site configuration to the original defaults?")) return;
    setConfig(defaultConfig);
    window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(defaultConfig));
    setSavedAt(new Date().toLocaleTimeString());
    pushToast("Reset complete", "The default dashboard state is restored locally.", "info");
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tee-stitches-site-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const login = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void (async () => {
      try {
        const response = await fetch("/api/admin/session", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword })
        });
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          setAuthError(error?.error ?? "Incorrect username or password.");
          pushToast("Login failed", error?.error ?? "Check the credentials and try again.", "error");
          return;
        }
        setIsAuthed(true);
        setAuthError("");
        pushToast("Logged in", "Welcome back to the dashboard.", "success");
      } catch {
        setAuthError("Login failed. Check the network and try again.");
        pushToast("Login failed", "Check the network and try again.", "error");
      }
    })();
  };

  const logout = () => {
    void fetch("/api/admin/session", { method: "DELETE", credentials: "include" });
    setIsAuthed(false);
    pushToast("Locked", "Admin session cleared.", "info");
  };

  const uploadFileToCloudinary = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      credentials: "include",
      body
    });

    if (!response.ok) throw new Error(await response.text());
    return await response.json() as Pick<MediaAsset, "id" | "name" | "type" | "url">;
  };

  const fileToMediaAsset = async (file: File) => {
    const mime = file.type;
    const id = `${Date.now()}-${crypto.randomUUID()}-${file.name}`;
    try {
      const uploaded = await uploadFileToCloudinary(file);
      return {
        ...uploaded,
        placement: "gallery",
        caption: uploaded.name.replace(/\.[^.]+$/, "")
      } satisfies MediaAsset;
    } catch {
      await saveMediaFile(id, file);
    }

    return {
      id,
      name: file.name,
      type: mime.startsWith("video/") ? "video" : mime.includes("gif") ? "animation" : "image",
      url: `idb:${id}`,
      placement: "gallery",
      caption: file.name.replace(/\.[^.]+$/, "")
    } satisfies MediaAsset;
  };

  const uploadMedia = async (files: FileList | null) => {
    if (!files?.length) return;
    const uploaded = await Promise.all(Array.from(files).map(fileToMediaAsset));
    setConfig((current) => ({ ...current, mediaAssets: [...uploaded, ...current.mediaAssets] }));
    pushToast("Upload complete", `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} added to the library.`, "success");
  };

  const uploadPostMedia = async (index: number, files: FileList | null) => {
    if (!files?.length) return;
    const media = await fileToMediaAsset(files[0]);
    updatePost(index, "media", media);
  };

  const assignLibraryMediaToPost = (index: number, asset: MediaAsset) => {
    updatePost(index, "media", asset);
    pushToast("Media selected", `${asset.caption || asset.name} attached to the post.`, "success");
  };

  const cloudifyAsset = async (asset: MediaAsset) => {
    if (!asset.url.startsWith("idb:") && !asset.url.startsWith("data:")) return asset;

    const resolved = asset.url.startsWith("data:") ? asset.url : await resolveMediaUrl(asset.url);
    if (!resolved) return asset;

    const blob = asset.url.startsWith("data:") ? dataUrlToBlob(asset.url) : await fetch(resolved).then((response) => response.blob());
    const uploaded = await uploadFileToCloudinary(new File([blob], asset.name, { type: blob.type || "application/octet-stream" }));
    return {
      ...asset,
      ...uploaded,
      caption: asset.caption || uploaded.name.replace(/\.[^.]+$/, "")
    } satisfies MediaAsset;
  };

  const migrateLocalUploadsToCloud = async () => {
    setIsMigrating(true);
    try {
      const cloudConfig = {
        ...config,
        posts: await Promise.all(config.posts.map(async (post) => ({
          ...post,
          media: post.media ? await cloudifyAsset(post.media) : undefined
        }))),
        mediaAssets: await Promise.all(config.mediaAssets.map(cloudifyAsset))
      };
      setConfig(cloudConfig);
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(cloudConfig));
      await publishConfig(cloudConfig);
      setSavedAt(new Date().toLocaleTimeString());
      setCloudStatus("Migration complete. Existing laptop uploads are now online.");
      pushToast("Migration complete", "Local laptop uploads were published online.", "success");
    } catch {
      window.alert("Migration failed. Check the Cloudinary environment settings, then try again from this laptop.");
      setCloudStatus("Migration failed before all uploads moved online.");
      pushToast("Migration failed", "Nothing was lost locally, but the cloud publish stopped.", "error");
    } finally {
      setIsMigrating(false);
    }
  };

  const updateAsset = (index: number, key: keyof MediaAsset, value: string) => {
    setConfig((current) => ({
      ...current,
      mediaAssets: current.mediaAssets.map((asset, assetIndex) =>
        assetIndex === index ? { ...asset, [key]: value } : asset
      )
    }));
  };

  if (!isAuthed) {
    return (
      <main className="admin-login">
        <form className="admin-login-card" onSubmit={login}>
          <h1>Admin Login</h1>
          <label>
            Username
            <input value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} placeholder="Username" autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Password" autoComplete="current-password" />
          </label>
          {authError && <p className="admin-error">{authError}</p>}
          <button className="primary-button" type="submit">Login</button>
        </form>
      </main>
    );
  }

  return (
    <main className={`admin-shell theme-${theme} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="admin-sidebar-head">
          <a className="brand-mark" href="/">Tee Stitches</a>
          <button type="button" className="sidebar-toggle" onClick={() => setSidebarCollapsed((current) => !current)} aria-label="Toggle sidebar">
            {sidebarCollapsed ? <LayoutGrid size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <div className="admin-nav">
          <button type="button" className={activePanel === "overview" ? "active" : ""} onClick={() => setActivePanel("overview")}><LayoutGrid size={16} /> Overview</button>
          <button type="button" className={activePanel === "brand" ? "active" : ""} onClick={() => setActivePanel("brand")}><Palette size={16} /> Brand</button>
          <button type="button" className={activePanel === "posts" ? "active" : ""} onClick={() => setActivePanel("posts")}><Clapperboard size={16} /> Posts</button>
          <button type="button" className={activePanel === "media" ? "active" : ""} onClick={() => setActivePanel("media")}><Upload size={16} /> Media</button>
          <button type="button" className={activePanel === "animation" ? "active" : ""} onClick={() => setActivePanel("animation")}><Wand2 size={16} /> Animations</button>
          <button type="button" className={activePanel === "booking" ? "active" : ""} onClick={() => setActivePanel("booking")}><CalendarDays size={16} /> Booking</button>
          <button type="button" className={activePanel === "inquiries" ? "active" : ""} onClick={() => setActivePanel("inquiries")}><Activity size={16} /> Inquiries</button>
          <button type="button" className={activePanel === "security" ? "active" : ""} onClick={() => setActivePanel("security")}><Shield size={16} /> Security</button>
          <button type="button" className={activePanel === "notes" ? "active" : ""} onClick={() => setActivePanel("notes")}><Settings size={16} /> Backups</button>
        </div>
        <div className="admin-nav admin-nav-bottom">
          <a href="/"><Eye size={16} /> View site</a>
          <button type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}><SunMoon size={16} /> {theme} theme</button>
        </div>
      </aside>

      <section className="admin-main" data-admin-page={activePanel}>
        <div className="toast-stack" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <div className={`toast toast-${toast.tone ?? "info"}`} key={toast.id}>
              <strong>{toast.title}</strong>
              {toast.detail && <span>{toast.detail}</span>}
            </div>
          ))}
        </div>
        <div className="admin-hero">
          <p className="eyebrow">Private fashion house control room</p>
          <h1>Manage the brand from a clean, visual control room.</h1>
          <div className="admin-actions">
            <button type="button" className="primary-button" onClick={save} disabled={isPublishing}><Save size={18} /> {isPublishing ? "Publishing..." : "Save changes"}</button>
            <button type="button" className="secondary-button" onClick={exportConfig}><Download size={18} /> Download backup</button>
            <button type="button" className="secondary-button" onClick={migrateLocalUploadsToCloud} disabled={isMigrating}><Upload size={18} /> {isMigrating ? "Migrating..." : "Migrate uploads"}</button>
            <button type="button" className="secondary-button" onClick={logout}><Shield size={18} /> Lock admin</button>
          </div>
          <p className="admin-empty">{cloudStatus}</p>
          {savedAt && <p className="admin-saved"><Check size={16} /> Saved at {savedAt}. Refresh the public site to see changes.</p>}
        </div>

        {activePanel === "overview" && <section className="admin-panel admin-page-panel admin-overview">
          <div className="admin-panel-head">
            <LayoutGrid size={18} />
            <h2>Overview</h2>
          </div>
          <div className="overview-grid">
            {overviewMetrics.map((item) => (
              <article className="overview-card" key={item.label}>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <span>{item.detail}</span>
              </article>
            ))}
          </div>
          <div className="overview-grid two-up">
            <article className="admin-panel overview-card wide">
              <p>Recent inquiries</p>
              {inquiries.length ? inquiries.slice(0, 3).map((inquiry) => (
                <div className="mini-row" key={inquiry.createdAt}>
                  <strong>{inquiry.name}</strong>
                  <span>{inquiry.type}</span>
                </div>
              )) : <span>No inquiries yet.</span>}
            </article>
            <article className="admin-panel overview-card wide">
              <p>Quick actions</p>
              <div className="mini-actions">
                <button type="button" className="secondary-button" onClick={() => setActivePanel("posts")}><Clapperboard size={16} /> Manage posts</button>
                <button type="button" className="secondary-button" onClick={() => setActivePanel("media")}><Upload size={16} /> Open media library</button>
                <button type="button" className="secondary-button" onClick={() => setActivePanel("security")}><Shield size={16} /> Security settings</button>
              </div>
            </article>
          </div>
        </section>}

        {(activePanel === "brand" || activePanel === "animation") && <div className="admin-grid admin-page-group settings-pages">
          {activePanel === "brand" && <section id="brand" className="admin-panel">
            <div className="admin-panel-head">
              <Palette size={18} />
              <h2>Brand Settings</h2>
            </div>
            <label>Designer name<input value={config.brand.name} onChange={(event) => updateBrand("name", event.target.value)} /></label>
            <label>Short logo name<input value={config.brand.shortName} onChange={(event) => updateBrand("shortName", event.target.value)} /></label>
            <label>Tagline<input value={config.brand.tagline} onChange={(event) => updateBrand("tagline", event.target.value)} /></label>
            <label>About story<textarea rows={5} value={config.brand.about} onChange={(event) => updateBrand("about", event.target.value)} /></label>
            <div className="two-col">
              <label>Email<input value={config.brand.email} onChange={(event) => updateBrand("email", event.target.value)} /></label>
              <label>Location<input value={config.brand.location} onChange={(event) => updateBrand("location", event.target.value)} /></label>
            </div>
            <label>TikTok profile<input value={config.brand.tiktokUrl} onChange={(event) => updateBrand("tiktokUrl", event.target.value)} /></label>
          </section>}

          {activePanel === "animation" && <section id="animation" className="admin-panel">
            <div className="admin-panel-head">
              <Wand2 size={18} />
              <h2>Animation Controls</h2>
            </div>
            <label>Motion intensity
              <select value={config.animation.intensity} onChange={(event) => setConfig((current) => ({ ...current, animation: { ...current.animation, intensity: event.target.value as ManagedConfig["animation"]["intensity"] } }))}>
                <option value="minimal">Minimal</option>
                <option value="cinematic">Cinematic</option>
                <option value="runway">Runway</option>
              </select>
            </label>
            {(["loader", "cursor", "fabricScene"] as const).map((key) => (
              <label className="admin-toggle" key={key}>
                <input
                  type="checkbox"
                  checked={config.animation[key]}
                  onChange={(event) => setConfig((current) => ({ ...current, animation: { ...current.animation, [key]: event.target.checked } }))}
                />
                <span>{key === "fabricScene" ? "3D fabric scene" : key}</span>
              </label>
            ))}
            <div className="admin-note"><Shield size={16} /> Use minimal mode for weaker phones, runway mode for campaign launches.</div>
          </section>}
        </div>}

        {activePanel === "posts" && <section id="posts" className="admin-panel wide admin-page-panel">
          <div className="admin-panel-head">
            <Clapperboard size={18} />
            <h2>Showcase Posts</h2>
          </div>
          <div className="post-manager">
            {config.posts.map((post, index) => (
              <article className="post-row" key={`${post.id}-${index}`}>
                <div className="post-preview">
                  {post.media ? (
                    <AdminMediaPreview asset={post.media} alt={post.media.caption || post.title} />
                  ) : post.id ? (
                    <iframe src={`https://www.tiktok.com/embed/v2/${post.id}`} title={post.title} loading="lazy" />
                  ) : (
                    <div className="post-preview-empty">Upload media or add a TikTok ID.</div>
                  )}
                </div>
                <div className="post-fields">
                  <div className="two-col">
                    <label>Title<input value={post.title} onChange={(event) => updatePost(index, "title", event.target.value)} /></label>
                    <label>Label<input value={post.label} onChange={(event) => updatePost(index, "label", event.target.value)} /></label>
                  </div>
                  <label>Link<input value={post.link} onChange={(event) => updatePost(index, "link", event.target.value)} placeholder="Optional TikTok link" /></label>
                  <label className="admin-toggle">
                    <input type="checkbox" checked={Boolean(post.featured)} onChange={(event) => updatePost(index, "featured", event.target.checked)} />
                    <span>Main hero showcase</span>
                  </label>
                  <div className="media-picker-panel">
                    <div className="media-picker-head">
                      <span>Choose from library</span>
                      <button type="button" className="secondary-button small-button" onClick={() => updatePost(index, "media", undefined)}>Clear media</button>
                    </div>
                    <div className="media-picker-grid">
                      {config.mediaAssets.length ? config.mediaAssets.slice(0, 8).map((asset) => (
                        <button
                          type="button"
                          key={asset.id}
                          className={`media-choice ${post.media?.id === asset.id ? "selected" : ""}`}
                          onClick={() => assignLibraryMediaToPost(index, asset)}
                        >
                          <span className="media-choice-preview">
                            <AdminMediaPreview asset={asset} alt={asset.caption || asset.name} />
                          </span>
                          <strong>{asset.caption || asset.name}</strong>
                          <span>{asset.placement}</span>
                        </button>
                      )) : <p className="admin-empty">Upload media in the Media tab first, then attach it here.</p>}
                    </div>
                  </div>
                  <div className="post-media-tools">
                    <label className="upload-box post-upload">
                      <Upload size={20} />
                      {post.media ? "Replace post media" : "Upload media for this post"}
                      <input type="file" accept="image/*,video/*,.gif,.webp" onChange={(event) => uploadPostMedia(index, event.target.files)} />
                    </label>
                    {post.media && (
                      <button type="button" className="secondary-button" onClick={() => confirmAction("Remove media from this post?") && updatePost(index, "media", undefined)}>
                        <Trash2 size={18} /> Remove media
                      </button>
                    )}
                    <button type="button" className="secondary-button danger-button" onClick={() => deletePost(index)}>
                      <Trash2 size={18} /> Delete post
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="admin-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={addPost}
            >
              <Plus size={18} /> Add post
            </button>
          </div>
        </section>}

        {activePanel === "media" && <section id="media" className="admin-panel wide admin-page-panel">
          <div className="admin-panel-head">
            <Upload size={18} />
            <h2>Media Library</h2>
          </div>
          <div className="admin-note"><Upload size={16} /> Upload files once, then assign them to posts, hero, gallery, or collection sections.</div>
          <label className="upload-box admin-upload">
            <Upload size={24} />
            Upload JPG, PNG, MP4, GIF, WebP or animation files
            <input type="file" accept="image/*,video/*,.gif,.webp" multiple onChange={(event) => uploadMedia(event.target.files)} />
          </label>
          <div className="asset-grid">
            {config.mediaAssets.length === 0 ? (
              <p className="admin-empty">No uploaded media yet.</p>
            ) : (
              config.mediaAssets.map((asset, index) => (
                <article className="asset-card" key={asset.id}>
                  <div className="asset-preview">
                    <AdminMediaPreview asset={asset} alt={asset.caption || asset.name} />
                  </div>
                  <label>Caption<input value={asset.caption} onChange={(event) => updateAsset(index, "caption", event.target.value)} /></label>
                  <label>Display location
                    <select value={asset.placement} onChange={(event) => updateAsset(index, "placement", event.target.value)}>
                      <option value="hero-main">Hero main showcase</option>
                      <option value="about-portrait">About designer visual</option>
                      <option value="gallery">Gallery wall</option>
                      <option value="collection-bridal">Collection: Bridal</option>
                      <option value="collection-gowns">Collection: Luxury gowns</option>
                      <option value="collection-ready">Collection: Ready-to-wear</option>
                      <option value="collection-native">Collection: Native styles</option>
                      <option value="collection-runway">Collection: Runway</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => confirmAction("Remove this uploaded media item?") && setConfig((current) => ({
                      ...current,
                      mediaAssets: current.mediaAssets.filter((_, assetIndex) => assetIndex !== index)
                    }))}
                  >
                    <Trash2 size={18} /> Remove
                  </button>
                </article>
              ))
            )}
          </div>
        </section>}

        {(activePanel === "booking" || activePanel === "inquiries") && <div className="admin-grid admin-page-group booking-pages">
          {activePanel === "booking" && <section id="booking" className="admin-panel">
            <div className="admin-panel-head">
              <CalendarDays size={18} />
              <h2>Booking System</h2>
            </div>
            <label>WhatsApp number<input value={config.booking.whatsapp} onChange={(event) => updateBooking("whatsapp", event.target.value)} /></label>
            <label>Consultation types<input value={consultationText} onChange={(event) => updateBooking("consultationTypes", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label>
            <label>Delivery coverage<textarea rows={3} value={config.booking.deliveryAreas} onChange={(event) => updateBooking("deliveryAreas", event.target.value)} /></label>
            <label className="admin-toggle">
              <input type="checkbox" checked={config.booking.requireDeposit} onChange={(event) => updateBooking("requireDeposit", event.target.checked)} />
              <span>Require deposit before production</span>
            </label>
          </section>}

          {activePanel === "inquiries" && <section id="inquiries" className="admin-panel">
            <div className="admin-panel-head">
              <Activity size={18} />
              <h2>Bookings & Leads</h2>
            </div>
            {inquiries.length === 0 ? (
              <p className="admin-empty">No local booking submissions yet. New public form submissions will appear here.</p>
            ) : (
              <div className="inquiry-list">
                {inquiries.map((inquiry, index) => (
                  <article className="inquiry-card" key={`${inquiry.createdAt}-${index}`}>
                    <strong>{inquiry.name}</strong>
                    <span>{inquiry.type} / {inquiry.date}</span>
                    <p>{inquiry.notes}</p>
                  </article>
                ))}
              </div>
            )}
            <button type="button" className="secondary-button" onClick={() => { if (!confirmAction("Clear all local booking leads?")) return; window.localStorage.removeItem(INQUIRIES_KEY); setInquiries([]); }}>
              <Trash2 size={18} /> Clear local leads
            </button>
          </section>}
        </div>}

        {activePanel === "security" && <section id="security" className="admin-panel wide admin-page-panel">
          <div className="admin-panel-head">
            <Shield size={18} />
            <h2>Security</h2>
          </div>
          <div className="two-col">
            <label>Username<input value={config.security.username} onChange={(event) => updateSecurity("username", event.target.value)} /></label>
            <label>Password<input type="password" value={config.security.password} onChange={(event) => updateSecurity("password", event.target.value)} /></label>
          </div>
          <p className="admin-empty">These credentials control the login form. Save changes to publish the updated admin login.</p>
        </section>}

        {activePanel === "notes" && <section id="notes" className="admin-panel wide admin-page-panel">
          <div className="admin-panel-head">
            <Upload size={18} />
            <h2>Production Notes</h2>
          </div>
          <p className="admin-empty">
            For all-device publishing, set the Cloudinary environment variables in Vercel, then use Save changes or Migrate laptop uploads from this laptop.
          </p>
          <button type="button" className="secondary-button" onClick={exportConfig}><Download size={18} /> Download backup</button>
        </section>}
      </section>
    </main>
  );
}
