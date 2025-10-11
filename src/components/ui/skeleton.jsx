import React from "react"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"
import { shimmerVariants } from "../../lib/animations"

function Skeleton({ className, animated = true, ...props }) {
  if (!animated) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-md bg-muted",
          className
        )}
        {...props}
      />
    )
  }

  return (
    <motion.div
      variants={shimmerVariants}
      animate="animate"
      className={cn(
        "rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

// Specialized skeleton components
function SkeletonText({ lines = 1, className, ...props }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className, ...props }) {
  return (
    <div className={cn("p-6 space-y-4", className)} {...props}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5, columns = 4, className, ...props }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonForm({ fields = 3, className, ...props }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

function SkeletonAvatar({ size = "md", className, ...props }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20"
  }

  return (
    <Skeleton
      className={cn(
        "rounded-full",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonForm, 
  SkeletonAvatar 
}

