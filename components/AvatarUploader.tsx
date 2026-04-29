"use client"
import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { getInitials } from '@/lib/utils'

interface Props {
  userId: string
  initialUrl: string | null
  displayName: string
  size?: number
  onChange?: (url: string | null) => void
}

export default function AvatarUploader({
  userId,
  initialUrl,
  displayName,
  size = 56,
  onChange,
}: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const onFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${userId}/${uuidv4()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const newUrl = pub.publicUrl
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('id', userId)
      if (dbErr) throw dbErr
      setUrl(newUrl)
      onChange?.(newUrl)
      toast.success('Profile picture updated')
    } catch (err: any) {
      toast.error(err?.message || 'Could not upload picture')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="relative group rounded-full overflow-hidden shrink-0 ring-2 ring-border hover:ring-primary/60 transition-all"
      style={{ width: size, height: size }}
      title="Click to change profile picture"
      aria-label="Change profile picture"
    >
      {url ? (
        <Image
          src={url}
          alt={displayName}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span
          className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold"
          style={{ fontSize: size * 0.36 }}
        >
          {getInitials(displayName)}
        </span>
      )}

      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        {uploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </button>
  )
}
