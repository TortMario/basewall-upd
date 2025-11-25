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
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      <button
        onClick={scrollToTop}
        className="scroll-button bg-blue-500 opacity-20 hover:opacity-40"
        aria-label="Scroll to top"
      >
        ↑
      </button>
      <button
        onClick={scrollToBottom}
        className="scroll-button bg-blue-500 opacity-20 hover:opacity-40"
        aria-label="Scroll to bottom"
      >
        ↓
      </button>
    </div>
  )
}

