# b1o — AI Experience

Cinematic interactive developer experience. A scroll-driven visual journey built around a custom particle system that morphs between states — intro → globe → keyboard — using GSAP timelines and Canvas rendering.

## Live Demo
🔗 [b-1-o.github.io/AI](https://b-1-o.github.io/AI/)

## Preview
![Preview](./assets/preview.jpeg)

![Demo](./assets/demo.gif)
*(GIF will be added — recording in progress)*

## Features
- Custom particle system on Canvas with continuous morphing between states
- GSAP-driven timeline: intro sequence → globe → keyboard
- Scroll-locked intro, reversible on scroll back to top
- GPU-friendly rendering with requestAnimationFrame + delta-time interpolation
- Component-based architecture (AIStack, AsciiRipple, BranchedMenu, CrystalNav, CrystalScroll, DecryptedText, DotCrystal)
- Fully responsive across desktop and mobile

## Tech Stack
React 19 · TypeScript · Vite · GSAP · Canvas API

## How it works
- The particle field is rendered on a single Canvas element; positions interpolate between keyframe states driven by GSAP timelines.
- The intro sequence locks scroll until complete, then hands control back to the user; scrolling back to top replays the transition in reverse.
- Each UI overlay (nav, menus, text) is a separate React component layered on top of the Canvas, so visuals and interaction stay decoupled.
- State transitions are triggered by scroll position, not timers, so the experience stays in sync with user input.

## Getting Started
```bash
git clone https://github.com/b-1-o/AI.git
cd AI
npm install
npm run dev
```
