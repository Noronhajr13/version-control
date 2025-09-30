'use client'

import { useState } from 'react'
import { Download, File, AlertCircle, CheckCircle } from 'lucide-react'

interface DownloadButtonProps {
  fileUrl: string | null
  fileName: string
  versionNumber: string
  className?: string
  disabled?: boolean
}

export function DownloadButton({
  fileUrl,
  fileName,
  versionNumber,
  className = '',
  disabled = false
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleDownload = async () => {
    if (!fileUrl || disabled) return

    setIsDownloading(true)
    setDownloadStatus('idle')

    try {
      // Criar elemento de download
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = `${fileName}-v${versionNumber}.zip`
      
      // Adicionar ao DOM temporariamente e clicar
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setDownloadStatus('success')
      
      // Reset status após 3 segundos
      setTimeout(() => {
        setDownloadStatus('idle')
      }, 3000)
      
    } catch (error) {
      console.error('Erro no download:', error)
      setDownloadStatus('error')
      
      // Reset status após 3 segundos
      setTimeout(() => {
        setDownloadStatus('idle')
      }, 3000)
    } finally {
      setIsDownloading(false)
    }
  }

  // Se não há arquivo, mostrar botão desabilitado
  if (!fileUrl) {
    return (
      <button
        disabled
        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed ${className}`}
        title="Arquivo não disponível"
      >
        <File className="w-3 h-3 mr-1" />
        Indisponível
      </button>
    )
  }

  // Estados do botão
  if (isDownloading) {
    return (
      <button
        disabled
        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-600 bg-blue-50 dark:bg-blue-900/20 cursor-wait ${className}`}
      >
        <div className="animate-spin w-3 h-3 mr-1 border border-blue-600 border-t-transparent rounded-full" />
        Baixando...
      </button>
    )
  }

  if (downloadStatus === 'success') {
    return (
      <button
        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-green-600 bg-green-50 dark:bg-green-900/20 ${className}`}
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        Baixado!
      </button>
    )
  }

  if (downloadStatus === 'error') {
    return (
      <button
        onClick={handleDownload}
        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ${className}`}
      >
        <AlertCircle className="w-3 h-3 mr-1" />
        Tentar novamente
      </button>
    )
  }

  // Estado normal - pronto para download
  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={`Baixar ${fileName} v${versionNumber}`}
    >
      <Download className="w-3 h-3 mr-1" />
      Download
    </button>
  )
}