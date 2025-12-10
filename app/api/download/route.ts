import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // دانلود فایل از URL
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: response.status });
    }

    // دریافت نام فایل از URL یا از header
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'download';

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/i);
      if (match) {
        filename = match[1];
      }
    } else {
      // استخراج نام فایل از URL
      const urlParts = fileUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart) {
        filename = decodeURIComponent(lastPart.split('?')[0]);
      }
    }

    // دریافت نوع محتوا
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // دریافت محتوای فایل
    const fileBuffer = await response.arrayBuffer();

    // ارسال فایل با header های مناسب برای دانلود
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
