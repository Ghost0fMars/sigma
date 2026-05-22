import * as React from "react"

import { cn } from "@/lib/utils"

type SelectContextValue = {
  open: boolean
  value?: string
  setOpen: (open: boolean) => void
  onValueChange?: (value: any) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used inside Select")
  }
  return context
}

function Select({
  value,
  onValueChange,
  children,
  disabled = false,
}: {
  value?: string
  onValueChange?: (value: any) => void
  children: React.ReactNode
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ open, value, setOpen: disabled ? () => {} : setOpen, onValueChange }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSelect()

  return (
    <button
      type="button"
      data-slot="select-trigger"
      aria-expanded={open}
      className={cn(
        "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-background px-2.5 py-1 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <span className="ml-2 text-xs opacity-70">v</span>
    </button>
  )
}

function SelectValue() {
  const { value } = useSelect()
  return <span className="truncate">{value}</span>
}

function SelectContent({
  className,
  children,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = useSelect()
  if (!open) {
    return null
  }

  return (
    <div
      data-slot="select-content"
      className={cn(
        "absolute left-0 top-[calc(100%+0.25rem)] z-[60] max-h-64 w-full overflow-auto rounded-md border border-[#393E46] bg-[#FFFFFF] p-1 shadow-xl",
        className
      )}
    >
      {children}
    </div>
  )
}

function SelectItem({
  value,
  children,
  className,
}: React.PropsWithChildren<
  React.Attributes & {
    value: string
    className?: string
  }
>) {
  const { value: selectedValue, setOpen, onValueChange } = useSelect()
  const selected = selectedValue === value

  return (
    <button
      type="button"
      data-slot="select-item"
      data-state={selected ? "checked" : "unchecked"}
      className={cn(
        "block w-full rounded px-2 py-2 text-left text-sm text-[#222831] hover:bg-[#EEEEEE] focus:bg-[#EEEEEE] focus:outline-none",
        selected && "bg-[#FFD369] text-[#222831]",
        className
      )}
      onClick={() => {
        onValueChange?.(value)
        setOpen(false)
      }}
    >
      {children}
    </button>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }


