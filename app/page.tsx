"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import * as THREE from "three";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  SunMoon,
  Upload,
  Wand2
} from "lucide-react";
import { resolveMediaUrl } from "./media-store";

const ADMIN_STORAGE_KEY = "tee-stitches-admin-config";
const WHATSAPP_NUMBER = "2348000000000";

const tiktokPosts = [
  {
    id: "7642702852510534933",
    kind: "video",
    label: "Mixed brand showcase",
    title: "Beauty in brown",
    link: "https://www.tiktok.com/@temi_tee03/video/7642702852510534933",
    thumbnail:
      "https://p16-common-sign.tiktokcdn.com/tos-alisg-p-0037/osYIcPqoDGVIeorQseLAAoIIjAskDqleIMCUWK~tplv-tiktokx-origin.image?dr=14575&x-expires=1780138800&x-signature=bKO3u7%2FW1PdE3M0sB%2FoRCvcif4k%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my"
  },
  {
    id: "7636080979165203732",
    kind: "photo",
    label: "Photo story",
    title: "Finished Look Detail",
    link: "https://www.tiktok.com/@temi_tee03/photo/7636080979165203732",
    thumbnail: ""
  },
  {
    id: "7627426239627660564",
    kind: "video",
    label: "Client work",
    title: "My little princess loved her dress",
    link: "https://www.tiktok.com/@temi_tee03/video/7627426239627660564",
    thumbnail:
      "https://p16-common-sign.tiktokcdn.com/tos-alisg-p-0037/o0gEl2DvrFGcABcempr3Rdgt9EILfBQDQaD8hb~tplv-tiktokx-origin.image?dr=14575&x-expires=1780138800&x-signature=mkTypQN2hKggVPD9oXadUuTkyzc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my"
  },
  {
    id: "7626725229380783381",
    kind: "video",
    label: "Native elegance",
    title: "A work of art",
    link: "https://www.tiktok.com/@temi_tee03/video/7626725229380783381",
    thumbnail:
      "https://p19-common-sign.tiktokcdn.com/tos-alisg-p-0037/owGEqf5vug3RD1DQPhtEAOBUJB1FQIf3pBG3Nu~tplv-tiktokx-origin.image?dr=14575&x-expires=1780138800&x-signature=BSogbC1NHOs3rCHZjcOvEX8Rmkk%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my"
  },
  {
    id: "7622414664437157140",
    kind: "video",
    label: "Fitting room",
    title: "The latest bride in town",
    link: "https://www.tiktok.com/@temi_tee03/video/7622414664437157140",
    thumbnail:
      "https://p16-common-sign.tiktokcdn.com/tos-alisg-p-0037/okxHx1CfEEn22jyBDQpEIDcByI40cbpfgArFbR~tplv-tiktokx-origin.image?dr=14575&x-expires=1780138800&x-signature=ptq2bK2MtiEB%2Feo5j9bIptXdJM8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my"
  },
  {
    id: "7622566952350878996",
    kind: "video",
    label: "Transformation",
    title: "Bride reception dress",
    link: "https://www.tiktok.com/@temi_tee03/video/7622566952350878996",
    thumbnail:
      "https://p16-common-sign.tiktokcdn.com/tos-alisg-p-0037/o4wKxIXpBzniailEj2YA1UIWIIbBlb5AczBFP~tplv-tiktokx-origin.image?dr=14575&x-expires=1780138800&x-signature=zOwBKzZIQrdJ91KSkrRXqEUaqkY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my"
  },
  {
    id: "7611800793661951253",
    kind: "video",
    label: "Main showcase",
    title: "Something light for the culture",
    link: "https://www.tiktok.com/@temi_tee03/video/7611800793661951253",
    thumbnail:
      "https://p16-common-sign.tiktokcdn.com/tos-alisg-p-0037/o441Rf0jrIftIjiDITRAKTGZLxeCACIMmIli1A~tplv-tiktokx-origin.image?dr=14575&x-expires=1780138800&x-signature=NAfjipajW9%2BlXI1LX8JOKeljIgo%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
    featured: true
  }
] as const;

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

const defaultManagedConfig: ManagedConfig = {
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
    whatsapp: WHATSAPP_NUMBER,
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
  posts: tiktokPosts.map((post) => ({ ...post })),
  mediaAssets: []
};

const collections = [
  {
    name: "Bridal",
    mood: "Ceremonial fittings, soft structure, and entrance-ready detail.",
    post: tiktokPosts[0]
  },
  {
    name: "Luxury gowns",
    mood: "Gown work shown through real Tee Stitches TikTok moments.",
    post: tiktokPosts[2]
  },
  {
    name: "Ready-to-wear",
    mood: "Wearable polish, measured finish, and practical elegance.",
    post: tiktokPosts[4]
  },
  {
    name: "Native styles",
    mood: "Bida elegance, celebratory cuts, rooted detail.",
    post: tiktokPosts[3]
  },
  {
    name: "Runway collection",
    mood: "The main brand film as the final spotlight showcase.",
    post: tiktokPosts[6]
  }
];

const looks = [
  { title: "The Bida Pearl", category: "Bridal couture", fabric: "Real TikTok atelier showcase", post: tiktokPosts[0] },
  { title: "Champagne Curve", category: "Luxury gown", fabric: "Client-ready fashion work", post: tiktokPosts[2] },
  { title: "After-Dusk Native", category: "Native style", fabric: "Bida signature finish", post: tiktokPosts[3] },
  { title: "Soft Power", category: "Ready-to-wear", fabric: "Measured and styled", post: tiktokPosts[4] }
];

const tracker = ["Order Received", "Design Started", "Sewing in Progress", "Ready for Delivery", "Delivered"];
type ThemeMode = "dark" | "light";

function FabricScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(6, 3.6, 64, 32);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#d5b176"),
      roughness: 0.42,
      metalness: 0.24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.42
    });
    const cloth = new THREE.Mesh(geometry, material);
    cloth.rotation.x = -0.18;
    scene.add(cloth);

    const key = new THREE.PointLight("#ffe2ad", 3.2, 9);
    key.position.set(2, 2, 3);
    scene.add(key);
    scene.add(new THREE.AmbientLight("#f6d6bd", 0.7));

    const original = geometry.attributes.position.array.slice() as Float32Array;
    let frame = 0;

    const animate = () => {
      frame += 0.012;
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = original[i];
        const y = original[i + 1];
        positions[i + 2] = Math.sin(x * 1.4 + frame) * 0.18 + Math.cos(y * 2.1 + frame * 1.4) * 0.08;
      }
      geometry.attributes.position.needsUpdate = true;
      cloth.rotation.z = Math.sin(frame * 0.5) * 0.04;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fabric-scene" aria-hidden="true" />;
}

function IntroLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-8%" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            className="loader-line"
          />
          <p>Tee Stitches of Bida</p>
          <span>Atelier loading</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LuxuryCursor({ enabled }: { enabled: boolean }) {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const move = (event: PointerEvent) => {
      gsap.to(cursor.current, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.45,
        ease: "power3.out"
      });
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  if (!enabled) return null;

  return <div ref={cursor} className="luxury-cursor" />;
}

function TikTokEmbed({
  post,
  title,
  compact = false
}: {
  post: ManagedPost;
  title?: string;
  compact?: boolean;
}) {
  if (!post.id) {
    return <div className={compact ? "empty-showcase compact" : "empty-showcase"}>Media coming soon</div>;
  }

  return (
    <iframe
      className={compact ? "tiktok-embed-frame compact" : "tiktok-embed-frame"}
      src={`https://www.tiktok.com/embed/v2/${post.id}`}
      title={title ?? post.title}
      loading="lazy"
      allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture"
    />
  );
}

function MediaDisplay({
  asset,
  fallback,
  title,
  compact = false
}: {
  asset?: MediaAsset;
  fallback?: ManagedPost;
  title: string;
  compact?: boolean;
}) {
  const media = asset ?? fallback?.media;
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!media) {
      setSrc("");
      return;
    }

    let objectUrl = "";
    resolveMediaUrl(media.url).then((resolved) => {
      objectUrl = resolved.startsWith("blob:") ? resolved : "";
      setSrc(resolved);
    });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media?.url]);

  if (!media) {
    return fallback ? <TikTokEmbed post={fallback} title={title} compact={compact} /> : <div className={compact ? "empty-showcase compact" : "empty-showcase"}>Media coming soon</div>;
  }

  if (!src) return <div className={compact ? "empty-showcase compact" : "empty-showcase"}>Media loading</div>;

  return (
    <div className={compact ? "managed-media compact" : "managed-media"}>
      {media.type === "video" || media.type === "animation" ? (
        <video src={src} autoPlay loop muted playsInline controls={!compact} />
      ) : (
        <img src={src} alt={media.caption || media.name} />
      )}
      {(media.caption || media.name) && <span>{media.caption || media.name}</span>}
    </div>
  );
}

function BookingForm({ booking }: { booking: ManagedConfig["booking"] }) {
  const [bookingType, setBookingType] = useState(booking.consultationTypes[0] ?? "Bridal consultation");

  const submitBooking = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = `Hello Tee Stitches, I want to book ${bookingType}. Name: ${form.get("name")}. Date: ${form.get("date")}. Notes: ${form.get("notes")}`;
    const inquiry = {
      type: bookingType,
      name: form.get("name"),
      date: form.get("date"),
      notes: form.get("notes"),
      createdAt: new Date().toISOString()
    };
    const existing = JSON.parse(window.localStorage.getItem("tee-stitches-inquiries") ?? "[]");
    window.localStorage.setItem("tee-stitches-inquiries", JSON.stringify([inquiry, ...existing].slice(0, 50)));
    window.open(`https://wa.me/${booking.whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <form className="glass-panel booking-form" onSubmit={submitBooking}>
      <div className="form-tabs" role="tablist" aria-label="Booking type">
        {booking.consultationTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={bookingType === type ? "active" : ""}
            onClick={() => setBookingType(type)}
          >
            {type}
          </button>
        ))}
      </div>
      <label>
        Name
        <input name="name" placeholder="Your full name" required />
      </label>
      <label>
        Preferred date
        <input name="date" type="date" required />
      </label>
      <label>
        Appointment notes
        <textarea name="notes" placeholder="Occasion, outfit idea, deadline, and location" rows={4} />
      </label>
      <button className="primary-button" type="submit">
        <MessageCircle size={18} />
        Book on WhatsApp
      </button>
    </form>
  );
}

function OrderForm({ categories }: { categories: string[] }) {
  return (
    <form className="glass-panel order-form">
      <label className="upload-box">
        <Upload size={22} />
        Upload inspiration photos
        <input type="file" accept="image/*" multiple />
      </label>
      <div className="two-col">
        <label>
          Outfit category
          <select defaultValue="Luxury gowns">
            {categories.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Fabric preference
          <select defaultValue="Lace and satin">
            <option>Lace and satin</option>
            <option>Aso-oke</option>
            <option>Organza</option>
            <option>Crepe</option>
            <option>Designer recommendation</option>
          </select>
        </label>
      </div>
      <label>
        Measurements
        <textarea placeholder="Bust, waist, hips, shoulder, sleeve, length..." rows={4} />
      </label>
      <label>
        Delivery location
        <input placeholder="City, state, delivery preference" />
      </label>
      <div className="tracker">
        {tracker.map((step, index) => (
          <div className="tracker-step" key={step}>
            <span>{index < 2 ? <Check size={14} /> : index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
      <button className="secondary-button" type="button">
        <Wand2 size={18} />
        Preview order journey
      </button>
    </form>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [activeCollection, setActiveCollection] = useState<{
    name: string;
    mood: string;
    post?: ManagedPost;
  } | null>(null);
  const [managedConfig, setManagedConfig] = useState<ManagedConfig>(defaultManagedConfig);
  const heroRef = useRef<HTMLElement>(null);
  const lookbookRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);
  const managedPosts = managedConfig.posts;
  const mainPost = managedPosts.find((post) => post.featured) ?? managedPosts[0];
  const fallbackPost = mainPost;
  const managedCollections = collections.map((item, index) => ({
    ...item,
    post: managedPosts[index]
  }));
  const managedLooks = looks.map((look, index) => ({
    ...look,
    post: managedPosts[index]
  }));
  useEffect(() => {
    const loadConfig = () => {
      try {
        const saved = window.localStorage.getItem(ADMIN_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ManagedConfig;
          setManagedConfig({
            ...defaultManagedConfig,
            ...parsed,
            brand: { ...defaultManagedConfig.brand, ...parsed.brand },
            booking: { ...defaultManagedConfig.booking, ...parsed.booking },
            animation: { ...defaultManagedConfig.animation, ...parsed.animation },
            posts: Array.isArray(parsed.posts) ? parsed.posts : defaultManagedConfig.posts,
            mediaAssets: parsed.mediaAssets?.length ? parsed.mediaAssets : []
          });
        }
      } catch {
        setManagedConfig(defaultManagedConfig);
      }
    };
    loadConfig();
    window.addEventListener("storage", loadConfig);
    return () => window.removeEventListener("storage", loadConfig);
  }, []);

  const assetFor = (placement: MediaAsset["placement"]) =>
    managedConfig.mediaAssets.find((asset) => asset.placement === placement);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.8 });
    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    const reveals = gsap.utils.toArray<HTMLElement>(".reveal");
    reveals.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 80, opacity: 0, filter: "blur(12px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 84%" }
        }
      );
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <main className={`motion-${managedConfig.animation.intensity} theme-${theme}`}>
      {managedConfig.animation.loader && <IntroLoader />}
      <LuxuryCursor enabled={managedConfig.animation.cursor} />
      <nav className="top-nav">
        <a href="#home" className="brand-mark">{managedConfig.brand.shortName}</a>
        <div>
          <a href="#collections">Collections</a>
          <a href="#lookbook">Lookbook</a>
          <a href="#gallery">Gallery</a>
          <a href="#booking">Book</a>
          <a href="/admin">Admin</a>
          <button className="theme-toggle" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label="Switch theme">
            <SunMoon size={16} />
            {theme}
          </button>
        </div>
      </nav>

      <section id="home" ref={heroRef} className="hero">
        <motion.div className="hero-atmosphere" style={{ scale: heroScale, opacity: heroOpacity }} />
        {managedConfig.animation.fabricScene && <FabricScene />}
        <div className="hero-overlay" />
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 1.1 }}
        >
          <p className="eyebrow">Bida atelier / couture portfolio</p>
          <h1>{managedConfig.brand.name}</h1>
          <p className="tagline">{managedConfig.brand.tagline}</p>
          <div className="hero-actions">
            <a className="primary-button" href="#collections">
              View Real Work
              <ChevronRight size={18} />
            </a>
            {mainPost?.link && (
              <a className="secondary-button" href={mainPost.link} target="_blank" rel="noreferrer">
                Main Showcase
                <ArrowUpRight size={18} />
              </a>
            )}
          </div>
        </motion.div>
        <motion.div
          className="hero-showcase"
          initial={{ opacity: 0, x: 50, rotate: 3 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: 1.9, duration: 1.1, ease: "easeOut" }}
        >
          <span>Main Tee Stitches showcase</span>
          <MediaDisplay asset={assetFor("hero-main")} fallback={fallbackPost} title="Main Tee Stitches showcase" />
        </motion.div>
        <motion.a
          className="tiktok-float"
          href={managedConfig.brand.tiktokUrl}
          target="_blank"
          rel="noreferrer"
          animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          TikTok
          <ArrowUpRight size={16} />
        </motion.a>
      </section>

      <section className="about section-grid">
        <div className="reveal">
          <p className="eyebrow">About the designer</p>
          <h2>Tailoring emotion into silhouettes for women who want to be remembered softly.</h2>
        </div>
        <div className="portrait reveal">
          <MediaDisplay asset={assetFor("about-portrait")} fallback={managedPosts[1] ?? fallbackPost} title="Tee Stitches finished look detail" />
        </div>
        <div className="story reveal">
          <p>
            {managedConfig.brand.about}
          </p>
          <div className="scrolling-text" aria-hidden="true">
            <span>Bida / bridal / couture / native / fittings / elegance / </span>
            <span>Bida / bridal / couture / native / fittings / elegance / </span>
          </div>
        </div>
      </section>

      <section id="collections" className="collections">
        <div className="section-heading reveal">
          <p className="eyebrow">Featured collections</p>
          <h2>Five doors into the atelier.</h2>
        </div>
        <div className="collection-grid">
          {managedCollections.map((item, index) => (
            <motion.button
              className="collection-card reveal"
              key={item.name}
              onClick={() => setActiveCollection(item)}
              whileHover={{ y: -12, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 130, damping: 18 }}
            >
              <div className="collection-embed" aria-hidden="true">
                <MediaDisplay
                  asset={assetFor(
                    index === 0
                      ? "collection-bridal"
                      : index === 1
                        ? "collection-gowns"
                        : index === 2
                          ? "collection-ready"
                          : index === 3
                            ? "collection-native"
                            : "collection-runway"
                  )}
                  fallback={item.post}
                  title={`${item.name} Tee Stitches showcase`}
                  compact
                />
              </div>
              <span>0{index + 1}</span>
              <div>
                <h3>{item.name}</h3>
                <p>{item.mood}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section id="lookbook" ref={lookbookRef} className="lookbook">
        <div className="section-heading reveal">
          <p className="eyebrow">Interactive lookbook</p>
          <h2>Scroll like a private runway.</h2>
        </div>
        <div className="lookbook-stage">
          {managedLooks.map((look, index) => (
            <motion.article
              className="look-card reveal"
              key={look.title}
              style={{ zIndex: managedLooks.length - index }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="look-number">0{index + 1}</div>
              <div className="look-embed">
                <MediaDisplay fallback={look.post} title={`${look.title} Tee Stitches look`} compact />
              </div>
              <h3>{look.title}</h3>
              <p>{look.category}</p>
              <span>{look.fabric}</span>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="tiktok-section section-grid">
        <div className="reveal">
          <p className="eyebrow">TikTok atelier</p>
          <h2>Her actual TikTok work, curated like a luxury house reel.</h2>
          <a className="secondary-button" href={managedConfig.brand.tiktokUrl} target="_blank" rel="noreferrer">
            Watch More on TikTok
            <ArrowUpRight size={18} />
          </a>
        </div>
        {managedPosts.length > 0 ? (
          <div className="phone-stack reveal">
            {managedPosts.slice(0, 3).map((post, index) => (
              <div className="phone-card" key={`${post.id || post.title}-${index}`}>
                <MediaDisplay fallback={post} title={post.title || "Tee Stitches showcase"} compact />
                <span>{post.label || "Showcase"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel empty-content reveal">No post videos are published yet.</div>
        )}
      </section>

      <section className="transformations">
        <div className="section-heading reveal">
          <p className="eyebrow">Client transformations</p>
          <h2>From idea to entrance.</h2>
        </div>
        <div className="review-row">
          {["The fitting felt personal, calm, and luxurious.", "My bridal dress carried the room.", "She understood the fabric before I finished explaining."].map((quote, index) => (
            <div className="glass-panel review-card reveal" key={quote}>
              <Sparkles size={20} />
              <p>{quote}</p>
              <span>Client 0{index + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="booking" className="booking section-grid">
        <div className="reveal">
          <p className="eyebrow">Booking system</p>
          <h2>Reserve the private fitting moment.</h2>
          <p className="section-copy">
            Bridal consultation, measurement request, and WhatsApp handoff are designed as one polished flow.
          </p>
        </div>
        <BookingForm booking={managedConfig.booking} />
      </section>

      <section className="orders section-grid">
        <div className="reveal">
          <p className="eyebrow">Custom order system</p>
          <h2>Build the outfit brief like a digital couture dossier.</h2>
        </div>
        <OrderForm categories={managedCollections.map((item) => item.name)} />
      </section>

      <section id="gallery" className="gallery-section">
        <div className="section-heading reveal">
          <p className="eyebrow">Gallery</p>
          <h2>Actual Tee Stitches posts, framed as a digital atelier wall.</h2>
        </div>
        <div className="tiktok-gallery">
          {managedConfig.mediaAssets.filter((asset) => asset.placement === "gallery").map((asset) => (
            <motion.article className="gallery-post reveal" key={asset.id} whileHover={{ y: -8 }}>
              <div className="gallery-post-media">
                <MediaDisplay asset={asset} fallback={fallbackPost} title={asset.caption || asset.name} compact />
              </div>
              <p>Uploaded media</p>
              <h3>{asset.caption || asset.name}</h3>
            </motion.article>
          ))}
          {managedPosts.map((post, index) => (
            <motion.article className={"featured" in post ? "gallery-post reveal featured" : "gallery-post reveal"} key={`${post.id || post.title}-${index}`} whileHover={{ y: -8 }}>
              <div className="gallery-post-media">
                <MediaDisplay fallback={post} title={post.title} compact />
              </div>
              <p>{post.label}</p>
              <h3>{post.title}</h3>
              {post.link && (
                <a href={post.link} target="_blank" rel="noreferrer">
                  Open on TikTok
                  <ArrowUpRight size={16} />
                </a>
              )}
            </motion.article>
          ))}
        </div>
      </section>

      <section className="social-proof">
        <div className="stat reveal">
          <span>1.4K+</span>
          <p>TikTok followers</p>
        </div>
        <div className="stat reveal">
          <span>2K+</span>
          <p>Fashion likes</p>
        </div>
        <div className="stat reveal">
          <span>Bida</span>
          <p>Atelier location</p>
        </div>
        <div className="stat reveal">
          <span>5</span>
          <p>Signature categories</p>
        </div>
      </section>

      <footer>
        <div>
          <h2>{managedConfig.brand.name}</h2>
          <p>{managedConfig.brand.tagline}</p>
        </div>
        <div className="footer-links">
          <a href={managedConfig.brand.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a>
          <a href={`https://wa.me/${managedConfig.booking.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={`mailto:${managedConfig.brand.email}`}>{managedConfig.brand.email}</a>
          <span><MapPin size={16} /> {managedConfig.brand.location}</span>
        </div>
        <form className="newsletter">
          <input placeholder="Email for collection drops" type="email" />
          <button aria-label="Subscribe" type="button"><Send size={18} /></button>
        </form>
      </footer>

      <AnimatePresence>
        {activeCollection && (
          <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="modal-close" onClick={() => setActiveCollection(null)}>Close</button>
            <div className="modal-tiktok">
              <MediaDisplay fallback={activeCollection.post} title={`${activeCollection.name} real work showcase`} />
            </div>
            <div className="modal-caption">
              <p className="eyebrow">Real Tee Stitches work</p>
              <h2>{activeCollection.name}</h2>
              <p>{activeCollection.mood}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a className="whatsapp-cta" href={`https://wa.me/${managedConfig.booking.whatsapp}`} target="_blank" rel="noreferrer">
        <CalendarDays size={18} />
        Book fitting
      </a>
    </main>
  );
}
