'use client'

import React, { forwardRef, useState, useEffect } from 'react'
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  helperText?: string
  validation?: ValidationRule
  onValidationChange?: (isValid: boolean, error?: string) => void
  type?: 'text' | 'email' | 'password' | 'url' | 'date' | 'number'
  showPasswordToggle?: boolean
  validateOnBlur?: boolean
  validateOnChange?: boolean
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ 
    label, 
    error: externalError, 
    helperText, 
    validation = {},
    onValidationChange,
    type = 'text',
    showPasswordToggle = false,
    validateOnBlur = true,
    validateOnChange = false,
    className = '',
    ...props 
  }, ref) => {
    const [internalError, setInternalError] = useState<string>('')
    const [isValid, setIsValid] = useState<boolean>(true)
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [isTouched, setIsTouched] = useState<boolean>(false)

    const currentError = externalError || internalError
    const hasError = !!currentError
    const inputType = type === 'password' && showPassword ? 'text' : type

    const validateInput = (value: string): string | null => {
      // Campo obrigatório
      if (validation.required && (!value || value.trim() === '')) {
        return 'Este campo é obrigatório'
      }

      // Se o campo está vazio e não é obrigatório, não valida outras regras
      if (!value || value.trim() === '') {
        return null
      }

      // Comprimento mínimo
      if (validation.minLength && value.length < validation.minLength) {
        return `Deve ter pelo menos ${validation.minLength} caracteres`
      }

      // Comprimento máximo
      if (validation.maxLength && value.length > validation.maxLength) {
        return `Deve ter no máximo ${validation.maxLength} caracteres`
      }

      // Padrão regex
      if (validation.pattern && !validation.pattern.test(value)) {
        return 'Formato inválido'
      }

      // Validação customizada
      if (validation.custom) {
        return validation.custom(value)
      }

      // Validações específicas por tipo
      if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return 'Email deve ter um formato válido'
        }
      }

      if (type === 'url') {
        try {
          new URL(value)
        } catch {
          return 'URL deve ser válida'
        }
      }

      if (type === 'date') {
        if (isNaN(Date.parse(value))) {
          return 'Data inválida'
        }
      }

      return null
    }

    const handleValidation = (value: string) => {
      const validationError = validateInput(value)
      const valid = !validationError

      setInternalError(validationError || '')
      setIsValid(valid)

      if (onValidationChange) {
        onValidationChange(valid, validationError || undefined)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      
      if (validateOnChange && isTouched) {
        handleValidation(value)
      }

      if (props.onChange) {
        props.onChange(e)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsTouched(true)
      
      if (validateOnBlur) {
        handleValidation(e.target.value)
      }

      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (props.onFocus) {
        props.onFocus(e)
      }
    }

    // Validação inicial se o campo já tem valor
    useEffect(() => {
      if (props.value && typeof props.value === 'string') {
        handleValidation(props.value)
      }
    }, [props.value])

    const baseInputClasses = `
      w-full px-3 py-2 border rounded-md 
      focus:outline-none focus:ring-2 focus:ring-offset-0
      dark:bg-gray-800 dark:text-white
      transition-colors duration-200
      ${hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600' 
        : isValid && isTouched && props.value
        ? 'border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-600'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700'
      }
      ${className}
    `

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {validation.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={baseInputClasses}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            aria-invalid={hasError}
            aria-describedby={`${props.id}-error ${props.id}-helper`}
            {...props}
          />
          
          {/* Ícones de status */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
            {type === 'password' && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
            
            {hasError && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            
            {isValid && isTouched && props.value && !hasError && (
              <Check className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>

        {/* Mensagens de erro e ajuda */}
        {hasError && (
          <p id={`${props.id}-error`} className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            {currentError}
          </p>
        )}
        
        {helperText && !hasError && (
          <p id={`${props.id}-helper`} className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

ValidatedInput.displayName = 'ValidatedInput'