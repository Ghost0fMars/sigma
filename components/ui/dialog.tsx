import * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DialogContextValue = {
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used inside Dialog")
  }
  return context
}

function Dialog({
  open = false,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
}

function DialogTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useDialog()
  return (
    <button type="button" onClick={() => onOpenChange?.(true)} {...props}>
      {children}
    </button>
  )
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function DialogClose({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useDialog()
  return (
    <button type="button" onClick={() => onOpenChange?.(false)} {...props}>
      {children}
    </button>
  )
}

function DialogOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)} {...props} />
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  const { open, onOpenChange } = useDialog()
  if (!open) {
    return null
  }

  return (
    <DialogPortal>
      <DialogOverlay onClick={() => onOpenChange?.(false)} />
      <div
        role="dialog"
        aria-modal="true"
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg bg-popover p-4 text-sm text-popover-foreground shadow-2xl ring-1 ring-foreground/10 sm:max-w-sm",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Button variant="ghost" className="absolute right-2 top-2" size="icon-sm" onClick={() => onOpenChange?.(false)}>
            <XIcon />
            <span className="sr-only">Fermer</span>
          </Button>
        )}
      </div>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="dialog-title" className={cn("font-heading text-base leading-none font-medium", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
