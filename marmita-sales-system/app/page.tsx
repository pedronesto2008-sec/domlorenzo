import { createClient } from "@/lib/supabase/server"
import Dashboard from "@/components/dashboard"

export default async function Home() {
  const supabase = await createClient()

  // Buscar dados do dia atual
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: sizes } = await supabase.from("marmita_sizes").select("*").order("price", { ascending: true })

  const { data: todaySales } = await supabase
    .from("sales")
    .select("*, marmita_sizes(*)")
    .gte("created_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString())
    .order("created_at", { ascending: false })

  const { data: deliveryPersons } = await supabase
    .from("delivery_persons")
    .select("*")
    .order("name", { ascending: true })

  let enrichedSales = todaySales || []
  if (deliveryPersons && deliveryPersons.length > 0 && todaySales) {
    const personsMap = new Map(deliveryPersons.map((p) => [p.id, p]))
    enrichedSales = todaySales.map((sale) => ({
      ...sale,
      delivery_persons: sale.delivery_person_id ? personsMap.get(sale.delivery_person_id) : null,
    }))
  }

  return <Dashboard sizes={sizes || []} initialSales={enrichedSales} initialDeliveryPersons={deliveryPersons || []} />
}
