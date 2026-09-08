import { useEffect } from 'react'

export function useScrollReveal(selector = '[data-reveal]') {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    const elements = document.querySelectorAll(selector)

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      observer.unobserve(entry.target)
    }), { threshold: 0.03, rootMargin: '0px 0px -8% 0px' })

    elements.forEach((element) => observer.observe(element))
    const firstFrame = window.requestAnimationFrame(() => {
      elements.forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight * 0.92) element.classList.add('is-visible')
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      observer.disconnect()
    }
  }, [selector])
}
