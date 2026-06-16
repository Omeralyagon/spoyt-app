# DESIGN.md — Steal My Flow design system

The visual language is **Kinetic Stillness** — warm stone, ink, and a single
earthen accent; premium, editorial, and calm. Full philosophy in
[`design/KINETIC_STILLNESS.md`](design/KINETIC_STILLNESS.md).

## Color tokens (HSL CSS variables, light)

| Token | Value | Usage |
|------|-------|-------|
| `--background` | `40 32% 90%` | App background (bone) |
| `--foreground` | `40 16% 11%` | Primary text (ink) |
| `--card` | `40 38% 93%` | Cards / surfaces |
| `--primary` | `14 50% 46%` | Clay accent — buttons, active states |
| `--muted-foreground` | `36 11% 38%` | Secondary text |
| `--border` | `40 18% 78%` | Borders / hairlines |
| `--destructive` | `4 64% 48%` | Errors |

A `.dark` theme is defined with the same token names.

## Typography

- **Display / headings:** Frank Ruhl Libre (serif, supports Hebrew + Latin) → `--font-serif`
- **Body / UI:** Heebo (sans, Hebrew + Latin) → `--font-sans`
- **Labels / clinical markers:** Space Mono → `--font-mono` (`.label-mono`)

## Direction

Fully bidirectional. `dir` is set per locale (`he` → RTL, `en` → LTR) and layouts
use logical properties (`ms-*`, `ps-*`, `start/end`) so they mirror correctly.

## Components

shadcn/ui primitives (`src/components/ui/*`): button, card, input, textarea,
label, badge, avatar, tabs, select, skeleton — all themed via the tokens above.

## Radius & spacing

`--radius: 0.5rem` (md = radius−2px, sm = radius−4px). Tailwind spacing scale,
generous negative space per the Kinetic Stillness philosophy.
