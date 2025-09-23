'use client'

import { ReactNode, useState, useEffect } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
}

export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  direction = 'up',
  className = ''
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'translateY(20px)'
        case 'down': return 'translateY(-20px)'
        case 'left': return 'translateX(20px)'
        case 'right': return 'translateX(-20px)'
        default: return 'translateY(0)'
      }
    }
    return 'translateY(0) translateX(0)'
  }

  return (
    <div
      className={`transition-all ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

interface SlideInProps {
  children: ReactNode
  isOpen: boolean
  direction?: 'left' | 'right' | 'up' | 'down'
  duration?: number
  className?: string
}

export function SlideIn({
  children,
  isOpen,
  direction = 'right',
  duration = 300,
  className = ''
}: SlideInProps) {
  const getTransform = () => {
    if (!isOpen) {
      switch (direction) {
        case 'left': return 'translateX(-100%)'
        case 'right': return 'translateX(100%)'
        case 'up': return 'translateY(-100%)'
        case 'down': return 'translateY(100%)'
      }
    }
    return 'translateX(0) translateY(0)'
  }

  return (
    <div
      className={`transition-transform ease-out ${className}`}
      style={{
        transform: getTransform(),
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

interface ScaleInProps {
  children: ReactNode
  isVisible: boolean
  duration?: number
  className?: string
}

export function ScaleIn({
  children,
  isVisible,
  duration = 200,
  className = ''
}: ScaleInProps) {
  return (
    <div
      className={`transition-all ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

interface StaggeredChildrenProps {
  children: ReactNode[]
  delay?: number
  className?: string
}

export function StaggeredChildren({
  children,
  delay = 100,
  className = ''
}: StaggeredChildrenProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * delay} direction="up">
          {child}
        </FadeIn>
      ))}
    </div>
  )
}

interface PulseProps {
  children: ReactNode
  isActive: boolean
  intensity?: 'low' | 'medium' | 'high'
  className?: string
}

export function Pulse({
  children,
  isActive,
  intensity = 'medium',
  className = ''
}: PulseProps) {
  const intensityClasses = {
    low: 'animate-pulse',
    medium: isActive ? 'animate-pulse' : '',
    high: isActive ? 'animate-bounce' : ''
  }

  return (
    <div className={`${intensityClasses[intensity]} ${className}`}>
      {children}
    </div>
  )
}

interface FloatingProps {
  children: ReactNode
  enabled?: boolean
  className?: string
}

export function Floating({
  children,
  enabled = true,
  className = ''
}: FloatingProps) {
  return (
    <div 
      className={`
        ${enabled ? 'hover:scale-105 hover:-translate-y-1' : ''} 
        transition-all duration-200 ease-out
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Custom hook for scroll animations
export function useScrollAnimation(threshold = 0.1) {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold }
    )

    const element = document.getElementById('scroll-target')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [threshold])

  return isInView
}

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const [currentValue, setCurrentValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setCurrentValue(Math.floor(easeOut * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}{currentValue.toLocaleString()}{suffix}
    </span>
  )
}