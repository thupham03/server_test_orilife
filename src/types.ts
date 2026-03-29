export interface TreeDetectionRequest {
  image_blob: Express.Multer.File;
  label: string;
  confidence: number;
  timestamp: number;
  latitude?: number;
  longitude?: number;
  nonce?: string;
  counter?: number;
  signature?: string;
  device_id?: string;
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
