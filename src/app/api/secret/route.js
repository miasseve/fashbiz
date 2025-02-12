import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import path from 'path';


export async function GET(req) {
    const client = new SecretManagerServiceClient();

  const projectId = '765757154681';  
  const secretName = '106026432736112926842'; 
  
  // Construct the secret version path
  const secretVersionPath = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    // Access the secret version
    const [version] = await client.accessSecretVersion({ name: secretVersionPath });
    
    // The secret payload (the JSON content of your secretfile.json)
    const secretPayload = version.payload.data.toString('utf8');

    // Save the secret file temporarily (or parse and use the JSON directly)
    // For example, you might want to save it to a file in your app:
    const fs = require('fs');
    const secretFilePath = path.join(__dirname, 'secretfile.json');
    fs.writeFileSync(secretFilePath, secretPayload);

    // You can now use the file or JSON for authentication with Google Vision API
    process.env.GOOGLE_APPLICATION_CREDENTIALS = secretFilePath;

  } catch (error) {
    console.error('Error accessing secret:', error);
  }
}

