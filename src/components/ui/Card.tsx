'use client'

import { cn } from '@/src/utils/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 shadow rounded-lg',
      className
    )}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={cn(
      'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
      className
    )}>
      {children}
    </div>
  )
}

interface CardBodyProps {
  className?: string
  children: React.ReactNode
}

export function CardBody({ className, children }: CardBodyProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

// Alias para compatibilidade
export const CardContent = CardBody

interface CardTitleProps {
  className?: string
  children: React.ReactNode
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </h3>
  )
}

interface CardDescriptionProps {
  className?: string
  children: React.ReactNode
}

export function CardDescription({ className, children }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-400 mt-1', className)}>
      {children}
    </p>
  )
}

interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div className={cn(
      'px-6 py-4 border-t border-gray-200 dark:border-gray-700',
      className
    )}>
      {children}
    </div>
  )
}