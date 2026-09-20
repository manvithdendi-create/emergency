import { Activity } from 'lucide-react'
import { cn } from '../utils/helpers'

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emergency-red-light mb-4">
          <Activity className="w-8 h-8 text-emergency-red animate-spin" />
        </div>
        <p className="text-gray-600">Loading Emergency Alert System...</p>
      </div>
    </div>
  )
}

export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <Activity
      className={cn(sizeClasses[size], 'text-emergency-red animate-spin', className)}
      aria-hidden="true"
    />
  )
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  )
}