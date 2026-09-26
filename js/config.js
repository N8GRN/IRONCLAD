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

IC.ROLES = ["admin", "user"];

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
  skylightEach: 500,
  satelliteEach: 150,
  antennaEach: 150,
};

/* One row per page inside each person’s card. Add a row here when a new page ships. */
IC.PERM_LEVELS = [
  { id: "read-write", label: "Read/write" },
  { id: "read-only", label: "Read-only" },
  { id: "restricted", label: "Restricted" },
];

/* Which jobs a non-admin can see. Admin is always all. Default for users is mine. */
IC.PROJECT_VISIBILITY = [
  { id: "all", label: "All projects" },
  { id: "mine", label: "My projects" },
  { id: "none", label: "None" },
];
IC.DEFAULT_PROJECT_VISIBILITY = "mine";

IC.PAGES = [
  { id: "home", label: "Home", group: "App" },
  { id: "jobs", label: "Jobs", group: "App" },
  { id: "schedule", label: "Schedule", group: "App" },
  { id: "customers", label: "Customers", group: "App" },
  { id: "notifications", label: "Alerts", group: "App" },
  { id: "financing", label: "Financing", group: "App" },
  { id: "assessment", label: "Assessment", group: "Job" },
  { id: "summary", label: "Summary", group: "Job" },
  { id: "contract", label: "Contract", group: "Job" },
  { id: "customer-quote", label: "Customer quote", group: "Job" },
  { id: "job-sheet", label: "Job Sheet", group: "Job" },
  { id: "job-cost", label: "Job cost", group: "Job" },
  { id: "settings", label: "Settings", group: "Settings" },
  { id: "company", label: "Company profile", group: "Settings" },
  { id: "defaults", label: "Estimate defaults", group: "Settings" },
  { id: "calculations", label: "Estimate calculations", group: "Settings" },
  { id: "team", label: "Team", group: "Settings" },
  { id: "crews", label: "Crews", group: "Settings" },
  { id: "labor", label: "Labor catalog", group: "Settings" },
  { id: "materials", label: "Materials catalog", group: "Settings" },
  { id: "permissions", label: "Manage permissions", group: "Settings" },
];

/* Used until an admin sets a radio for that page on that user. */
IC.DEFAULT_USER_PERMISSION = {
  home: "read-only",
  jobs: "read-only",
  schedule: "read-only",
  customers: "read-only",
  notifications: "read-only",
  financing: "restricted",
  assessment: "restricted",
  summary: "restricted",
  contract: "restricted",
  "customer-quote": "restricted",
  "job-sheet": "restricted",
  "job-cost": "restricted",
  settings: "read-only",
  company: "restricted",
  defaults: "restricted",
  calculations: "restricted",
  team: "restricted",
  crews: "restricted",
  labor: "restricted",
  materials: "restricted",
  permissions: "restricted",
};

IC.PERM_RESOURCES = IC.PAGES;
IC.DEFAULT_PERMISSIONS = {};

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
    skylightEach: numLabor(laborIn.skylightEach, d.skylightEach),
    satelliteEach: numLabor(laborIn.satelliteEach, d.satelliteEach),
    antennaEach: numLabor(laborIn.antennaEach, d.antennaEach),
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
  skylightPrice: 1700,
  satellitePrice: 500,
  antennaPrice: 500,
  skylightFlashingLf: 0,
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
  estimateWarranty:
    "Ironclad Roofing LLC warrants its workmanship on this roof replacement for {years} years from the date of completion, provided the contract is paid in full. The workmanship warranty covers defects in our installation. It does not cover acts of God, wind or hail beyond the product rating, owner neglect, or repairs made by anyone other than Ironclad.\n\nShingles and accessories also carry the manufacturer warranties below. Those warranties are issued by the manufacturer to the property owner. They are separate from our workmanship warranty, and they apply only when the product specified in this estimate includes that coverage.\n\n- Wind coverage up to 130 mph, under the manufacturer’s limited warranty.\n- UL 2218 Class 3 hail-impact resistance, where the specified shingle carries that rating.\n- 50-year non-prorated limited warranty from the shingle manufacturer.\n- 25-year algae-resistance warranty (StreakFighter, where the specified shingle includes it).",
  estimateScope:
    "The existing roof will be removed and replaced with {shingle} shingles. Drip edge and gutter apron will be replaced. Ice and water shield will be installed at the eaves, in the valleys, and where the roof meets a wall. Synthetic underlayment will cover the remaining roof. Up to {courtesy} damaged OSB sheet(s) will be replaced at no additional charge. Pipe flashings will be replaced with aluminum pipe boots, and wall counterflashing will be custom-formed from .027 aluminum.",
  mfgWarrantyText:
    "Owens Corning® TruDefinition® Duration® shingles, from Owens Corning’s published standard limited warranty. This is the manufacturer’s warranty. It is separate from Ironclad’s workmanship warranty, and it covers Owens Corning products only. The warranty in force is the one Owens Corning publishes on the date the shingles are purchased. See that document for the full terms.\n\n- Limited Lifetime coverage against manufacturing defects, for as long as the original homeowner owns the home. It may be transferred once, on Owens Corning’s transfer terms.\n- TRU PROtection® period: the first 10 years are non-prorated for manufacturing defects. Standard coverage in that period pays for materials and does not include tear-off or disposal. After 10 years, coverage is prorated and materials only.\n- Wind: 130 mph for 15 years after the shingles have thermally sealed. Coverage can be 160 mph only when Owens Corning® Total Protection Roofing System® requirements are met and starter is installed on both the eaves and the rakes.\n- StreakGuard® algae resistance: 25 years when an approved Owens Corning® hip and ridge shingle is used. Without that ridge product, algae coverage is 10 years.\n- Impact rating: UL 2218 Class 3. Owens Corning does not warranty hail damage. Hail, wind above the stated limit, and other acts of God are excluded.\n- Flashing, fasteners, pipe boots, and wood decking are not Owens Corning products and are not covered by this warranty.",
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
