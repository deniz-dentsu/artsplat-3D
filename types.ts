
export interface SplatData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  count: number;
}

export interface SceneAnalysis {
  objects: {
    name: string;
    depth: number; // -100 to 100
    description: string;
    historicalContext?: string; // Deep history, artistic significance, or trivia
    boundingBox?: [number, number, number, number]; // [y_min, x_min, y_max, x_max]
  }[];
  overallAtmosphere: string;
  artisticStyle?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  VIEWING = 'VIEWING',
  ERROR = 'ERROR'
}
