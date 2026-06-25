import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-blue-primary text-text-primary hover:bg-blue-vivid hover:-translate-y-px shadow-md",
        secondary: "border border-blue-primary text-blue-primary hover:bg-bg-card",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-bg-card",
        destructive: "bg-error text-text-primary hover:bg-red-600",
        outline: "border border-border-subtle text-text-primary hover:bg-bg-card hover:border-border-interactive",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }