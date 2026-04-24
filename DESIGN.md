# FrameMotion Design Brief

**App**: Image-to-video converter with real-time async processing.

**Tone**: Professional, minimal, focused. Motion-forward energy with teal accents. Zero decoration — functional clarity.

**Differentiation**: Clean drag-and-drop zone, real-time status cards with progress indication, full-width video preview, intentional surface hierarchy (header border, section backgrounds, footer divider).

## Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Background | `0.98 0 0` | `0.12 0 0` | Page surface |
| Foreground | `0.12 0 0` | `0.95 0 0` | Text, primary contrast |
| Card | `1.0 0 0` | `0.16 0 0` | Card, popover surfaces |
| Primary (Teal) | `0.65 0.15 215` | `0.75 0.18 215` | Buttons, active states, motion accent |
| Secondary | `0.92 0 0` | `0.2 0 0` | Secondary UI elements |
| Muted | `0.92 0 0` | `0.2 0 0` | Disabled, inactive states |
| Accent | `0.65 0.15 215` | `0.75 0.18 215` | Highlights, focus states |
| Destructive | `0.55 0.22 25` | `0.65 0.25 25` | Delete, error states |
| Border | `0.88 0 0` | `0.25 0 0` | Dividers, section separators |
| Input | `0.92 0 0` | `0.25 0 0` | Form fields |

## Typography

| Tier | Font | Weight | Size | Usage |
|------|------|--------|------|-------|
| Display | General Sans | 600 | 32px | Headlines, page title |
| Heading | General Sans | 600 | 24px | Section titles |
| Subheading | Satoshi | 500 | 18px | Card titles, labels |
| Body | Satoshi | 400 | 16px | Default text, descriptions |
| Caption | Satoshi | 400 | 14px | Timestamps, metadata |
| Mono | Geist Mono | 400 | 12px | Job IDs, technical info |

## Elevation & Depth

| Level | Shadow | Background | Usage |
|-------|--------|------------|-------|
| Flat | None | bg-background | Content areas, main sections |
| Card | shadow-card | bg-card | Job cards, upload zone, preview box |
| Elevated | shadow-elevated | bg-card | Header, floating panels (if needed) |
| Subtle | shadow-subtle | bg-card | Hover state, interactive elements |

## Structural Zones

| Zone | Background | Border | Usage |
|------|-----------|--------|-------|
| Header | bg-card | border-b border-border | Logo, nav tabs, dark mode toggle |
| Main Content | bg-background | None | Drag-drop upload, slider, preview section |
| Job History | bg-background | None | List of past conversions, grid/table |
| Alert/Toast | bg-primary | None | Error, success notifications |
| Footer | bg-muted/10 | border-t border-border | Footer info (if used) |

## Shape Language

- **Radius**: Minimal — `0.5rem` (8px) for cards, buttons, inputs. Zero radius for full-width sections.
- **Spacing**: 16px grid base — 8px, 16px, 24px, 32px, 48px increments.
- **Borders**: 1px, subtle grey, low contrast unless interactive.

## Motion & Interaction

- **Transitions**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` — smooth easing for state changes.
- **Processing State**: `animate-pulse-subtle` for job cards in progress (2s loop, 30% opacity dip).
- **Entry**: `animate-fade-in` (0.3s) + `animate-slide-down` (0.3s) for new job cards.
- **Constraints**: No bounce, no scale. Focus on fade + slide for a professional feel.

## Component Patterns

- **Buttons**: Primary (teal) for CTA, secondary (grey) for secondary actions, destructive (red) for delete.
- **Upload Zone**: Drag-drop border `border-dashed border-border`, hover to `border-primary`. Large icon + label.
- **Job Cards**: bg-card, shadow-card, status badge (green = done, orange = processing, red = failed). Timestamp in mono.
- **Video Preview**: Full width, max-height, HTML5 player with default controls.
- **Slider**: Teal track, no decoration, smooth drag.

## Constraints

- **No gradients** — solid colors only.
- **No decorative shapes** — layout and hierarchy only.
- **No floating icons** — clean alignment to grid.
- **Minimal animation** — fade and slide only, no bounce or scale.
- **Dark mode parity** — ensure all surfaces are intentional in both modes.

## Signature Detail

Teal motion accent used as primary CTA and active state indicator. Clean border dividers (header-bottom, footer-top) provide subtle structure without visual noise. Real-time job status cards show motion (pulse animation) for processing jobs — the only animation in the app, reinforcing the "motion" product focus.

## Contrast Verification

- **Light mode**: Foreground `0.12` on background `0.98` = ΔL 0.86 ✓
- **Dark mode**: Foreground `0.95` on background `0.12` = ΔL 0.83 ✓
- **Primary on background (light)**: Primary `0.65` on bg `0.98` = ΔL 0.33 (for interactive elements) ✓
- **Primary on background (dark)**: Primary `0.75` on bg `0.12` = ΔL 0.63 ✓
