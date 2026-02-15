export interface TreeDetectionRequest {
  image: Express.Multer.File;
  label: string;
  confidence: number;
  timestamp: number;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  virtualID?: string;
  deviceId?: string;
  nonce?: string;
  counter?: number;
  signature?: string;
}

export interface TreeDetectionResponse {
  success: boolean;
  treeId: string;
  imagePath: string;
  processingTime?: number;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}
