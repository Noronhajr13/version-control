'use client'

import React, { forwardRef, useState } from 'react'
import { AlertCircle, Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface ValidatedSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  helperText?: string
  required?: boolean
  onValidationChange?: (isValid: boolean, error?: string) => void
  onChange?: (value: string) => void
  validateOnChange?: boolean
}

export const ValidatedSelect = forwardRef<HTMLSelectElement, ValidatedSelectProps>(
  ({ 
    label, 
    options,
    placeholder = "Selecione...",
    error: externalError, 
    helperText, 
    required = false,
    onValidationChange,
    onChange,
    validateOnChange = true,
    className = '',
    value,
    ...props 
  }, ref) => {
    const [internalError, setInternalError] = useState<string>('')
    const [isValid, setIsValid] = useState<boolean>(true)
    const [isTouched, setIsTouched] = useState<boolean>(false)

    const currentError = externalError || internalError
    const hasError = !!currentError
    const hasValue = value && value !== ''

    const validateInput = (selectedValue: string): string | null => {
      if (required && (!selectedValue || selectedValue === '')) {
        return 'Este campo é obrigatório'
      }
      return null
    }

    const handleValidation = (selectedValue: string) => {
      const validationError = validateInput(selectedValue)
      const valid = !validationError

      setInternalError(validationError || '')
      setIsValid(valid)

      if (onValidationChange) {
        onValidationChange(valid, validationError || undefined)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = e.target.value
      
      if (validateOnChange) {
        handleValidation(selectedValue)
      }

      if (onChange) {
        onChange(selectedValue)
      }
    }

    const handleBlur = () => {
      setIsTouched(true)
      
      if (value && typeof value === 'string') {
        handleValidation(value)
      }
    }

    const baseSelectClasses = `
      w-full px-3 py-2 border rounded-md 
      focus:outline-none focus:ring-2 focus:ring-offset-0
      dark:bg-gray-800 dark:text-white
      transition-colors duration-200
      appearance-none
      ${hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600' 
        : isValid && isTouched && hasValue
        ? 'border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-600'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700'
      }
      ${className}
    `

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <select
            ref={ref}
            value={value}
            className={baseSelectClasses}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={hasError}
            aria-describedby={`${props.id}-error ${props.id}-helper`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Ícones */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1 pointer-events-none">
            {hasError && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            
            {isValid && isTouched && hasValue && !hasError && (
              <Check className="w-4 h-4 text-green-500" />
            )}
            
            <ChevronDown className="w-4 h-4 text-gray-400" />
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

ValidatedSelect.displayName = 'ValidatedSelect'