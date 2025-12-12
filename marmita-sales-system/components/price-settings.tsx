"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MarmitaSize } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Save } from "lucide-react"

interface PriceSettingsProps {
  sizes: MarmitaSize[]
  onUpdate: (sizes: MarmitaSize[]) => void
}

export default function PriceSettings({ sizes, onUpdate }: PriceSettingsProps) {
  const [prices, setPrices] = useState<Record<string, string>>(
    sizes.reduce((acc, size) => ({ ...acc, [size.id]: String(size.price) }), {}),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const supabase = createClient()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updates = sizes.map((size) =>
        supabase
          .from("marmita_sizes")
          .update({ price: Number.parseFloat(prices[size.id]) })
          .eq("id", size.id)
          .select()
          .single(),
      )

      const results = await Promise.all(updates)
      const updatedSizes = results.map((r) => r.data).filter(Boolean) as MarmitaSize[]

      onUpdate(updatedSizes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Erro ao atualizar preços:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Configuração de Preços</CardTitle>
        <CardDescription>Defina os preços para cada tamanho de marmita</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sizes.map((size) => (
          <div key={size.id} className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
              {size.name}
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor={`price-${size.id}`}>Marmita {size.name}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id={`price-${size.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={prices[size.id]}
                  onChange={(e) => setPrices({ ...prices, [size.id]: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        ))}

        <Button onClick={handleSave} disabled={isLoading || saved} className="w-full" size="lg">
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Salvo!
            </>
          ) : isLoading ? (
            "Salvando..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Preços
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
