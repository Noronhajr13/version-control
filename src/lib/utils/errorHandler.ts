import { toast } from 'sonner'

// Tipos de erro customizados
export interface ValidationError {
  field: string
  message: string
}

export interface APIError {
  code: string
  message: string
  details?: string
}

// Classe para gerenciar erros da aplicação
export class ErrorManager {
  static handleValidationErrors(errors: ValidationError[]): void {
    errors.forEach(error => {
      toast.error(`${error.field}: ${error.message}`)
    })
  }

  static handleAPIError(error: APIError): void {
    const errorMessages: Record<string, string> = {
      'PGRST116': 'Dados não encontrados',
      'PGRST301': 'Acesso negado',
      '23505': 'Este registro já existe no sistema',
      '23503': 'Não é possível excluir - existem registros relacionados',
      '23502': 'Campo obrigatório não preenchido',
      'auth/invalid-email': 'Email inválido',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Este email já está em uso',
      'auth/weak-password': 'Senha muito fraca',
      'network-error': 'Erro de conexão. Verifique sua internet.',
      'timeout': 'Operação demorou muito para responder. Tente novamente.'
    }

    const message = errorMessages[error.code] || error.message || 'Erro desconhecido'
    toast.error(message)
  }

  static handleGenericError(error: unknown): void {
    if (error instanceof Error) {
      // Verifica se é um erro do Supabase
      if ('code' in error) {
        this.handleAPIError({
          code: (error as any).code,
          message: error.message
        })
        return
      }

      // Verifica se é um erro de rede
      if (error.message.includes('fetch') || error.message.includes('network')) {
        this.handleAPIError({
          code: 'network-error',
          message: 'Erro de conexão'
        })
        return
      }

      // Erro genérico
      toast.error(`Erro: ${error.message}`)
    } else {
      toast.error('Ocorreu um erro inesperado')
    }
  }

  static showSuccessMessage(operation: string, entity: string): void {
    const messages: Record<string, string> = {
      create: `${entity} criado(a) com sucesso`,
      update: `${entity} atualizado(a) com sucesso`,
      delete: `${entity} excluído(a) com sucesso`,
      save: `${entity} salvo(a) com sucesso`
    }

    const message = messages[operation] || `Operação realizada com sucesso`
    toast.success(message)
  }

  static validateRequired(value: string | undefined | null, fieldName: string): ValidationError | null {
    if (!value || value.trim() === '') {
      return {
        field: fieldName,
        message: 'Este campo é obrigatório'
      }
    }
    return null
  }

  static validateEmail(email: string): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        field: 'Email',
        message: 'Email deve ter um formato válido'
      }
    }
    return null
  }

  static validateMinLength(value: string, minLength: number, fieldName: string): ValidationError | null {
    if (value.length < minLength) {
      return {
        field: fieldName,
        message: `Deve ter pelo menos ${minLength} caracteres`
      }
    }
    return null
  }

  static validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationError | null {
    if (value.length > maxLength) {
      return {
        field: fieldName,
        message: `Deve ter no máximo ${maxLength} caracteres`
      }
    }
    return null
  }

  static validateDate(dateString: string, fieldName: string): ValidationError | null {
    if (isNaN(Date.parse(dateString))) {
      return {
        field: fieldName,
        message: 'Data inválida'
      }
    }
    return null
  }

  static validateURL(url: string, fieldName: string): ValidationError | null {
    try {
      new URL(url)
      return null
    } catch {
      return {
        field: fieldName,
        message: 'URL inválida'
      }
    }
  }

  static validateJiraCard(jiraCard: string): ValidationError | null {
    const jiraRegex = /^[A-Z]+-[0-9]+$/
    if (!jiraRegex.test(jiraCard)) {
      return {
        field: 'Card Jira',
        message: 'Deve seguir o padrão ABC-123'
      }
    }
    return null
  }

  static validateVersionNumber(version: string): ValidationError | null {
    const versionRegex = /^[0-9]+\.[0-9]+(\.[0-9]+)?$/
    if (!versionRegex.test(version)) {
      return {
        field: 'Número da Versão',
        message: 'Deve seguir o padrão 1.2.3'
      }
    }
    return null
  }

  static validateTag(tag: string): ValidationError | null {
    const tagRegex = /^v?[0-9]+\.[0-9]+(\.[0-9]+)?(-[a-zA-Z0-9]+)?$/
    if (!tagRegex.test(tag)) {
      return {
        field: 'Tag',
        message: 'Deve seguir o padrão v1.2.3 ou 1.2.3'
      }
    }
    return null
  }

  static validateBrazilianState(uf: string): ValidationError | null {
    const validStates = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ]
    
    if (!validStates.includes(uf.toUpperCase())) {
      return {
        field: 'UF',
        message: 'Estado brasileiro inválido'
      }
    }
    return null
  }

  // Função para mostrar um loading toast
  static showLoading(message: string = 'Processando...'): string | number {
    return toast.loading(message)
  }

  // Função para fechar um loading toast
  static dismissLoading(toastId: string | number): void {
    toast.dismiss(toastId)
  }
}

// Hook para usar o ErrorManager em componentes
export const useErrorHandler = () => {
  return {
    handleError: ErrorManager.handleGenericError,
    handleValidationErrors: ErrorManager.handleValidationErrors,
    showSuccess: ErrorManager.showSuccessMessage,
    showLoading: ErrorManager.showLoading,
    dismissLoading: ErrorManager.dismissLoading
  }
}