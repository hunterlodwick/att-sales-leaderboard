import { NextRequest } from 'next/server';
import { writeFile, readdir, mkdir } from 'fs/promises';
import path from 'path';

const AVATARS_DIR = path.join(process.cwd(), 'public', 'avatars');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rep = formData.get('rep') as string | null;

    if (!file || !rep) {
      return Response.json({ error: 'Missing file or rep name' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File must be under 2MB' }, { status: 400 });
    }

    // Ensure avatars directory exists
    await mkdir(AVATARS_DIR, { recursive: true });

    const slug = slugify(rep);
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${slug}.${ext}`;
    const filepath = path.join(AVATARS_DIR, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    return Response.json({ success: true, filename, url: `/avatars/${filename}` });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await mkdir(AVATARS_DIR, { recursive: true });
    const files = await readdir(AVATARS_DIR);
    const avatars = files
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => ({
        filename: f,
        url: `/avatars/${f}`,
        slug: f.replace(/\.(jpg|jpeg|png|webp)$/i, ''),
      }));
    return Response.json({ avatars });
  } catch {
    return Response.json({ avatars: [] });
  }
}
