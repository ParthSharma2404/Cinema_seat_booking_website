import crypto from 'crypto';

export async function uploadToCloudinary(
  fileData: string | Buffer,
  folder = 'cinebook'
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables not configured');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  // Generate Cloudinary SHA-1 signature
  // Parameter string sorted alphabetically
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  if (typeof fileData === 'string') {
    formData.append('file', fileData);
  } else {
    const blob = new Blob([new Uint8Array(fileData)]);
    formData.append('file', blob, 'upload.jpg');
  }
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', folder);
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to upload image to Cloudinary');
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}
