"use client"

import { useState } from "react"
import type { Sale } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Search, Trash2, MapPin, Phone, FileText, Bike } from "lucide-react"

interface SalesHistoryProps {
  sales: Sale[]
  onDelete: (saleId: string) => void
}

export default function SalesHistory({ sales, onDelete }: SalesHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSales = sales.filter((sale) => {
    const search = searchTerm.toLowerCase()
    return (
      sale.customer_name?.toLowerCase().includes(search) ||
      sale.customer_phone?.includes(search) ||
      sale.marmita_sizes?.name.toLowerCase().includes(search) ||
      sale.delivery_persons?.name.toLowerCase().includes(search)
    )
  })

  const paymentLabels: Record<string, string> = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao_credito: "Cartão Crédito",
    cartao_debito: "Cartão Débito",
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone, tamanho ou entregador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredSales.length > 0 ? (
            <div className="space-y-3">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                        {sale.marmita_sizes?.name}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            Marmita {sale.marmita_sizes?.name} x{sale.quantity}
                          </p>
                          <span className="rounded bg-muted px-2 py-0.5 text-xs">
                            {sale.delivery_type === "entrega" ? "Entrega" : "Retirada"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • {paymentLabels[sale.payment_method]}
                        </p>
                        {sale.customer_name && <p className="mt-1 text-sm">{sale.customer_name}</p>}
                        {sale.customer_phone && (
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {sale.customer_phone}
                          </p>
                        )}
                        {sale.delivery_address && (
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {sale.delivery_address}
                          </p>
                        )}
                        {sale.delivery_persons && (
                          <p className="flex items-center gap-1 text-sm text-primary">
                            <Bike className="h-3 w-3" />
                            {sale.delivery_persons.name}
                          </p>
                        )}
                        {sale.notes && (
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            {sale.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold">R$ {Number(sale.total_price).toFixed(2)}</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir venda?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A venda será permanentemente removida do sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(sale.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              {searchTerm ? "Nenhuma venda encontrada" : "Nenhuma venda registrada hoje"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
