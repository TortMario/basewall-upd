'use client'

export function ScrollButtons() {
  const scrollToTop = () => {
    if (document.body) {
      document.body.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToBottom = () => {
    const body = document.body
    if (body) {
      body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
    }
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

