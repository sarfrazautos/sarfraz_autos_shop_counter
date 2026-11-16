import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in form data' },
        { status: 400 }
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Vercel BLOB_READ_WRITE_TOKEN is not configured' },
        { status: 500 }
      );
    }

    // Format a clean, unique file path
    const folder = (formData.get('folder') as string) || 'products';
    const rawName = file.name || 'slip.jpg';
    const sanitizedName = rawName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${folder}/${Date.now()}-${sanitizedName}`;

    const blob = await put(path, file, {
      access: 'public',
      token,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: blob.contentType,
    });
  } catch (error: any) {
    console.error('File upload to Vercel Blob failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload file to Vercel Blob',
      },
      { status: 500 }
    );
  }
}
