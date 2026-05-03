import * as React from "react"

import { cn } from "@/lib/utils"

type TabsContextValue = {
  value?: string
  onValueChange?: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const currentValue = value ?? internalValue
  const handleChange = (next: string) => {
    setInternalValue(next)
    onValueChange?.(next)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tabs-list" className={cn("inline-flex items-center gap-1", className)} {...props} />
}

function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = React.useContext(TabsContext)
  const active = context?.value === value
  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-state={active ? "active" : "inactive"}
      className={cn("rounded px-3 py-1 text-sm", active && "bg-muted", className)}
      onClick={() => context?.onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({
  value,
  className,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const context = React.useContext(TabsContext)
  if (context?.value !== value) {
    return null
  }
  return <div data-slot="tabs-content" className={cn(className)} {...props} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
