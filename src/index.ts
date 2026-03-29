import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Function to generate folder name with timestamp
const generateFolderName = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

// Variable to store the current upload folder
let currentUploadFolder: string = '';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const folderName = generateFolderName();
    currentUploadFolder = path.join(uploadsDir, folderName);
    if (!fs.existsSync(currentUploadFolder)) {
      fs.mkdirSync(currentUploadFolder, { recursive: true });
    }
    cb(null, currentUploadFolder);
  },
  filename: (_req, file, cb) => {
    // Giữ nguyên extension từ file upload (PNG)
    const ext = path.extname(file.originalname) || '.png';
    const uniqueName = `image${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Logger function
const logRequest = (req: any, message: string) => {
  const logTimestamp = new Date().toISOString();
  console.log('\n' + '='.repeat(60));
  console.log(`[${logTimestamp}] ${message}`);
  console.log('='.repeat(60));

  // Log file info
  if (req.file) {
    console.log('📁 File Info:');
    console.log(`   Original Name: ${req.file.originalname}`);
    console.log(`   Saved Name: ${req.file.filename}`);
    console.log(`   Size: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`   Mimetype: ${req.file.mimetype}`);
    console.log(`   Path: ${req.file.path}`);
  }

  // Read form fields (from multipart)
  const imageId = req.body.image_id as string;
  const treeId = req.body.tree_id as string;
  const timestamp = req.body.timestamp as string;
  const latitude = req.body.latitude ? parseFloat(req.body.latitude as string) : undefined;
  const longitude = req.body.longitude ? parseFloat(req.body.longitude as string) : undefined;
  const heading = req.body.heading ? parseFloat(req.body.heading as string) : undefined;
  const pitch = req.body.pitch ? parseFloat(req.body.pitch as string) : undefined;
  const roll = req.body.roll ? parseFloat(req.body.roll as string) : undefined;
  const nonce = req.body.nonce as string;
  const signature = req.body.signature as string;
  const deviceId = req.body.device_id as string;

  // Log payload fields
  console.log('🔑 Payload Fields:');
  console.log(`   image_id: ${imageId || 'N/A'}`);
  console.log(`   tree_id: ${treeId || 'N/A'}`);
  console.log(`   timestamp: ${timestamp || 'N/A'}`);

  // Log GPS info
  if (latitude || longitude) {
    console.log('📍 GPS Info:');
    console.log(`   Latitude: ${latitude || 'N/A'}`);
    console.log(`   Longitude: ${longitude || 'N/A'}`);
  }

  // Log Orientation info
  if (heading || pitch || roll) {
    console.log('🧭 Orientation Info:');
    console.log(`   Heading: ${heading !== undefined ? heading.toFixed(1) + '°' : 'N/A'}`);
    console.log(`   Pitch: ${pitch !== undefined ? pitch.toFixed(1) + '°' : 'N/A'}`);
    console.log(`   Roll: ${roll !== undefined ? roll.toFixed(1) + '°' : 'N/A'}`);
  }

  // Log security info
  if (deviceId || nonce || signature) {
    console.log('🔒 Security Info:');
    console.log(`   Device ID: ${deviceId || 'N/A'}`);
    console.log(`   Nonce: ${nonce || 'N/A'}`);
    console.log(`   Signature: ${signature ? signature.substring(0, 20) + '...' : 'N/A'}`);
  }
};

// Main endpoint: Receive tree detection with image
// ✅ Accept cả endpoint mới + endpoint cũ để tương thích mobile đang dùng /api/v1/detect-tree
// ✅ Accept 'input_image' field name (matching Android client)
app.post(['/api/v1/detection/upload', '/api/v1/detect-tree'], upload.single('input_image'), (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    logRequest(req, '📥 Received tree detection request');

    // image_id và tree_id được gửi từ app (đã generate trên device)
    const imageId = req.body.image_id as string;
    const treeId = req.body.tree_id as string;

    // Create JSON data from request body
    const jsonData = {
      imageId: imageId,
      treeId: treeId,
      timestamp: req.body.timestamp ? parseInt(req.body.timestamp as string) : undefined,
      latitude: req.body.latitude ? parseFloat(req.body.latitude as string) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude as string) : undefined,
      accuracy: req.body.accuracy ? parseFloat(req.body.accuracy as string) : undefined,
      heading: req.body.heading ? parseFloat(req.body.heading as string) : undefined,
      pitch: req.body.pitch ? parseFloat(req.body.pitch as string) : undefined,
      roll: req.body.roll ? parseFloat(req.body.roll as string) : undefined,
      signature: req.body.signature,
      deviceId: req.body.device_id,
      nonce: req.body.nonce,
      uploadedAt: new Date().toISOString()
    };

    // Save JSON file to the same folder as the image
    const jsonFilePath = path.join(currentUploadFolder, 'metadata.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

    console.log('✅ Request processed successfully');
    console.log(`   Image ID: ${imageId}`);
    console.log(`   Tree ID: ${treeId}`);
    console.log(`   Image saved to: ${req.file.path}`);
    console.log(`   JSON saved to: ${jsonFilePath}`);
    console.log('='.repeat(60) + '\n');

    // Get folder name from path
    const folderName = path.basename(currentUploadFolder);

    // Send response
    res.json({
      success: true,
      imageId: imageId,
      treeId: treeId,
      folder: `/uploads/${folderName}`,
      imagePath: `/uploads/${folderName}/${req.file.filename}`,
      jsonPath: `/uploads/${folderName}/metadata.json`,
      message: 'Tree detection received and saved'
    });

  } catch (error: any) {
    console.error('❌ Error processing request:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  console.log('🩺 Health check');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 OriLife Backend Server Started');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📂 Uploads directory: ${uploadsDir}`);
  console.log(`📝 API Endpoints: POST http://localhost:${PORT}/api/v1/detection/upload  |  /api/v1/detect-tree`);
  console.log('='.repeat(60) + '\n');
});
