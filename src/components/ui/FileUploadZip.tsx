'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, File, X, Download, AlertCircle, CheckCircle } from 'lucide-react'

interface FileUploadZipProps {
  value?: File | string | null
  onChange: (file: File | null) => void
  accept?: string
  maxSize?: number // em MB
  placeholder?: string
  disabled?: boolean
}

export function FileUploadZip({
  value,
  onChange,
  accept = '.zip,.rar,.7z',
  maxSize = 250, // 250MB default
  placeholder = 'Arraste o arquivo ZIP aqui ou clique para selecionar',
  disabled = false
}: FileUploadZipProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determinar o estado atual do arquivo
  const currentFile = (value && typeof value === 'object' && 'name' in value) ? value as File : null
  const currentFileName = currentFile?.name || (typeof value === 'string' && value ? getFileNameFromPath(value) : null)
  const hasFile = !!(currentFile || (typeof value === 'string' && value))

  function getFileNameFromPath(path: string): string {
    return path.split('/').pop() || path
  }

  const validateFile = (file: File): string | null => {
    // Verificar extensão
    const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      return `Tipo de arquivo não permitido. Aceitos: ${accept}`
    }

    // Verificar tamanho
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`
    }

    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    
    // Simular upload (você pode implementar upload real aqui)
    setTimeout(() => {
      onChange(file)
      setIsUploading(false)
    }, 1000)
  }, [onChange, maxSize, accept])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [disabled, handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleRemoveFile = useCallback(() => {
    onChange(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onChange])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!hasFile ? (
        // Estado: Sem arquivo
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragOver && !disabled
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
            ${isUploading ? 'pointer-events-none' : ''}
          `}
        >
          {isUploading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Processando arquivo...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Formatos aceitos: {accept} • Tamanho máximo: {maxSize}MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Estado: Com arquivo
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {currentFileName}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  {currentFile && (
                    <>
                      <span>{formatFileSize(currentFile.size)}</span>
                      <span>•</span>
                    </>
                  )}
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                    Pronto para uso
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-3">
              {typeof value === 'string' && (
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-white dark:hover:bg-gray-700"
                  title="Download arquivo atual"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              
              <button
                type="button"
                onClick={() => !disabled && fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-white dark:hover:bg-gray-700"
                title="Substituir arquivo"
                disabled={disabled}
              >
                <Upload className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-white dark:hover:bg-gray-700"
                title="Remover arquivo"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}