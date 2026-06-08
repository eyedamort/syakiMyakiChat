import { useCallback, useEffect, useState } from 'react'

export function useFullscreen<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const ref = useCallback((node: T | null) => {
    setElement(node)
  }, [])

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(document.fullscreenElement === element)
    }

    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [element])

  const toggle = useCallback(async () => {
    if (!element) return

    if (document.fullscreenElement === element) {
      await document.exitFullscreen()
      return
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }

    await element.requestFullscreen()
  }, [element])

  return { ref, isFullscreen, toggle }
}
