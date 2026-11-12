/**
 * Fictional patient record and clinician-entry option lists for the demo.
 * Nothing here is real patient data.
 */
export const DEMO_PATIENT = {
  name: "Demo Patient A",
  mrn: "SIM-000427",
  age: 31,
  gravidaPara: "G2 P2",
  unit: "Postnatal Unit",
  bed: "Bed 04",
  deliveryType: "Spontaneous vaginal birth",
  gestation: "39+2 wk",
  placenta: "Recorded complete",
  bloodGroup: "O Rh+ (fict.)",
  allergies: "None recorded",
  /** Seconds between the fictional time of birth and session start */
  deliveryOffsetS: 160 * 60,
} as const;

export const SYMPTOMS = [
  { id: "dizzy", label: "Dizziness / faintness" },
  { id: "pallor", label: "Pallor" },
  { id: "clammy", label: "Cold / clammy skin" },
  { id: "sob", label: "Shortness of breath" },
  { id: "bleeding", label: "Heavy bleeding observed" },
  { id: "clots", label: "Passing clots" },
  { id: "pain", label: "Abdominal pain" },
  { id: "confused", label: "Confusion / agitation" },
] as const;
export type SymptomId = (typeof SYMPTOMS)[number]["id"];

/** Record-only list: no dosing or treatment guidance is given by the prototype. */
export const INTERVENTIONS = [
  "Uterine massage",
  "Oxytocin given",
  "IV access secured",
  "IV fluids started",
  "Tranexamic acid given",
  "Bladder emptied / catheter",
  "Bloods sent",
  "Senior review called",
] as const;

export const PATCH_ID = "NC-PATCH-0427";
export const IMPORT_DEVICE = "Blood loss scale (sim)";
