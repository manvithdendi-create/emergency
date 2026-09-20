import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/helpers'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'resolved' | 'critical'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-gray-100 text-gray-700',
      pending: 'bg-emergency-amber-light text-emergency-amber-dark',
      accepted: 'bg-emergency-blue-light text-emergency-blue-dark',
      on_the_way: 'bg-emergency-blue-light text-emergency-blue-dark',
      arrived: 'bg-emergency-green-light text-emergency-green-dark',
      resolved: 'bg-emergency-green-light text-emergency-green-dark',
      critical: 'bg-emergency-red-light text-emergency-red-dark animate-pulse',
    }

    return (
      <span
        ref={ref}
        className={cn('badge', variantClasses[variant], className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
