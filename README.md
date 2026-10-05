# b1o — AI

> A cinematic interactive developer experience exploring AI, particles, motion, and GPU-friendly visual interfaces.

The project opens with a wheel-driven particle sequence that transforms the `b1o` identity into a globe, then into a keyboard interaction.

## Experience

- Particle-based `b1o` introduction
- Wheel and touch driven progression
- Continuous particle morphing
- Globe and keyboard states
- Animated hands
- Scroll locking during the intro
- Reversible interaction when returning to the top
- GPU-friendly canvas rendering
- ASCII ripple effects

## Tech Stack

React 19 · TypeScript · Vite · GSAP · Canvas · React Bits compatible architecture

## Getting Started

```bash
npm install
npm run dev
npm run build
npm run preview
```

## React Bits

The repository includes React Bits Pro configuration. Continuous particle interpolation is implemented locally because this experience requires continuous progress rather than discrete states.

If using React Bits Pro, configure `REACTBITS_LICENSE_KEY` through `.env.local` based on `.env.example`.

**Live:** https://b-1-o.github.io/AI/  
**Repository:** https://github.com/b-1-o/AI