/* ============================================================
   IRONCLAD CRM — company defaults
   Edit this file to change rates and Firebase project.
   The team roster comes from Firestore `users` only — no example people.
   ============================================================ */
window.IC = window.IC || {};

IC.FIREBASE = {
  apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
  authDomain: "ironclad-127a5.firebaseapp.com",
  projectId: "ironclad-127a5",
  storageBucket: "ironclad-127a5.firebasestorage.app",
  messagingSenderId: "57257280088",
  appId: "1:57257280088:web:189e4db32d7ae28523402d",
  measurementId: "G-6RG40RW2YZ",
};

IC.VAPID =
  "BOWyxNYRhDij8-RqU4hcMxrBjbhWo9HaOkcjF5gdkfvrZ1DH-NP1-64Nur0o6uQ-5-kcQiiLlBUVL13wwXimpC4";

IC.STORE_KEY = "ironclad-crm-v1";
IC.SESSION_KEY = "ironclad-session-v1";
IC.THEME_KEY = "ironclad-theme-v1";

IC.JOB_STATUSES = [
  "Lead",
  "Follow-up",
  "Appointment",
  "Sold",
  "Did NOT Sell",
  "Job Scheduled",
  "Complete",
];

IC.ROLES = ["admin", "manager", "sales"];

/* Emails here skip the waiting room and always get Admin. */
IC.ADMIN_EMAILS = ["nathangreen.me@gmail.com"];

IC.BOOTSTRAP = {
  "nathangreen.me@gmail.com": { name: "Nate", title: "Admin" },
};

/* Legacy seed ids that used to be injected from this file. Never re-create them. */
IC.GHOST_SEED_IDS = { nate: true, matt: true, jon: true, jesse: true, ethan: true, austin: true };

/* Roster is Firestore `users`. Kept empty so example names cannot come back. */
IC.TEAM = [];

IC.CREWS = [
  { id: "crew-1", name: "Crew 1", foreman: "", phone: "", notes: "Rename in Settings", active: true },
  { id: "crew-2", name: "Crew 2", foreman: "", phone: "", notes: "", active: true },
];

IC.PITCHES = ["Flat Roof", "2/12 - 3.9/12", "4/12 - 7/12", "8/12 - 9/12", "10/12 - 11/12", "12/12 - 13/12"];

IC.DEFAULT_CREW_LABOR = {
  installPerSq: 90,
  tearoff1: 40,
  tearoff2: 50,
  tearoff3: 60,
  tearoff4: 70,
  tearoff5: 80,
  osbPerSheet: 15,
  woodPerBoard: 15,
};

IC.PERM_RESOURCES = [
  { id: "materials", label: "Materials catalog" },
  { id: "labor", label: "Labor catalog" },
  { id: "team", label: "Team" },
];

IC.DEFAULT_PERMISSIONS = {
  manager: {
    materials: { read: true, write: false },
    labor: { read: true, write: false },
    team: { read: true, write: false },
  },
  sales: {
    materials: { read: false, write: false },
    labor: { read: false, write: false },
    team: { read: false, write: false },
  },
};

IC.normalizeCrew = function (c) {
  c = c || {};
  var laborIn = c.labor || {};
  var installFallback = numLabor(laborIn.installPerSq, IC.DEFAULT_CREW_LABOR.installPerSq);
  var byPitchIn = laborIn.installByPitch || {};
  var installByPitch = {};
  (IC.PITCHES || []).forEach(function (p) {
    installByPitch[p] = numLabor(byPitchIn[p], installFallback);
  });
  var labor = {
    installPerSq: installFallback,
    installByPitch: installByPitch,
    tearoff1: numLabor(laborIn.tearoff1, IC.DEFAULT_CREW_LABOR.tearoff1),
    tearoff2: numLabor(laborIn.tearoff2, IC.DEFAULT_CREW_LABOR.tearoff2),
    tearoff3: numLabor(laborIn.tearoff3, IC.DEFAULT_CREW_LABOR.tearoff3),
    tearoff4: numLabor(laborIn.tearoff4, IC.DEFAULT_CREW_LABOR.tearoff4),
    tearoff5: numLabor(laborIn.tearoff5, IC.DEFAULT_CREW_LABOR.tearoff5),
    osbPerSheet: numLabor(laborIn.osbPerSheet, IC.DEFAULT_CREW_LABOR.osbPerSheet),
    woodPerBoard: numLabor(laborIn.woodPerBoard, IC.DEFAULT_CREW_LABOR.woodPerBoard),
  };
  return Object.assign({}, c, {
    id: c.id,
    name: c.name || "Crew",
    foreman: c.foreman || "",
    phone: c.phone || "",
    notes: c.notes || "",
    active: c.active !== false,
    labor: labor,
  });
};

function numLabor(v, fallback) {
  var n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

IC.crewLabel = function (c) {
  if (!c) return "Crew";
  return c.foreman ? (c.name + " — " + c.foreman) : c.name;
};

IC.SETTINGS = {
  legalName: "Ironclad Roofing LLC",
  dba: "IRONCLAD",
  street: "",
  city: "Albany",
  state: "IN",
  zip: "47320",
  phone: "(765) 789-0558",
  email: "",
  licenseNumber: "",
  website: "https://ironcladroofing.com",
  warrantyWorkmanshipYears: 10,
  paymentTerms:
    "Fifty percent (50%) of the contract price is due upon signing as a deposit. The remaining fifty percent (50%) is due upon substantial completion of the work.",
  laborRatePerSquare: 185,
  wastePercent: 12,
  markupPercent: 18,
  tearoffRatePerSquare: 42,
  dumpsterDefault: 425,
  permitDefault: 0,
  deliveryFeeDefault: 65,
  sheathingSheetPrice: 68,
  sheathingSqftPerSheet: 32,
  salesTaxPercent: 7,
  chimneyEachPrice: 500,
  permissions: IC.clone ? IC.clone(IC.DEFAULT_PERMISSIONS) : JSON.parse(JSON.stringify(IC.DEFAULT_PERMISSIONS)),
  contractIntro:
    "This Residential Roofing Service Agreement (“Agreement”) is entered into by and between Ironclad Roofing LLC (“Contractor”) and the Customer named below. Contractor agrees to furnish labor, materials, and equipment to perform the work described herein at the property listed below, in a good and workmanlike manner consistent with industry standards.",
};

IC.STORIES = ["1-Story", "2-Story", "3-Story"];
IC.TEAROFF = ["None", "1-Layer", "2-Layer", "3-Layer", "4-Layer", "5-Layer"];
IC.SHEATHING = ["Wood Board", "OSB / Plywood"];
IC.ROOF_TYPES = ["Shingle", "Metal", "Flat"];
