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

---

## UX & Animation System

**Every animation must be mobile-first, smooth, and purposeful.**

### Animation Philosophy

1. **Purpose-driven**: Every animation serves UX (feedback, orientation, delight)
2. **Mobile-first**: Design for touch, 60fps on low-end devices
3. **Interruptible**: User can cancel/redirect mid-animation
4. **Consistent**: Shared spring configs from `src/lib/animations.js`
5. **Paired**: Every enter animation has a matching exit

### Entry/Exit Rules (CRITICAL)

```jsx
/* ALWAYS wrap conditional renders in AnimatePresence */
<AnimatePresence mode="wait">
  {show && (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}  /* REQUIRED - never omit */
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    />
  )}
</AnimatePresence>
```

**Rules:**
- Every `initial` needs matching `exit`
- AnimatePresence required for exit animations to fire
- Elements exit same direction they entered (or reverse for natural flow)
- No orphaned animations: never animate in without animate out

### Mobile Animation Guidelines

| Property | Guideline |
|----------|-----------|
| Transform properties | Prefer `scale`, `rotate`, `x`, `y` (GPU-accelerated) |
| Opacity | Safe, GPU-accelerated |
| Duration (micro) | Max 300ms for buttons, hovers, toggles |
| Duration (page) | Max 500ms for modals, page transitions |
| Physics | Spring over easing (feels natural on touch) |
| Touch feedback | Immediate response <100ms |
| Reduced motion | Always respect `prefers-reduced-motion` |

### Spring Configurations

Import from `src/lib/animations.js`:

```jsx
import { springConfigs } from '@/lib/animations';

// Available configs:
springConfigs.bouncy   // { stiffness: 300, damping: 24, mass: 0.8 } - buttons, cards
springConfigs.snappy   // { stiffness: 400, damping: 30, mass: 0.5 } - hover states
springConfigs.wobbly   // { stiffness: 250, damping: 20, mass: 1 }   - emphasis
springConfigs.gentle   // { stiffness: 180, damping: 26, mass: 1 }   - modals
springConfigs.soft     // { stiffness: 120, damping: 24, mass: 1 }   - backgrounds
```

### Animation Patterns

**Staggered Children:**
```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

<motion.div variants={container} initial="hidden" animate="show" exit="exit">
  {items.map(i => <motion.div key={i} variants={item} />)}
</motion.div>
```

**Layout Animations (shared element transitions):**
```jsx
<LayoutGroup>
  <motion.div layout layoutId="shared-element" />
</LayoutGroup>
```

**Hover + Tap (touch-first):**
```jsx
<motion.button
  whileHover={{ scale: 1.03, y: -2 }}
  whileTap={{ scale: 0.97 }}
  transition={springConfigs.snappy}
/>
```

### Anti-Patterns (DO NOT)

- ❌ Animate without AnimatePresence for conditionals
- ❌ Use CSS transitions for complex sequences (use Framer Motion)
- ❌ Animate layout properties directly (width, height, top, left)
- ❌ Exceed 500ms for any single animation
- ❌ Use different easing for related elements
- ❌ Animate in without animating out
- ❌ Ignore `prefers-reduced-motion`

### Accessibility

```jsx
import { prefersReducedMotion, getTransition } from '@/lib/animations';

// Check user preference
if (prefersReducedMotion()) {
  // Use instant transitions or skip animation
}

// Or use helper that auto-handles reduced motion
transition={getTransition(springConfigs.bouncy)}
```

### Component Reference

Study these implementations for patterns:

| Component | File | Key Patterns |
|-----------|------|--------------|
| MovieCard | `src/components/MovieCard.jsx` | Entry/exit stagger, hover lift+scale, 3D tilt |
| ResultsGrid | `src/components/ResultsGrid.jsx` | Diagonal wave stagger, pull-to-refresh, layout animations |
| HeroSearchCard | `src/components/HeroSearchCard.jsx` | Focus glow animation, category tab switching |
| EmptyState | `src/components/EmptyState.jsx` | Floating icon, staggered children |
| BottomNav | `src/components/BottomNav.jsx` | Hide/show on scroll, `layoutId` for active indicator |
| SearchMetadata | `src/components/SearchMetadata.jsx` | Expand/collapse, progress bar fill |

### Checklist for New Animations

Before shipping any animated component:

- [ ] Has `exit` prop matching `initial` direction
- [ ] Wrapped in `AnimatePresence` if conditional
- [ ] Uses spring physics (not duration-based easing)
- [ ] Duration ≤300ms (micro) or ≤500ms (page transition)
- [ ] Uses GPU-accelerated properties only
- [ ] Respects `prefers-reduced-motion`
- [ ] Tested on mobile (touch, 60fps)
- [ ] Animation serves UX purpose (not just decoration)
