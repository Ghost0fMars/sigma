import * as React from "react"

import { cn } from "@/lib/utils"

function ScrollArea({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="scroll-area" className={cn("overflow-auto", className)} {...props} />
}

function ScrollBar({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="scroll-bar" className={cn("hidden", className)} {...props} />
}

export { ScrollArea, ScrollBar }
