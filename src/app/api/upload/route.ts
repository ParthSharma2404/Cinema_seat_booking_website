import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'STAFF']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'cinebook';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. If Cloudinary credentials are configured, upload to Cloudinary CDN
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const result = await uploadToCloudinary(buffer, folder);
        return NextResponse.json({
          url: result.url,
          publicId: result.publicId,
          provider: 'cloudinary',
        });
      } catch (cloudErr: any) {
        console.error('Cloudinary upload error:', cloudErr);
        // Fall back to local file storage if Cloudinary network encounters issue
      }
    }

    // 2. Fallback: Save to local public/uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      provider: 'local',
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

