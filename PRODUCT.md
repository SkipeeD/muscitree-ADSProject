# Product

## Register

product

## Users

CS students and self-taught developers studying data structures and algorithms. They're at a desk, likely with lecture notes or a problem set open in another tab. The primary task is watching an algorithm execute step by step and understanding why it works — the music/BPM framing is a memorable hook, not the goal.

## Product Purpose

MusicTree makes abstract DSA concepts tangible by using songs as data. Users insert songs by name and BPM into a BST, search by BPM, run in-order traversal to see sorted output, and group songs into disjoint sets. The tool demonstrates BST insertion/search/traversal and union-find (Disjoint Sets with union by rank). Success is a student who, after using MusicTree, can mentally trace a BST search path or explain why path compression works.

## Brand Personality

Precise. Technical. Clear.

Voice: a senior engineer explaining an algorithm on a whiteboard — direct, no fluff, assumes intelligence. The music angle is a device for grounding abstract node IDs in something concrete, not a reason to go soft.

## Anti-references

- Not a Spotify clone: album art is data, not decoration. No music-player chrome, no waveforms, no playlist vibes.
- Not neon cyberpunk: no glowing neons on pure black, no anime-terminal aesthetic.
- Not generic SaaS: no hero metrics, no gradient CTAs, no card grids that all look identical.

## Design Principles

1. **The visualization is the UI.** The SVG tree and the forest of disjoint sets are not widgets inside a page — they are the page. Chrome competes with them; minimize it.
2. **State is always legible.** Search paths, union operations, and traversal highlights must communicate algorithm state at a glance, without prose explanation. Color, weight, and path are the language.
3. **Music earns its place.** BPM is the sort key; album art makes nodes distinguishable. Neither is decoration. Strip anything music-themed that doesn't serve algorithm comprehension.
4. **Precision over personality.** Exact spacing, monospaced accents, hard edges where softness would blur meaning. Roundness is earned, not defaulted.
5. **No explained UI.** If a user needs a tooltip to understand what a button does, the button is wrong. Labels, affordances, and layout should make function obvious.

## Accessibility & Inclusion

WCAG AA as minimum. Highlight states (search path, selected nodes, union components) must not rely on color alone — use stroke weight or shape changes as a second signal. Reduced motion: traversal animations should respect `prefers-reduced-motion`.
