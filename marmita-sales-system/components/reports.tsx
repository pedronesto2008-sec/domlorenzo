"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Sale, MarmitaSize } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Download, TrendingUp, Package, DollarSign } from "lucide-react"

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [sales, setSales] = useState<Sale[]>([])
  const [sizes, setSizes] = useState<MarmitaSize[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const fetchReport = async () => {
    setIsLoading(true)
    try {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)

      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      const [salesResult, sizesResult] = await Promise.all([
        supabase
          .from("sales")
          .select("*, marmita_sizes(*)")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .order("created_at", { ascending: false }),
        supabase.from("marmita_sizes").select("*"),
      ])

      if (salesResult.data) setSales(salesResult.data)
      if (sizesResult.data) setSizes(sizesResult.data)
    } catch (error) {
      console.error("Erro ao buscar relatório:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.total_price), 0)
  const totalSales = sales.length
  const totalQuantity = sales.reduce((acc, sale) => acc + sale.quantity, 0)
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0

  const salesBySize = sizes.map((size) => {
    const sizeSales = sales.filter((s) => s.size_id === size.id)
    return {
      name: size.name,
      count: sizeSales.reduce((acc, s) => acc + s.quantity, 0),
      revenue: sizeSales.reduce((acc, s) => acc + Number(s.total_price), 0),
    }
  })

  const salesByPayment = [
    { method: "Dinheiro", key: "dinheiro" },
    { method: "PIX", key: "pix" },
    { method: "Cartão Crédito", key: "cartao_credito" },
    { method: "Cartão Débito", key: "cartao_debito" },
  ]
    .map((p) => {
      const methodSales = sales.filter((s) => s.payment_method === p.key)
      return {
        method: p.method,
        count: methodSales.length,
        revenue: methodSales.reduce((acc, s) => acc + Number(s.total_price), 0),
      }
    })
    .filter((p) => p.count > 0)

  const salesByDay = sales.reduce(
    (acc, sale) => {
      const date = new Date(sale.created_at).toLocaleDateString("pt-BR")
      if (!acc[date]) {
        acc[date] = { count: 0, revenue: 0 }
      }
      acc[date].count += sale.quantity
      acc[date].revenue += Number(sale.total_price)
      return acc
    },
    {} as Record<string, { count: number; revenue: number }>,
  )

  const exportCSV = () => {
    const headers = ["Data", "Hora", "Tamanho", "Qtd", "Valor", "Pagamento", "Tipo", "Cliente", "Telefone"]
    const rows = sales.map((sale) => [
      new Date(sale.created_at).toLocaleDateString("pt-BR"),
      new Date(sale.created_at).toLocaleTimeString("pt-BR"),
      sale.marmita_sizes?.name || "",
      sale.quantity,
      Number(sale.total_price).toFixed(2),
      sale.payment_method,
      sale.delivery_type,
      sale.customer_name || "",
      sale.customer_phone || "",
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-marmitas-${startDate}-${endDate}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Período do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Data Inicial</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Data Final</Label>
              <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={fetchReport} disabled={isLoading}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isLoading ? "Carregando..." : "Gerar Relatório"}
            </Button>
            <Button variant="outline" onClick={exportCSV} disabled={sales.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground">{totalSales} pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {averageTicket.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">por pedido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média Diária</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R${" "}
              {Object.keys(salesByDay).length > 0 ? (totalRevenue / Object.keys(salesByDay).length).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">de faturamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por Tamanho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesBySize.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                      {item.name}
                    </div>
                    <div>
                      <p className="font-medium">{item.count} unidades</p>
                      <p className="text-sm text-muted-foreground">R$ {item.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${totalQuantity > 0 ? (item.count / totalQuantity) * 100 : 0}%`,
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
            <CardTitle>Por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesByPayment.length > 0 ? (
                salesByPayment.map((item) => (
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
                          width: `${totalSales > 0 ? (item.count / totalSales) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendas por Dia */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(salesByDay).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(salesByDay)
                .sort((a, b) => {
                  const dateA = a[0].split("/").reverse().join("-")
                  const dateB = b[0].split("/").reverse().join("-")
                  return dateB.localeCompare(dateA)
                })
                .map(([date, data]) => (
                  <div key={date} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{date}</p>
                      <p className="text-sm text-muted-foreground">{data.count} marmitas</p>
                    </div>
                    <p className="text-lg font-bold">R$ {data.revenue.toFixed(2)}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">Nenhuma venda no período selecionado</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
