/* ============================================================
   IRONCLAD CRM — company defaults
   Edit this file to change team, rates, and Firebase project.
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

IC.SALES_NAMES = ["Matt", "Jon", "Jesse", "Ethan"];

IC.ADMIN_EMAILS = ["nathangreen.me@gmail.com"];

IC.TEAM = [
  { id: "nate", name: "Nate", email: "nathangreen.me@gmail.com", role: "admin", title: "Admin", salesName: null, active: true, status: "active" },
  { id: "matt", name: "Matt", email: "", role: "admin", title: "Owner", salesName: "Matt", active: true, status: "active", placeholder: true },
  { id: "jon", name: "Jon", email: "", role: "sales", title: "Sales", salesName: "Jon", active: true, status: "active", placeholder: true },
  { id: "jesse", name: "Jesse", email: "", role: "sales", title: "Sales", salesName: "Jesse", active: true, status: "active", placeholder: true },
  { id: "ethan", name: "Ethan", email: "", role: "sales", title: "Sales", salesName: "Ethan", active: true, status: "active", placeholder: true },
];

IC.CREWS = [
  { id: "crew-1", name: "Crew 1", foreman: "", phone: "", notes: "Rename in Settings", active: true },
  { id: "crew-2", name: "Crew 2", foreman: "", phone: "", notes: "", active: true },
];

IC.SETTINGS = {
  legalName: "Ironclad Roofing LLC",
  dba: "IRONCLAD",
  street: "",
  city: "",
  state: "IN",
  zip: "",
  phone: "",
  email: "",
  licenseNumber: "",
  website: "",
  warrantyWorkmanshipYears: 5,
  paymentTerms:
    "Fifty percent (50%) of the contract price is due upon signing as a deposit. The remaining fifty percent (50%) is due upon substantial completion of the work.",
  laborRatePerSquare: 185,
  wastePercent: 12,
  markupPercent: 18,
  tearoffRatePerSquare: 42,
  dumpsterDefault: 425,
  permitDefault: 0,
  sheathingSheetPrice: 68,
  sheathingSqftPerSheet: 32,
  contractIntro:
    "This Residential Roofing Service Agreement (“Agreement”) is entered into by and between Ironclad Roofing LLC (“Contractor”) and the Customer named below. Contractor agrees to furnish labor, materials, and equipment to perform the work described herein at the property listed below, in a good and workmanlike manner consistent with industry standards.",
};

IC.PITCHES = ["0 - 2/12", "2/12 - 3/12", "4/12 - 7/12", "8/12 - 9/12", "10/12 - 11/12", "12/12 - 13/12"];
IC.STORIES = ["1-Story", "2-Story", "3-Story"];
IC.TEAROFF = ["None", "1-Layer", "2-Layer", "3-Layer", "4-Layer", "5-Layer"];
IC.SHEATHING = ["Wood Board", "OSB / Plywood"];
IC.ROOF_TYPES = ["Shingle", "Metal", "Flat"];
