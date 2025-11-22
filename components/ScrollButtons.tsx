'use client'

import { useRef } from 'react'

export function ScrollButtons() {
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }

  return (
    <>
      <button
        onClick={scrollToTop}
        className="scroll-button bottom-4 left-4"
        aria-label="Scroll to top"
      >
        ↑
      </button>
      <button
        onClick={scrollToBottom}
        className="scroll-button bottom-4 right-4"
        aria-label="Scroll to bottom"
      >
        ↓
      </button>
    </>
  )
}

