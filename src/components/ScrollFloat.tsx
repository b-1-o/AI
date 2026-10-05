import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ScrollFloat.css'

gsap.registerPlugin(ScrollTrigger)

type ScrollFloatProps = {
  children: ReactNode
  scrollContainerRef?: RefObject<HTMLElement | null>
  containerClassName?: string
  textClassName?: string
  animationDuration?: number
  ease?: string
  scrollStart?: string
  scrollEnd?: string
  stagger?: number
  playOnMount?: boolean
}

export default function ScrollFloat({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
  playOnMount = false,
}: ScrollFloatProps) {
  const containerRef = useRef<HTMLHeadingElement | null>(null)

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : ''
    return text.split('').map((char, index) => (
      <span className="char" key={index}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
  }, [children])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const charElements = el.querySelectorAll('.char')
    if (!charElements.length) return

    const from = {
      willChange: 'opacity, transform',
      opacity: 0,
      yPercent: 120,
      scaleY: 2.3,
      scaleX: 0.7,
      transformOrigin: '50% 0%',
    }

    const to = {
      duration: animationDuration,
      ease,
      opacity: 1,
      yPercent: 0,
      scaleY: 1,
      scaleX: 1,
      stagger,
    }

    let tween: gsap.core.Tween | undefined

    if (playOnMount) {
      tween = gsap.fromTo(charElements, from, to)
    } else {
      const scroller =
        scrollContainerRef?.current ? scrollContainerRef.current : window
      tween = gsap.fromTo(charElements, from, {
        ...to,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          end: scrollEnd,
          scrub: true,
        },
      })
    }

    return () => {
      tween?.scrollTrigger?.kill()
      tween?.kill()
    }
  }, [
    scrollContainerRef,
    animationDuration,
    ease,
    scrollStart,
    scrollEnd,
    stagger,
    playOnMount,
    children,
  ])

  return (
    <h2 ref={containerRef} className={`scroll-float ${containerClassName}`}>
      <span className={`scroll-float-text ${textClassName}`}>{splitText}</span>
    </h2>
  )
}
