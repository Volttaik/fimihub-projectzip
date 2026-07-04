import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/ogg',
]
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50 MB)' }, { status: 400 })
    }

    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const filename = `${uuidv4()}.${ext}`
    const userDir = path.join(process.cwd(), 'public', 'uploads', user.id)
    await mkdir(userDir, { recursive: true })
    const filePath = path.join(userDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const url = `/uploads/${user.id}/${filename}`
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    return NextResponse.json({ url, type: mediaType })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
