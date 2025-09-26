'use client'

import React, { forwardRef, useState, useEffect } from 'react'
import { AlertCircle, Check } from 'lucide-react'

interface ValidatedTextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label: string
  error?: string
  helperText?: string
  required?: boolean
  minLength?: number
  maxLength?: number
  showCharCount?: boolean
  onValidationChange?: (isValid: boolean, error?: string) => void
  onChange?: (value: string) => void
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export const ValidatedTextArea = forwardRef<HTMLTextAreaElement, ValidatedTextAreaProps>(
  ({ 
    label, 
    error: externalError, 
    helperText, 
    required = false,
    minLength,
    maxLength,
    showCharCount = false,
    onValidationChange,
    onChange,
    validateOnChange = false,
    validateOnBlur = true,
    className = '',
    value,
    ...props 
  }, ref) => {
    const [internalError, setInternalError] = useState<string>('')
    const [isValid, setIsValid] = useState<boolean>(true)
    const [isTouched, setIsTouched] = useState<boolean>(false)

    const currentError = externalError || internalError
    const hasError = !!currentError
    const currentValue = (value as string) || ''
    const charCount = currentValue.length

    const validateInput = (inputValue: string): string | null => {
      // Campo obrigatório
      if (required && (!inputValue || inputValue.trim() === '')) {
        return 'Este campo é obrigatório'
      }

      // Se o campo está vazio e não é obrigatório, não valida outras regras
      if (!inputValue || inputValue.trim() === '') {
        return null
      }

      // Comprimento mínimo
      if (minLength && inputValue.length < minLength) {
        return `Deve ter pelo menos ${minLength} caracteres`
      }

      // Comprimento máximo
      if (maxLength && inputValue.length > maxLength) {
        return `Deve ter no máximo ${maxLength} caracteres`
      }

      return null
    }

    const handleValidation = (inputValue: string) => {
      const validationError = validateInput(inputValue)
      const valid = !validationError

      setInternalError(validationError || '')
      setIsValid(valid)

      if (onValidationChange) {
        onValidationChange(valid, validationError || undefined)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const inputValue = e.target.value
      
      if (validateOnChange && isTouched) {
        handleValidation(inputValue)
      }

      if (onChange) {
        onChange(inputValue)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsTouched(true)
      
      if (validateOnBlur) {
        handleValidation(e.target.value)
      }

      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    // Validação inicial se o campo já tem valor
    useEffect(() => {
      if (value && typeof value === 'string') {
        handleValidation(value)
      }
    }, [value])

    const baseTextAreaClasses = `
      w-full px-3 py-2 border rounded-md 
      focus:outline-none focus:ring-2 focus:ring-offset-0
      dark:bg-gray-800 dark:text-white
      transition-colors duration-200
      resize-vertical
      ${hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600' 
        : isValid && isTouched && currentValue
        ? 'border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-600'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700'
      }
      ${className}
    `

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {showCharCount && maxLength && (
            <span className={`text-sm ${
              charCount > maxLength 
                ? 'text-red-500' 
                : charCount > maxLength * 0.9 
                ? 'text-yellow-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            className={baseTextAreaClasses}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={hasError}
            aria-describedby={`${props.id}-error ${props.id}-helper`}
            maxLength={maxLength}
            {...props}
          />
          
          {/* Ícones de status */}
          <div className="absolute top-2 right-2">
            {hasError && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            
            {isValid && isTouched && currentValue && !hasError && (
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

ValidatedTextArea.displayName = 'ValidatedTextArea'