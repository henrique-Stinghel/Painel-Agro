import { put } from '@vercel/blob';
import { isAdmin } from '../../../../lib/auth';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request) {
  if (!(await isAdmin())) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  const blobToken = process.env.ADS_BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return Response.json({ error: 'Armazenamento de imagens não configurado.' }, { status: 503 });
  const form = await request.formData();
  const file = form.get('image');
  if (!(file instanceof File) || !ALLOWED.includes(file.type) || file.size > MAX_SIZE) {
    return Response.json({ error: 'Envie JPG, PNG, WebP ou GIF com até 5 MB.' }, { status: 400 });
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const blob = await put(`anuncios/${crypto.randomUUID()}-${safeName}`, file, {
    access: 'public',
    addRandomSuffix: false,
    token: blobToken,
  });
  return Response.json({ url: blob.url });
}
