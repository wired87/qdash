/**
 * Shim for @heroui/dom-animation so it is bundled in the main chunk.
 * HeroUI components use dynamic import("@heroui/dom-animation"), which CRA
 * code-splits into a chunk that can fail to load (ChunkLoadError). By aliasing
 * @heroui/dom-animation to this file and importing it eagerly in index.tsx,
 * the same code lives in the main bundle and the dynamic import resolves to it.
 */
export { domAnimation as default } from 'framer-motion';
