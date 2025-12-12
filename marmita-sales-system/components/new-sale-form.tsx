"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MarmitaSize, Sale, DeliveryPerson, CartItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Minus, Plus, Check, X, ShoppingCart } from "lucide-react"

interface NewSaleFormProps {
  sizes: MarmitaSize[]
  deliveryPersons: DeliveryPerson[]
  onSaleComplete: (sale: Sale) => void
}

export default function NewSaleForm({ sizes, deliveryPersons, onSaleComplete }: NewSaleFormProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedSize, setSelectedSize] = useState<MarmitaSize | null>(null)
  const [quantity, setQuantity] = useState(1)

  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro")
  const [deliveryType, setDeliveryType] = useState<string>("retirada")
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const cartTotal = cartItems.reduce((sum, item) => sum + item.size.price * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const activeDeliveryPersons = deliveryPersons.filter((p) => p.active)

  const addToCart = () => {
    if (!selectedSize) return
    if (cartItems.length >= 3) return // Máximo 3 tipos diferentes

    const existingIndex = cartItems.findIndex((item) => item.size.id === selectedSize.id)

    if (existingIndex >= 0) {
      // Atualizar quantidade se já existe
      const updated = [...cartItems]
      updated[existingIndex].quantity += quantity
      setCartItems(updated)
    } else {
      // Adicionar novo item
      setCartItems([...cartItems, { size: selectedSize, quantity }])
    }

    setSelectedSize(null)
    setQuantity(1)
  }

  const removeFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const updated = [...cartItems]
    updated[index].quantity = newQuantity
    setCartItems(updated)
  }

  const handleSubmit = async () => {
    if (cartItems.length === 0) return

    setIsLoading(true)
    try {
      const firstItem = cartItems[0]
      const insertData: Record<string, unknown> = {
        size_id: firstItem.size.id,
        quantity: totalItems,
        unit_price: cartTotal / totalItems,
        total_price: cartTotal,
        payment_method: paymentMethod,
        delivery_type: deliveryType,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        delivery_address: deliveryType === "entrega" ? deliveryAddress : null,
        notes: notes || null,
      }

      if (deliveryType === "entrega" && selectedDeliveryPerson) {
        insertData.delivery_person_id = selectedDeliveryPerson
      }

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert(insertData)
        .select("*, marmita_sizes(*)")
        .single()

      if (saleError) throw saleError

      const saleItemsData = cartItems.map((item) => ({
        sale_id: saleData.id,
        size_id: item.size.id,
        quantity: item.quantity,
        unit_price: item.size.price,
        subtotal: item.size.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItemsData)

      // Ignora erro se a tabela não existir ainda
      if (itemsError && !itemsError.message.includes("does not exist")) {
        console.error("Erro ao inserir itens:", itemsError)
      }

      const saleWithDetails = {
        ...saleData,
        delivery_persons: selectedDeliveryPerson ? deliveryPersons.find((p) => p.id === selectedDeliveryPerson) : null,
        sale_items: saleItemsData.map((item, i) => ({
          ...item,
          id: `temp-${i}`,
          marmita_sizes: cartItems[i].size,
        })),
      }

      setSuccess(true)
      setTimeout(() => {
        onSaleComplete(saleWithDetails)
        resetForm()
      }, 1000)
    } catch (error) {
      console.error("Erro ao registrar venda:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setCartItems([])
    setSelectedSize(null)
    setQuantity(1)
    setPaymentMethod("dinheiro")
    setDeliveryType("retirada")
    setSelectedDeliveryPerson("")
    setCustomerName("")
    setCustomerPhone("")
    setDeliveryAddress("")
    setNotes("")
    setSuccess(false)
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Venda Registrada!</h2>
          <p className="text-muted-foreground">R$ {cartTotal.toFixed(2)}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {cartItems.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Itens da Venda ({cartItems.length}/3)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.map((item, index) => (
              <div key={item.size.id} className="flex items-center justify-between rounded-lg bg-background p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                    {item.size.name}
                  </span>
                  <div>
                    <p className="font-medium">Marmita {item.size.name}</p>
                    <p className="text-sm text-muted-foreground">R$ {Number(item.size.price).toFixed(2)} cada</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-bold">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="ml-2 w-20 text-right font-semibold">
                    R$ {(item.size.price * item.quantity).toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{cartItems.length === 0 ? "Selecione o Tamanho" : "Adicionar Mais Itens"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {sizes.map((size) => {
              const isInCart = cartItems.some((item) => item.size.id === size.id)
              return (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size)}
                  disabled={cartItems.length >= 3 && !isInCart}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 p-6 transition-all ${
                    selectedSize?.id === size.id
                      ? "border-primary bg-primary/5"
                      : isInCart
                        ? "border-green-500/50 bg-green-500/5"
                        : cartItems.length >= 3
                          ? "cursor-not-allowed border-border opacity-50"
                          : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-4xl font-bold">{size.name}</span>
                  <span className="mt-2 text-lg font-semibold text-primary">R$ {Number(size.price).toFixed(2)}</span>
                  {isInCart && <span className="mt-1 text-xs text-green-600">No carrinho</span>}
                </button>
              )
            })}
          </div>

          {/* Quantidade e botão adicionar */}
          {selectedSize && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantidade:</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-transparent"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-2xl font-bold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-transparent"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={addToCart} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar R$ {(selectedSize.price * quantity).toFixed(2)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forma de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
            {[
              { value: "dinheiro", label: "Dinheiro" },
              { value: "pix", label: "PIX" },
              { value: "cartao_credito", label: "Crédito" },
              { value: "cartao_debito", label: "Débito" },
            ].map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-4 transition-all ${
                  paymentMethod === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                <span className="font-medium">{option.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Tipo de Entrega */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={deliveryType} onValueChange={setDeliveryType} className="grid grid-cols-2 gap-4">
            {[
              { value: "retirada", label: "Retirada no Local" },
              { value: "entrega", label: "Entrega" },
            ].map((option) => (
              <Label
                key={option.value}
                htmlFor={`delivery-${option.value}`}
                className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-4 transition-all ${
                  deliveryType === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={option.value} id={`delivery-${option.value}`} className="sr-only" />
                <span className="font-medium">{option.label}</span>
              </Label>
            ))}
          </RadioGroup>

          {deliveryType === "entrega" && (
            <div className="space-y-4 pt-2">
              {activeDeliveryPersons.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="delivery-person">Entregador</Label>
                  <Select value={selectedDeliveryPerson} onValueChange={setSelectedDeliveryPerson}>
                    <SelectTrigger id="delivery-person">
                      <SelectValue placeholder="Selecione o entregador" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDeliveryPersons.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="address">Endereço de Entrega</Label>
                <Textarea
                  id="address"
                  placeholder="Rua, número, bairro..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados do Cliente (Opcional) */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente (Opcional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Sem cebola, mais arroz..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Total e Confirmar */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm opacity-90">
              Total ({totalItems} {totalItems === 1 ? "marmita" : "marmitas"})
            </p>
            <p className="text-3xl font-bold">R$ {cartTotal.toFixed(2)}</p>
          </div>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleSubmit}
            disabled={cartItems.length === 0 || isLoading}
            className="px-8"
          >
            {isLoading ? "Registrando..." : "Confirmar Venda"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
