import { ImageAnnotatorClient } from '@google-cloud/vision';
import secretFile from '@/lib/secretFile';
const Client = new ImageAnnotatorClient({
  // Specify the service account key file
  credentials: secretFile,
});

export default Client;