"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { DeliveryPerson } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Plus, Trash2, Phone, UserCheck, UserX } from "lucide-react"

interface DeliveryPersonsProps {
  deliveryPersons: DeliveryPerson[]
  onUpdate: (persons: DeliveryPerson[]) => void
}

export default function DeliveryPersons({ deliveryPersons, onUpdate }: DeliveryPersonsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const handleAdd = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("delivery_persons")
        .insert({ name: name.trim(), phone: phone.trim() || null })
        .select()
        .single()

      if (error) throw error

      onUpdate([...deliveryPersons, data])
      setName("")
      setPhone("")
      setIsOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar entregador:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (person: DeliveryPerson) => {
    try {
      const { error } = await supabase.from("delivery_persons").update({ active: !person.active }).eq("id", person.id)

      if (error) throw error

      onUpdate(deliveryPersons.map((p) => (p.id === person.id ? { ...p, active: !p.active } : p)))
    } catch (error) {
      console.error("Erro ao atualizar entregador:", error)
    }
  }

  const handleDelete = async (personId: string) => {
    try {
      const { error } = await supabase.from("delivery_persons").delete().eq("id", personId)

      if (error) throw error

      onUpdate(deliveryPersons.filter((p) => p.id !== personId))
    } catch (error) {
      console.error("Erro ao excluir entregador:", error)
    }
  }

  const activePersons = deliveryPersons.filter((p) => p.active)
  const inactivePersons = deliveryPersons.filter((p) => !p.active)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Entregadores</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Entregador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Entregador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Nome do entregador"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Button onClick={handleAdd} disabled={!name.trim() || isLoading} className="w-full">
                  {isLoading ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {activePersons.length > 0 ? (
            <div className="space-y-3">
              {activePersons.map((person) => (
                <div key={person.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{person.name}</p>
                      {person.phone && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {person.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(person)}>
                      Desativar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir entregador?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O entregador será removido do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(person.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">Nenhum entregador cadastrado</p>
          )}
        </CardContent>
      </Card>

      {inactivePersons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Entregadores Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactivePersons.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <UserX className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">{person.name}</p>
                      {person.phone && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {person.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleToggleActive(person)}>
                    Reativar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
