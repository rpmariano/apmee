import { useEffect, useRef } from 'react'

/**
 * Hook to intercept the mobile hardware back button (or browser back button)
 * when a modal is open.
 * 
 * @param isOpen Whether the modal is currently open
 * @param onBack Callback fired when the back button is pressed
 */
export function useHardwareBack(isOpen: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack)

  // Keep ref up to date
  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    if (!isOpen) return

    // Push a dummy state to trap the back button
    window.history.pushState({ modalTrapped: true }, '')

    const handlePopState = () => {
      // The back button was pressed. The dummy state is now popped.
      
      // Call the provided onBack handler
      onBackRef.current()
      
      // Immediately re-push the state. 
      // If the onBack handler decides to close the modal, the cleanup function 
      // will run and pop this state automatically. 
      // If it decides to keep it open (e.g., showing a warning), the state is 
      // ready to trap the next back button press.
      window.history.pushState({ modalTrapped: true }, '')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      // If the component unmounts and our trapped state is still active, pop it
      if (window.history.state?.modalTrapped) {
        window.history.back()
      }
    }
  }, [isOpen])
}
