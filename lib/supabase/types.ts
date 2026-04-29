export type Category = 'products' | 'services' | 'rentals' | 'business'
export type PriceType = 'fixed' | 'negotiable' | 'free' | 'per_month' | 'per_hour'
export type AdStatus = 'pending' | 'active' | 'rejected' | 'sold' | 'expired'
export type MediaType = 'image' | 'video' | 'album'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  credits: number
  phone: string | null
  location: string | null
  created_at: string
  email_verified: boolean
}

export interface Ad {
  id: string
  user_id: string
  title: string
  description: string
  category: Category
  price: number | null
  price_type: PriceType
  location: string
  contact_email: string
  contact_phone: string | null
  status: AdStatus
  views: number
  featured: boolean
  is_boosted: boolean
  boost_expires_at: string | null
  media: MediaItem[]
  tags: string[]
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface MediaItem {
  url: string
  type: 'image' | 'video'
  thumb?: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'spend' | 'refund'
  description: string
  reference: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; email: string }
        Update: Partial<Profile>
      }
      ads: {
        Row: Ad
        Insert: Omit<Ad, 'id' | 'created_at' | 'updated_at' | 'views' | 'featured' | 'is_boosted'>
        Update: Partial<Ad>
      }
      credit_transactions: {
        Row: CreditTransaction
        Insert: Omit<CreditTransaction, 'id' | 'created_at'>
        Update: Partial<CreditTransaction>
      }
      saves: {
        Row: { user_id: string; ad_id: string; created_at: string }
        Insert: { user_id: string; ad_id: string }
        Update: never
      }
    }
  }
}
