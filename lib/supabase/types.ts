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
  paystack_subaccount_code: string | null
  bank_name: string | null
  bank_code: string | null
  account_number: string | null
  account_name: string | null
}

export interface Order {
  id: string
  ad_id: string | null
  buyer_id: string | null
  seller_id: string
  buyer_email: string
  buyer_phone: string | null
  buyer_name: string | null
  quantity: number
  amount_kobo: number
  seller_amount_kobo: number
  platform_fee_kobo: number
  paystack_reference: string | null
  status: 'placed' | 'pending' | 'paid' | 'failed' | 'cancelled' | 'accepted' | 'declined' | 'fulfilled'
  ad_title: string | null
  shipping_address: string | null
  shipping_state: string | null
  shipping_city: string | null
  delivery_notes: string | null
  created_at: string
  paid_at: string | null
}

export interface CustomRequest {
  id: string
  ad_id: string
  seller_id: string
  buyer_id: string | null
  buyer_name: string
  buyer_email: string
  buyer_phone: string | null
  message: string
  budget: number | null
  quantity: number | null
  status: 'open' | 'responded' | 'closed'
  created_at: string
}

export type ConversationKind = 'inquiry' | 'request' | 'order'

export interface Conversation {
  id: string
  ad_id: string | null
  buyer_id: string
  seller_id: string
  kind: ConversationKind
  reference_id: string | null
  subject: string | null
  last_message_at: string
  created_at: string
  ad?: { id: string; title: string; media: MediaItem[] } | null
  buyer?: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
  seller?: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
  last_message?: Message | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

export interface Ad {
  id: string
  user_id: string
  quantity: number | null
  accept_payments: boolean
  requires_shipping: boolean
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

type AnyRow = Record<string, any>
type LooseTable = { Row: AnyRow; Insert: AnyRow; Update: AnyRow }

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string }; Update: Partial<Profile> }
      ads: { Row: Ad; Insert: Omit<Ad, 'id' | 'created_at' | 'updated_at' | 'views' | 'featured' | 'is_boosted'>; Update: Partial<Ad> }
      credit_transactions: { Row: CreditTransaction; Insert: Omit<CreditTransaction, 'id' | 'created_at'>; Update: Partial<CreditTransaction> }
      saves: { Row: { user_id: string; ad_id: string; created_at: string }; Insert: { user_id: string; ad_id: string }; Update: never }
      ad_views: LooseTable
      comments: LooseTable
      conversations: LooseTable
      custom_requests: LooseTable
      email_verification_tokens: LooseTable
      messages: LooseTable
      orders: LooseTable
      password_reset_tokens: LooseTable
    }
    Views: Record<string, LooseTable>
    Functions: Record<string, { Args: AnyRow; Returns: any }>
    Enums: Record<string, string>
  }
}
