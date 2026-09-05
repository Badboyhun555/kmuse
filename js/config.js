/* ==========================================================
   K MUSE NOVA — CONFIG
   Public/anon configuration only.
   NEVER place service-role keys here.
   ========================================================== */

const SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR_PUBLIC_ANON_KEY"
};

/* Demo / reference image URLs for the six photo slots */
const DEMO_IMAGES = {
  photo1: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
  photo2: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&q=80",
  photo3: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
  photo4: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80",
  photo5: "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=600&q=80",
  photo6: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&q=80"
};

const PHOTO_SLOTS = [
  { num: 1, title: "Profile / Headshot",     instruction: "Upload a clear front-facing photograph with your face clearly visible." },
  { num: 2, title: "Full Body",               instruction: "Upload a clear full-body photograph." },
  { num: 3, title: "Side / Profile View",     instruction: "Upload a clear side/profile photograph." },
  { num: 4, title: "Portrait",                instruction: "Upload a clean portrait photograph with simple lighting." },
  { num: 5, title: "Natural / Casual",        instruction: "Upload a natural photograph with minimal editing." },
  { num: 6, title: "Additional Portfolio Photo", instruction: "Upload another photograph that represents your style." }
];

const UPLOAD_LIMITS = {
  photoMaxMB: 5,
  videoMaxMB: 50,
  photoTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  videoTypes: ["video/mp4", "video/quicktime", "video/webm"]
};

const SESSION_KEY = "kmn_admin_session";
