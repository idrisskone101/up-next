# Design System

**Apply this system to ALL frontend changes. No exceptions.**

## Foundation: Dark Luxury Cinema

Moody, premium dark interface with warm amber/gold accents. Think "private screening room" not "Netflix browse mode."

## Color System

| Element | Value | Usage |
|---------|-------|-------|
| Background | `#0a0a0f` | Deep warm black base |
| Surface low | `bg-white/[0.03]` | Subtle card backgrounds |
| Surface mid | `bg-white/[0.06]` | Hover states, elevated cards |
| Surface high | `bg-white/[0.10]` | Active/pressed states |
| Border subtle | `border-white/[0.05]` | Dividers, inactive borders |
| Border normal | `border-white/[0.08]` | Card borders |
| Border hover | `border-white/[0.15]` | Hover state borders |
| Text muted | `text-white/40` | Tertiary text, placeholders |
| Text secondary | `text-white/60` | Secondary labels |
| Text primary | `text-white/90` | Primary content (never pure white) |
| Accent | `amber-400` to `amber-600` | CTAs, active states |
| Accent glow | `shadow-[0_0_12px_rgba(245,158,11,0.15)]` | Active indicator glow |
| Active bg | `bg-amber-500/20` | Selected state background |
| Active text | `text-amber-300` | Selected state text |
| Active border | `border-amber-500/30` | Selected state border |

## Shape Language

```css
/* Pills & chips */
rounded-full or rounded-2xl

/* Cards */
rounded-[1.75rem] or rounded-[2rem]

/* Never use sharp corners - minimum rounded-lg */
```

## Surface Treatment (Glassmorphism-lite)

```css
/* Standard glass surface */
background: linear-gradient(to bottom-right, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
border: 1px solid rgba(255,255,255,0.08);

/* Tailwind equivalent */
className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]"

/* Heavy glass (main cards only) */
className="bg-black/50 backdrop-blur-2xl border border-white/[0.08]"
```

## Micro-interactions (Required)

```jsx
/* Hover - lift + scale */
whileHover={{ scale: 1.03, y: -2 }}

/* Tap - compress */
whileTap={{ scale: 0.97 }}

/* Transitions */
className="transition-all duration-200"

/* Focus - amber glow, never harsh outlines */
className="focus:border-amber-500/40 focus:shadow-[0_0_12px_rgba(245,158,11,0.15)]"
```

## Typography

| Font | Usage | Tailwind |
|------|-------|----------|
| Syne | Headings, display text | `font-heading` or `font-display` |
| Cabinet Grotesk | Body text, UI labels | `font-sans` |
| Instrument Serif | Logo/wordmark only | `font-serif` |

## Spacing Philosophy

- **Touch targets:** Minimum 44px (h-11, py-2.5 px-4)
- **Gaps:** `gap-2` tight groups, `gap-3` normal separation
- **Padding:** `px-4 py-2.5` for buttons, `px-5 py-5` for cards
- **Let elements breathe** - generous whitespace over density

## Mobile-First Patterns

```jsx
/* Horizontal scroll carousels (not wrapping grids on mobile) */
className="flex gap-2 overflow-x-auto scrollbar-none"
style={{ WebkitOverflowScrolling: 'touch' }}

/* Hide scrollbars */
className="scrollbar-none" /* defined in index.css */
```

## Component Patterns

### Pills/Chips (inactive)
```jsx
className="px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap
  bg-gradient-to-br from-white/[0.06] to-white/[0.02]
  border border-white/[0.08] text-white/60
  hover:text-white/90 hover:border-white/15
  hover:from-white/[0.1] hover:to-white/[0.04]
  transition-all duration-200"
```

### Pills/Chips (active)
```jsx
className="px-4 py-2.5 rounded-2xl text-sm font-medium
  bg-amber-500/20 text-amber-300
  border border-amber-500/30
  shadow-[0_0_12px_rgba(245,158,11,0.15)]"
```

### Primary Button
```jsx
className="h-11 px-6 rounded-full
  bg-gradient-to-br from-amber-400 to-amber-600
  text-white font-medium
  shadow-lg shadow-amber-500/25
  hover:shadow-amber-500/40
  transition-all duration-200"
```

### Glass Card
```jsx
className="rounded-[1.75rem] bg-black/50 backdrop-blur-2xl
  border border-white/[0.08]
  shadow-2xl shadow-black/50"
```

## Key Principles

1. **Depth through subtlety** - Use gradients and glows, not heavy drop shadows
2. **Warmth in darkness** - Amber accents prevent cold/sterile feeling
3. **Imply more content** - Horizontal scroll hints at discovery
4. **Premium restraint** - Few colors, consistent radii, quiet confidence
5. **Touch-first always** - Design for thumbs, enhance for cursors

## Copy Voice (for UI text)

Write like a friend texting movie recs at 2am:
- Internet-native vernacular ("hot girl summer energy", "doom scroll")
- Temporal anchoring ("That 3am can't-sleep melancholy")
- Emotional honesty ("need a good ugly cry" not "emotionally moving")
- Hyper-specific scenarios ("Heist crew with sexual tension")

**Avoid:** Corporate streaming language, generic genre labels, formal phrasing.
