import { useEffect, useRef } from 'react'

/**
 * Hook to intercept the mobile hardware back button (or browser back button)
 * when a modal is open.
 * 
 * Safely preserves React Router's internal history state ({ idx, key, usr })
 * to avoid history corruption, popstate race conditions, or blank screen unmounting.
 * 
 * @param isOpen Whether the modal is currently open
 * @param onBack Callback fired when the back button is pressed
 */
export function useHardwareBack(isOpen: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack)
  const isBackPoppedRef = useRef(false)
  const isTrappedRef = useRef(false)
  const trapIdRef = useRef(`trap_${Date.now()}_${Math.random().toString(36).slice(2)}`)

  // Keep ref up to date
  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    if (!isOpen) {
      isTrappedRef.current = false
      return
    }

    const currentTrapId = `trap_${Date.now()}_${Math.random().toString(36).slice(2)}`
    trapIdRef.current = currentTrapId
    isBackPoppedRef.current = false

    // Push dummy state while preserving existing history state (React Router idx/key)
    try {
      const currentState = (window.history.state && typeof window.history.state === 'object')
        ? window.history.state
        : {}

      // Only push if not already trapped by this instance
      if (!isTrappedRef.current) {
        window.history.pushState(
          { ...currentState, __modalTrapId: currentTrapId },
          '',
          window.location.href
        )
        isTrappedRef.current = true
      }
    } catch (err) {
      console.warn('Could not push history state for modal trap:', err)
    }

    const handlePopState = () => {
      // The back button was pressed by the user in the browser/hardware.
      // The browser has ALREADY popped the trapped entry.
      isBackPoppedRef.current = true
      isTrappedRef.current = false

      // Fire the provided onBack handler (e.g. handleCloseClick / onClose)
      try {
        if (onBackRef.current) {
          onBackRef.current()
        }
      } catch (err) {
        console.error('Error in onBack callback from hardware back:', err)
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)

      // If the component is closing/unmounting PROGRAMMATICALLY (e.g. user clicked "Gravar", "X", or "Cancelar")
      // and NOT via the browser back button, then our dummy entry is still at the top of the stack.
      // We pop it cleanly so the user's history doesn't accumulate dead trapped states.
      if (isTrappedRef.current && !isBackPoppedRef.current) {
        isTrappedRef.current = false
        setTimeout(() => {
          if (window.history.state?.__modalTrapId === currentTrapId) {
            try {
              window.history.back()
            } catch {
              // ignore
            }
          }
        }, 0)
      }
    }
  }, [isOpen])
}
