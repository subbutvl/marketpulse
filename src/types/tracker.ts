// Structure for global currency matrix metrics
export interface GlobalMetrics {
  usdToInr: number;
  eurToInr: number;
  bseSensex: number;
  nseNifty: number;
  lastUpdated: string;
}

// Structure for regional commodity metrics
export interface LocalMetrics {
  petrol: number;
  diesel: number;
  lpg: number;
  crudeOil: number;
  gold24k: number;
  gold22k: number; // Promoted to primary tracker asset
  silver: number;
  diamond: number;
  platinum: number;
}

export type TargetCity =
  | "Chennai"
  | "Mumbai"
  | "Delhi"
  | "Kolkata"
  | "Bengaluru";
