# 60 Below | Interactive WebGL Experience

A browser-based creative technology project for 60 Below, combining interactive brand presentation, real-time WebGL rendering, motion, audio, and experimental UI.

Live site: [www.60below.com](https://www.60below.com)

## Project highlights

- Scroll-driven multi-scene navigation
- Real-time WebGL and GLSL visual effects
- Interactive 3D brand geometry and particle systems
- Responsive desktop and mobile layouts
- Interactive work showcase with filtering and deep links
- Local keyword search and browser-based room synchronization

## Technology

- JavaScript and Node.js
- WebGL, GLSL, Hydra, and GLUI
- Three.js for generated brand geometry
- WebSocket-based local synchronization
- Playwright and GitHub Actions for project checks

## Run locally

Requires Node.js 20 or newer.

```bash
npm ci
npm run build
npm run dev
```

Open [http://localhost:4199](http://localhost:4199) after the development server starts. Run `npm test` for the full automated check suite.

## Attribution

The rendering runtime and selected source assets are adapted from Active Theory's public Hydra/WebGL release. The project-specific brand content, geometry, cover media, and integration work are maintained in this repository. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for source and license details.
