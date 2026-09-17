/**
 * Translates raw technical database and network errors into clear, friendly Portuguese.
 */
export function getFriendlyErrorMessage(error: any, fallback = 'Ocorreu um erro inesperado. Tente novamente.'): string {
  if (!error) return fallback
  
  const msg = typeof error === 'string' ? error : error.message || ''

  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    if (msg.includes('email')) return 'Este endereço de email já está registado na plataforma.'
    return 'Já existe um registo idêntico com estes dados.'
  }

  if (msg.includes('JWT') || msg.includes('token') || msg.includes('session')) {
    return 'A sua sessão expirou. Por favor inicie sessão novamente.'
  }

  if (msg.includes('row-level security') || msg.includes('permission denied') || msg.includes('RLS')) {
    return 'Não tem permissões suficientes para realizar esta ação.'
  }

  if (msg.includes('bucket') || msg.includes('storage') || msg.includes('upload')) {
    return 'Não foi possível carregar o ficheiro. Verifique o tamanho ou o formato.'
  }

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('offline')) {
    return 'Sem ligação à internet. Verifique a sua ligação de rede.'
  }

  // If message has reasonable length and doesn't look like an internal SQL statement, return it
  if (msg.length > 5 && msg.length < 120 && !msg.includes('SELECT') && !msg.includes('INSERT') && !msg.includes('relation')) {
    return msg
  }

  return fallback
}
