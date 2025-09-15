import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-current border-r-transparent",
  {
    variants: {
      size: {
        default: "h-4 w-4 border-2",
        sm: "h-3 w-3 border-2",
        lg: "h-6 w-6 border-2",
        xl: "h-8 w-8 border-[3px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const LoadingSpinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof spinnerVariants>
>(({ className, size, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(spinnerVariants({ size }), className)}
    {...props}
  />
))
LoadingSpinner.displayName = "LoadingSpinner"

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean
  spinnerSize?: VariantProps<typeof spinnerVariants>["size"]
  text?: string
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ className, isLoading, spinnerSize = "lg", text, children, ...props }, ref) => {
    if (!isLoading) {
      return <>{children}</>
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative min-h-[200px] flex items-center justify-center",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size={spinnerSize} className="text-primary" />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {text}
            </p>
          )}
        </div>
        {children && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
        )}
      </div>
    )
  }
)
LoadingOverlay.displayName = "LoadingOverlay"

// Skeleton components for loading states
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-pulse rounded-md bg-muted", className)}
    {...props}
  />
))
Skeleton.displayName = "Skeleton"

const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border border-border p-4 space-y-3", className)}
    {...props}
  >
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex space-x-2">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-12" />
    </div>
  </div>
))
SkeletonCard.displayName = "SkeletonCard"

export { LoadingSpinner, LoadingOverlay, Skeleton, SkeletonCard, spinnerVariants }