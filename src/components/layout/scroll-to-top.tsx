import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop
 * Garante que ao mudar de tela na aplicação, o scroll é sempre reposicionado no topo (scroll up).
 * Reinicia o scroll tanto no elemento <main> como na janela (window / document).
 * Desativa a restauração automática do histórico do navegador para evitar que o browser
 * tente repor posições de scroll anteriores ao navegar.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Evita que o browser tente repor a posição de scroll anterior
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const resetScroll = () => {
      // 1. Reset da janela e documento global
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      if (document.documentElement) {
        document.documentElement.scrollTop = 0
      }
      if (document.body) {
        document.body.scrollTop = 0
      }

      // 2. Reset do contentor principal <main> da AppShell
      const mainEl = document.querySelector('main')
      if (mainEl) {
        mainEl.scrollTop = 0
      }
    }

    // Execução imediata
    resetScroll()

    // Execução diferida para acomodar montagem de componentes assíncronos
    const rafId = requestAnimationFrame(resetScroll)
    const timeoutId = setTimeout(resetScroll, 50)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timeoutId)
    }
  }, [pathname])

  return null
}
