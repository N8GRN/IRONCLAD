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
  base: 80,
  flatRate: 100,
  pitchAdd: {
    "Flat Roof": 0,
    "2/12 - 3.9/12": 0,
    "4/12 - 7/12": 0,
    "8/12 - 9/12": 10,
    "10/12 - 11/12": 20,
    "12/12 - 13/12": 30,
  },
  storyAdd: { "1-Story": 0, "2-Story": 10, "3-Story": 20 },
  layerAdd: { "1": 0, "2": 10, "3": 20, "4": 30, "5": 40 },
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
  var d = IC.DEFAULT_CREW_LABOR;
  var pitchSrc = laborIn.pitchAdd || {};
  var storySrc = laborIn.storyAdd || {};
  var layerSrc = laborIn.layerAdd || {};
  var pitchAdd = {};
  var storyAdd = {};
  var layerAdd = {};
  (IC.PITCHES || []).forEach(function (p) {
    pitchAdd[p] = numLabor(pitchSrc[p], d.pitchAdd[p]);
  });
  (IC.STORIES || ["1-Story", "2-Story", "3-Story"]).forEach(function (s) {
    storyAdd[s] = numLabor(storySrc[s], d.storyAdd[s]);
  });
  ["1", "2", "3", "4", "5"].forEach(function (n) {
    layerAdd[n] = numLabor(layerSrc[n], d.layerAdd[n]);
  });
  var labor = {
    base: laborIn.base == null || laborIn.base === "" ? d.base : numLabor(laborIn.base, d.base),
    flatRate: laborIn.flatRate == null || laborIn.flatRate === "" ? d.flatRate : numLabor(laborIn.flatRate, d.flatRate),
    pitchAdd: pitchAdd,
    storyAdd: storyAdd,
    layerAdd: layerAdd,
    osbPerSheet: numLabor(laborIn.osbPerSheet, d.osbPerSheet),
    woodPerBoard: numLabor(laborIn.woodPerBoard, d.woodPerBoard),
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
  sheathingLaborPerSheet: 45,
  sheathingLaborCourtesy: 3,
  woodLaborPerBoard: 25,
  woodLaborCourtesy: 3,
  salesTaxPercent: 7,
  chimneyEachPrice: 500,
  insurancePercent: 1,
  mfgWarrantyMinSq: 25,
  mfgWarrantyMaxSq: 100,
  mfgWarrantyFlat: 75,
  mfgWarrantyPerSq: 3,
  financingPlans: [],
  shingleBundlesPerSquare: 3,
  hipRidgeLfPerBundle: 28,
  starterLfPerBundle: 105,
  edgeStickFeet: 10,
  edgeWastePercent: 10,
  dripExtraSticks: 1,
  feltSquaresPerRoll: 10,
  iceLfPerRoll: 60,
  iceRollsPerLowSquare: 0.5,
  ridgeVentLfPerRoll: 30,
  stepLfPerBundle: 50,
  stepLfPerChimney: 10,
  baseSheetSquaresPerRoll: 1,
  capSheetSquaresPerRoll: 2,
  permissions: IC.clone ? IC.clone(IC.DEFAULT_PERMISSIONS) : JSON.parse(JSON.stringify(IC.DEFAULT_PERMISSIONS)),
  contractIntro:
    "This Residential Roofing Service Agreement (“Agreement”) is entered into by and between Ironclad Roofing LLC (“Contractor”) and the Customer named below. Contractor agrees to furnish labor, materials, and equipment to perform the work described herein at the property listed below, in a good and workmanlike manner consistent with industry standards.",
};

/* Customer sell rates. Same schedule as crew pay, with its own base. Flat replaces the base. */
IC.DEFAULT_LABOR_RATES = {
  base: 270,
  flatRate: 100,
  pitchAdd: {
    "Flat Roof": 0,
    "2/12 - 3.9/12": 0,
    "4/12 - 7/12": 0,
    "8/12 - 9/12": 10,
    "10/12 - 11/12": 20,
    "12/12 - 13/12": 30,
  },
  storyAdd: { "1-Story": 0, "2-Story": 10, "3-Story": 20 },
  layerAdd: { "1": 0, "2": 10, "3": 20, "4": 30, "5": 40 },
};

IC.STORIES = ["1-Story", "2-Story", "3-Story"];
IC.TEAROFF = ["None", "1-Layer", "2-Layer", "3-Layer", "4-Layer", "5-Layer"];
IC.SHEATHING = ["Wood Board", "OSB / Plywood"];
IC.ROOF_TYPES = ["Shingle", "Metal", "Flat"];
