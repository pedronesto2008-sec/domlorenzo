"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MarmitaSize, Sale, DailySummary, DeliveryPerson } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NewSaleForm from "./new-sale-form"
import SalesHistory from "./sales-history"
import Reports from "./reports"
import PriceSettings from "./price-settings"
import DeliveryPersons from "./delivery-persons"
import { Package, DollarSign, TrendingUp, Clock } from "lucide-react"

interface DashboardProps {
  sizes: MarmitaSize[]
  initialSales: Sale[]
  initialDeliveryPersons: DeliveryPerson[]
}

export default function Dashboard({ sizes: initialSizes, initialSales, initialDeliveryPersons }: DashboardProps) {
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [sizes, setSizes] = useState<MarmitaSize[]>(initialSizes)
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>(initialDeliveryPersons)
  const [activeTab, setActiveTab] = useState("dashboard")
  const supabase = createClient()

  // Calcular resumo do dia
  const summary: DailySummary = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((acc, sale) => acc + Number(sale.total_price), 0),
    salesBySize: sizes.map((size) => ({
      name: size.name,
      count: sales.filter((s) => s.size_id === size.id).length,
      revenue: sales.filter((s) => s.size_id === size.id).reduce((acc, s) => acc + Number(s.total_price), 0),
    })),
    salesByPayment: [
      {
        method: "Dinheiro",
        count: sales.filter((s) => s.payment_method === "dinheiro").length,
        revenue: sales
          .filter((s) => s.payment_method === "dinheiro")
          .reduce((acc, s) => acc + Number(s.total_price), 0),
      },
      {
        method: "PIX",
        count: sales.filter((s) => s.payment_method === "pix").length,
        revenue: sales.filter((s) => s.payment_method === "pix").reduce((acc, s) => acc + Number(s.total_price), 0),
      },
      {
        method: "Cartão Crédito",
        count: sales.filter((s) => s.payment_method === "cartao_credito").length,
        revenue: sales
          .filter((s) => s.payment_method === "cartao_credito")
          .reduce((acc, s) => acc + Number(s.total_price), 0),
      },
      {
        method: "Cartão Débito",
        count: sales.filter((s) => s.payment_method === "cartao_debito").length,
        revenue: sales
          .filter((s) => s.payment_method === "cartao_debito")
          .reduce((acc, s) => acc + Number(s.total_price), 0),
      },
    ].filter((p) => p.count > 0),
    salesByDelivery: [
      { type: "Retirada", count: sales.filter((s) => s.delivery_type === "retirada").length },
      { type: "Entrega", count: sales.filter((s) => s.delivery_type === "entrega").length },
    ].filter((d) => d.count > 0),
  }

  const handleNewSale = (sale: Sale) => {
    setSales([sale, ...sales])
    setActiveTab("dashboard")
  }

  const handleDeleteSale = async (saleId: string) => {
    const { error } = await supabase.from("sales").delete().eq("id", saleId)
    if (!error) {
      setSales(sales.filter((s) => s.id !== saleId))
    }
  }

  const handleUpdatePrices = (updatedSizes: MarmitaSize[]) => {
    setSizes(updatedSizes)
  }

  const handleUpdateDeliveryPersons = (updatedPersons: DeliveryPerson[]) => {
    setDeliveryPersons(updatedPersons)
  }

  const refreshSales = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: salesData } = await supabase
      .from("sales")
      .select("*, marmita_sizes(*)")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())
      .order("created_at", { ascending: false })

    if (salesData) {
      const personsMap = new Map(deliveryPersons.map((p) => [p.id, p]))
      const enrichedSales = salesData.map((sale) => ({
        ...sale,
        delivery_persons: sale.delivery_person_id ? personsMap.get(sale.delivery_person_id) : null,
      }))
      setSales(enrichedSales)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Gestão de Marmitas</h1>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
            </div>
            <Button onClick={() => setActiveTab("nova-venda")} size="lg">
              Nova Venda
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="nova-venda">Nova Venda</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="entregadores">Entregadores</TabsTrigger>
            <TabsTrigger value="precos">Preços</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Cards de resumo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Hoje</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.totalSales}</div>
                  <p className="text-xs text-muted-foreground">marmitas vendidas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R$ {summary.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">receita do dia</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    R$ {summary.totalSales > 0 ? (summary.totalRevenue / summary.totalSales).toFixed(2) : "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">por venda</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Última Venda</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {sales[0]
                      ? new Date(sales[0].created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sales[0]?.marmita_sizes?.name ? `Marmita ${sales[0].marmita_sizes.name}` : "nenhuma venda"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Vendas por tamanho */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Tamanho</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.salesBySize.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                            {item.name}
                          </div>
                          <div>
                            <p className="font-medium">{item.count} vendas</p>
                            <p className="text-sm text-muted-foreground">R$ {item.revenue.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${summary.totalSales > 0 ? (item.count / summary.totalSales) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Formas de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.salesByPayment.length > 0 ? (
                      summary.salesByPayment.map((item) => (
                        <div key={item.method} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.method}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.count} vendas - R$ {item.revenue.toFixed(2)}
                            </p>
                          </div>
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${summary.totalSales > 0 ? (item.count / summary.totalSales) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Nenhuma venda registrada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Últimas vendas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Últimas Vendas</CardTitle>
                <Button variant="outline" size="sm" onClick={refreshSales}>
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                {sales.length > 0 ? (
                  <div className="space-y-3">
                    {sales.slice(0, 5).map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                            {sale.marmita_sizes?.name || "?"}
                          </div>
                          <div>
                            <p className="font-medium">
                              Marmita {sale.marmita_sizes?.name} x{sale.quantity}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {sale.customer_name && ` • ${sale.customer_name}`}
                              {sale.delivery_persons && ` • ${sale.delivery_persons.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">R$ {Number(sale.total_price).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {sale.payment_method.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">Nenhuma venda registrada hoje</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nova-venda">
            <NewSaleForm sizes={sizes} deliveryPersons={deliveryPersons} onSaleComplete={handleNewSale} />
          </TabsContent>

          <TabsContent value="historico">
            <SalesHistory sales={sales} onDelete={handleDeleteSale} />
          </TabsContent>

          <TabsContent value="relatorios">
            <Reports />
          </TabsContent>

          <TabsContent value="entregadores">
            <DeliveryPersons deliveryPersons={deliveryPersons} onUpdate={handleUpdateDeliveryPersons} />
          </TabsContent>

          <TabsContent value="precos">
            <PriceSettings sizes={sizes} onUpdate={handleUpdatePrices} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
