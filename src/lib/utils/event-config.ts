// Event configuration for different sports

export const EVENT_TYPES = [
  { value: "running", label: "Laufen" },
  { value: "cycling", label: "Radfahren" },
  { value: "triathlon", label: "Triathlon" },
  { value: "skiing", label: "Skifahren" },
  { value: "surfing", label: "Surfen" },
  { value: "hyrox", label: "Hyrox" },
  { value: "crossfit", label: "CrossFit" },
  { value: "obstacle", label: "Obstacle Race (OCR)" },
  { value: "swimming", label: "Schwimmen" },
  { value: "other", label: "Sonstiges" },
] as const;

export const EVENT_CATEGORIES = [
  { value: "individual", label: "Einzeln" },
  { value: "singles", label: "Singles" },
  { value: "doubles", label: "Doubles (2er Team)" },
  { value: "relay", label: "Relay (4er Team)" },
  { value: "team", label: "Team" },
] as const;

export const DIVISIONS = [
  { value: "open", label: "Open" },
  { value: "pro", label: "Pro / Elite" },
  { value: "rx", label: "RX" },
  { value: "scaled", label: "Scaled" },
  { value: "masters", label: "Masters (40+)" },
  { value: "teens", label: "Teens" },
] as const;

// Hyrox Stations
export const HYROX_STATIONS = [
  "Start",
  "SkiErg",
  "Lauf 1",
  "Sled Push",
  "Lauf 2",
  "Sled Pull",
  "Lauf 3",
  "Burpee Broad Jumps",
  "Lauf 4",
  "Rowing",
  "Lauf 5",
  "Farmers Carry",
  "Lauf 6",
  "Sandbag Lunges",
  "Lauf 7",
  "Wall Balls",
  "Lauf 8",
  "Finish",
] as const;

// CrossFit Common Movements
export const CROSSFIT_MOVEMENTS = [
  "Box Jumps",
  "Burpees",
  "Clean & Jerk",
  "Deadlift",
  "Double Unders",
  "Handstand Push-Ups",
  "Kettlebell Swings",
  "Muscle-Ups",
  "Pull-Ups",
  "Rope Climbs",
  "Rowing",
  "Running",
  "Snatch",
  "Thrusters",
  "Toes-to-Bar",
  "Wall Balls",
  "Other",
] as const;

// Obstacle Race Obstacles
export const OCR_OBSTACLES = [
  "Monkey Bars",
  "Rope Climb",
  "Wall Climb",
  "Spear Throw",
  "Atlas Carry",
  "Sandbag Carry",
  "Barbed Wire Crawl",
  "Tire Flip",
  "Bucket Brigade",
  "Hercules Hoist",
  "Multi-Rig",
  "Finish Line",
  "Other",
] as const;

export function getStationsForEventType(eventType: string): readonly string[] {
  switch (eventType) {
    case "hyrox":
      return HYROX_STATIONS;
    case "crossfit":
      return CROSSFIT_MOVEMENTS;
    case "obstacle":
      return OCR_OBSTACLES;
    default:
      return ["Start", "Mitte", "Finish"] as const;
  }
}

export function supportsStations(eventType: string): boolean {
  return ["hyrox", "crossfit", "obstacle"].includes(eventType);
}

export function supportsHeats(eventType: string): boolean {
  return ["hyrox", "crossfit", "obstacle", "running"].includes(eventType);
}

export function supportsCategories(eventType: string): boolean {
  return ["hyrox", "crossfit", "obstacle"].includes(eventType);
}

