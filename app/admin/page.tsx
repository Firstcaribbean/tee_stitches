"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  Clapperboard,
  Download,
  Eye,
  Palette,
  Plus,
  Save,
  Settings,
  Shield,
  Trash2,
  Upload,
  Wand2
} from "lucide-react";

const ADMIN_STORAGE_KEY = "tee-stitches-admin-config";
const INQUIRIES_KEY = "tee-stitches-inquiries";
const ADMIN_SESSION_KEY = "tee-stitches-admin-session";
const ADMIN_PASSCODE = "tee-stitches-admin";

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
  animation: {
    intensity: "cinematic",
    loader: true,
    cursor: true,
    fabricScene: true
  },
  mediaAssets: [],
  posts: [
    {
      id: "7642702852510534933",
      kind: "video",
      label: "Mixed brand showcase",
      title: "Beauty in brown",
      link: "https://www.tiktok.com/@temi_tee03/video/7642702852510534933"
    },
    {
      id: "7627426239627660564",
      kind: "video",
      label: "Client work",
      title: "My little princess loved her dress",
      link: "https://www.tiktok.com/@temi_tee03/video/7627426239627660564"
    },
    {
      id: "7626725229380783381",
      kind: "video",
      label: "Native elegance",
      title: "A work of art",
      link: "https://www.tiktok.com/@temi_tee03/video/7626725229380783381"
    },
    {
      id: "7622414664437157140",
      kind: "video",
      label: "Fitting room",
      title: "The latest bride in town",
      link: "https://www.tiktok.com/@temi_tee03/video/7622414664437157140"
    },
    {
      id: "7622566952350878996",
      kind: "video",
      label: "Transformation",
      title: "Bride reception dress",
      link: "https://www.tiktok.com/@temi_tee03/video/7622566952350878996"
    },
    {
      id: "7611800793661951253",
      kind: "video",
      label: "Main showcase",
      title: "Something light for the culture",
      link: "https://www.tiktok.com/@temi_tee03/video/7611800793661951253",
      featured: true
    }
  ]
};

function mergeConfig(config: Partial<ManagedConfig>): ManagedConfig {
  return {
    ...defaultConfig,
    ...config,
    brand: { ...defaultConfig.brand, ...config.brand },
    booking: { ...defaultConfig.booking, ...config.booking },
    animation: { ...defaultConfig.animation, ...config.animation },
    posts: config.posts?.length ? config.posts : defaultConfig.posts,
    mediaAssets: config.mediaAssets?.length ? config.mediaAssets : []
  };
}

export default function AdminPage() {
  const [config, setConfig] = useState<ManagedConfig>(defaultConfig);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [savedAt, setSavedAt] = useState<string>("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const consultationText = useMemo(() => config.booking.consultationTypes.join(", "), [config.booking.consultationTypes]);

  useEffect(() => {
    setIsAuthed(window.localStorage.getItem(ADMIN_SESSION_KEY) === "active");
    try {
      const saved = window.localStorage.getItem(ADMIN_STORAGE_KEY);
      if (saved) setConfig(mergeConfig(JSON.parse(saved)));
      setInquiries(JSON.parse(window.localStorage.getItem(INQUIRIES_KEY) ?? "[]"));
    } catch {
      setConfig(defaultConfig);
    }
  }, []);

  const updateBrand = (key: keyof ManagedConfig["brand"], value: string) => {
    setConfig((current) => ({ ...current, brand: { ...current.brand, [key]: value } }));
  };

  const updateBooking = (key: keyof ManagedConfig["booking"], value: string | boolean | string[]) => {
    setConfig((current) => ({ ...current, booking: { ...current.booking, [key]: value } }));
  };

  const updatePost = (index: number, key: keyof ManagedPost, value: string | boolean | MediaAsset | undefined) => {
    setConfig((current) => {
      const posts = current.posts.map((post, postIndex) => {
        if (key === "featured") return { ...post, featured: postIndex === index ? Boolean(value) : false };
        return postIndex === index ? { ...post, [key]: value } : post;
      });
      return { ...current, posts };
    });
  };

  const deletePost = (index: number) => {
    setConfig((current) => {
      const posts = current.posts.filter((_, postIndex) => postIndex !== index);
      return {
        ...current,
        posts: posts.some((post) => post.featured) ? posts : posts.map((post, postIndex) => ({ ...post, featured: postIndex === 0 }))
      };
    });
  };

  const save = () => {
    window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(config));
    setSavedAt(new Date().toLocaleTimeString());
  };

  const reset = () => {
    setConfig(defaultConfig);
    window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(defaultConfig));
    setSavedAt(new Date().toLocaleTimeString());
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
    if (passcode === ADMIN_PASSCODE) {
      window.localStorage.setItem(ADMIN_SESSION_KEY, "active");
      setIsAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect admin passcode.");
    }
  };

  const logout = () => {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthed(false);
  };

  const fileToMediaAsset = (file: File) =>
    new Promise<MediaAsset>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const mime = file.type;
        resolve({
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          type: mime.startsWith("video/") ? "video" : mime.includes("gif") ? "animation" : "image",
          url: String(reader.result),
          placement: "gallery",
          caption: file.name.replace(/\.[^.]+$/, "")
        });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const uploadMedia = async (files: FileList | null) => {
    if (!files?.length) return;
    const uploaded = await Promise.all(Array.from(files).map(fileToMediaAsset));
    setConfig((current) => ({ ...current, mediaAssets: [...uploaded, ...current.mediaAssets] }));
  };

  const uploadPostMedia = async (index: number, files: FileList | null) => {
    if (!files?.length) return;
    const media = await fileToMediaAsset(files[0]);
    updatePost(index, "media", media);
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
          <Shield size={28} />
          <p className="eyebrow">Protected atelier dashboard</p>
          <h1>Admin access required.</h1>
          <label>
            Passcode
            <input type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} placeholder="Enter admin passcode" />
          </label>
          {authError && <p className="admin-error">{authError}</p>}
          <button className="primary-button" type="submit">Unlock dashboard</button>
          <p className="admin-empty">Default local passcode: tee-stitches-admin. Replace with real auth before production handover.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand-mark" href="/">Tee Stitches</a>
        <div className="admin-nav">
          <a href="#brand"><Palette size={16} /> Brand</a>
          <a href="#posts"><Clapperboard size={16} /> Posts</a>
          <a href="#media"><Upload size={16} /> Media</a>
          <a href="#animation"><Wand2 size={16} /> Animations</a>
          <a href="#booking"><CalendarDays size={16} /> Booking</a>
          <a href="#inquiries"><Activity size={16} /> Inquiries</a>
          <a href="/"><Eye size={16} /> View site</a>
        </div>
      </aside>

      <section className="admin-main">
        <div className="admin-hero">
          <p className="eyebrow">Private fashion house control room</p>
          <h1>Manage the brand experience without touching code.</h1>
          <div className="admin-actions">
            <button className="primary-button" onClick={save}><Save size={18} /> Save changes</button>
            <button className="secondary-button" onClick={exportConfig}><Download size={18} /> Export config</button>
            <button className="secondary-button" onClick={reset}><Settings size={18} /> Reset</button>
            <button className="secondary-button" onClick={logout}><Shield size={18} /> Lock admin</button>
          </div>
          {savedAt && <p className="admin-saved"><Check size={16} /> Saved at {savedAt}. Refresh the public site to see changes.</p>}
        </div>

        <div className="admin-grid">
          <section id="brand" className="admin-panel">
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
          </section>

          <section id="animation" className="admin-panel">
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
          </section>
        </div>

        <section id="posts" className="admin-panel wide">
          <div className="admin-panel-head">
            <Clapperboard size={18} />
            <h2>TikTok & Showcase Posts</h2>
          </div>
          <div className="post-manager">
            {config.posts.map((post, index) => (
              <article className="post-row" key={`${post.id}-${index}`}>
                <div className="post-preview">
                  {post.media ? (
                    post.media.type === "video" || post.media.type === "animation" ? (
                      <video src={post.media.url} muted loop autoPlay playsInline />
                    ) : (
                      <img src={post.media.url} alt={post.media.caption || post.title} />
                    )
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
                  <div className="two-col">
                    <label>TikTok ID<input value={post.id} onChange={(event) => updatePost(index, "id", event.target.value)} /></label>
                    <label>Link<input value={post.link} onChange={(event) => updatePost(index, "link", event.target.value)} /></label>
                  </div>
                  <label className="admin-toggle">
                    <input type="checkbox" checked={Boolean(post.featured)} onChange={(event) => updatePost(index, "featured", event.target.checked)} />
                    <span>Main hero showcase</span>
                  </label>
                  <div className="post-media-tools">
                    <label className="upload-box post-upload">
                      <Upload size={20} />
                      {post.media ? "Replace post media" : "Upload media for this post"}
                      <input type="file" accept="image/*,video/*,.gif,.webp" onChange={(event) => uploadPostMedia(index, event.target.files)} />
                    </label>
                    {post.media && (
                      <button className="secondary-button" onClick={() => updatePost(index, "media", undefined)}>
                        <Trash2 size={18} /> Remove media
                      </button>
                    )}
                    <button className="secondary-button danger-button" onClick={() => deletePost(index)}>
                      <Trash2 size={18} /> Delete post
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="admin-actions">
            <button
              className="secondary-button"
              onClick={() => setConfig((current) => ({
                ...current,
                posts: [
                  ...current.posts,
                  {
                    id: "",
                    kind: "video",
                    label: "New showcase",
                    title: "New Tee Stitches work",
                    link: ""
                  }
                ]
              }))}
            >
              <Plus size={18} /> Add post
            </button>
          </div>
        </section>

        <section id="media" className="admin-panel wide">
          <div className="admin-panel-head">
            <Upload size={18} />
            <h2>Upload Media & Choose Placement</h2>
          </div>
          <label className="upload-box admin-upload">
            <Upload size={24} />
            Upload JPG, PNG, MP4, GIF, WebP or animation files
            <input type="file" accept="image/*,video/*,.gif,.webp" multiple onChange={(event) => uploadMedia(event.target.files)} />
          </label>
          <p className="admin-empty">
            Uploaded files can replace the hero showcase, about portrait, collection visuals, or appear in the gallery. This local version stores uploads in the browser; production should move these assets to Supabase/Firebase Storage.
          </p>
          <div className="asset-grid">
            {config.mediaAssets.length === 0 ? (
              <p className="admin-empty">No uploaded media yet.</p>
            ) : (
              config.mediaAssets.map((asset, index) => (
                <article className="asset-card" key={asset.id}>
                  <div className="asset-preview">
                    {asset.type === "video" || asset.type === "animation" ? (
                      <video src={asset.url} muted loop autoPlay playsInline />
                    ) : (
                      <img src={asset.url} alt={asset.caption || asset.name} />
                    )}
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
                    className="secondary-button"
                    onClick={() => setConfig((current) => ({
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
        </section>

        <div className="admin-grid">
          <section id="booking" className="admin-panel">
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
          </section>

          <section id="inquiries" className="admin-panel">
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
            <button className="secondary-button" onClick={() => { window.localStorage.removeItem(INQUIRIES_KEY); setInquiries([]); }}>
              <Trash2 size={18} /> Clear local leads
            </button>
          </section>
        </div>

        <section className="admin-panel wide">
          <div className="admin-panel-head">
            <Upload size={18} />
            <h2>Production Notes</h2>
          </div>
          <p className="admin-empty">
            This dashboard currently stores settings in this browser for fast local management. For production, connect these same fields to Supabase or Firebase with admin authentication, media storage, and booking notifications.
          </p>
        </section>
      </section>
    </main>
  );
}
