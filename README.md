# b1o — AI is not enemy, it's tool

Cinematic AI/developer portfolio with a wheel-driven particle intro.

## Intro interaction

- `b1o` is formed from particles.
- Mouse wheel / touch movement continuously scrubs the same particle field into a globe.
- The same particles continue into a 75% keyboard.
- Hands animate over the completed keyboard.
- Only after the keyboard state is complete does normal page scrolling unlock.
- Scrolling back to the top lets the particle sequence reverse.

## React Bits Pro

The repo includes a `components.json` registry setup and `.env.example` for React Bits Pro. The documented Particle Morph component exposes ordered image sources and a controlled `activeIndex`; it does not expose a continuous particle-progress prop. Because this design requires true wheel-by-wheel interpolation, the intro uses a local GPU-friendly canvas morph implementation for the continuous scrub while keeping the project ready for React Bits Pro installs.

ASCII Ripple is also implemented locally so the repository remains runnable without a Pro license installed yet; it follows the same interactive monospace-liquid visual role.

React Bits Pro references:
- https://pro.reactbits.dev/docs/components/particle-morph
- https://pro.reactbits.dev/docs/components/ascii-ripple
- https://pro.reactbits.dev/docs/installation

## Run

```bash
npm install
npm run dev
```

For React Bits Pro CLI installs, copy `.env.example` to `.env.local` and add your `REACTBITS_LICENSE_KEY`.
