export interface MarmitaSize {
  id: string
  name: string
  price: number
  created_at: string
}

export interface DeliveryPerson {
  id: string
  name: string
  phone: string | null
  active: boolean
  created_at: string
}

export interface CartItem {
  size: MarmitaSize
  quantity: number
}

export interface SaleItem {
  id: string
  sale_id: string
  size_id: string
  quantity: number
  unit_price: number
  subtotal: number
  marmita_sizes?: MarmitaSize
}

export interface Sale {
  id: string
  size_id: string | null // Agora opcional (legado)
  quantity: number
  unit_price: number
  total_price: number
  payment_method: "dinheiro" | "pix" | "cartao_credito" | "cartao_debito"
  delivery_type: "retirada" | "entrega"
  customer_name: string | null
  customer_phone: string | null
  delivery_address: string | null
  notes: string | null
  delivery_person_id: string | null
  delivery_persons?: DeliveryPerson
  created_at: string
  marmita_sizes?: MarmitaSize
  sale_items?: SaleItem[] // Novo campo para múltiplos itens
}

export interface DailySummary {
  totalSales: number
  totalRevenue: number
  salesBySize: { name: string; count: number; revenue: number }[]
  salesByPayment: { method: string; count: number; revenue: number }[]
  salesByDelivery: { type: string; count: number }[]
}
