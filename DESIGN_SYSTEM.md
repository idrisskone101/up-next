# Design System

**Apply this system to ALL frontend changes. No exceptions.**

**Inspiration:** Arc browser (minimal chrome, command palette, clean sidebar) + Spotify (discovery feeds, rich cards, smooth transitions)

---

## Foundation: Cinematic Command Center

Discovery-first dark interface with warm amber accents. Think "Arc browser meets private screening room" - minimal, spatial, and inviting exploration.

### Core Principles

1. **Discovery over search** - Content surfaces before you ask
2. **Spatial organization** - Sidebar provides persistent context
3. **Progressive disclosure** - Collapsed states reveal depth on demand
4. **Warm darkness** - Amber accents prevent cold/sterile feeling
5. **Fluid transitions** - Every state change is animated and purposeful

---

## Layout System

### Sidebar Pattern (Arc-inspired)

```
+--------+------------------------------------------------+
|        |                                                |
| SIDE   |            MAIN CONTENT                        |
| BAR    |                                                |
| 64px   |    Hero / Discovery / Results                  |
|  or    |                                                |
| 280px  |                                                |
+--------+------------------------------------------------+
```

| State | Width | Usage |
|-------|-------|-------|
| Collapsed | `64px` (icon rail) | Default, maximizes content |
| Expanded | `280px` | Full navigation visible |
| Mobile | `0` → `85vw` drawer | Hidden until hamburger/swipe |

**CSS Variables:**
```css
--sidebar-collapsed: 64px;
--sidebar-expanded: 280px;
--surface-elevated: #121218;
--surface-card: #1a1a22;
```

### Command Palette (Cmd+K)

Arc-inspired overlay for power users:
- Instant open (no delay)
- Recent searches + suggestions + actions
- Keyboard navigation (arrows + Enter)
- Dimmed backdrop with blur

---

## Color System

### Core Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0a0a0f` | Primary background |
| `--bg-elevated` | `#121218` | Sidebar, elevated surfaces |
| `--bg-surface` | `#1a1a22` | Cards, modals |
| `--bg-overlay` | `rgba(10,10,15,0.8)` | Modal/palette backdrops |

### Surface Opacity Scale

| Element | Value | Usage |
|---------|-------|-------|
| Surface low | `bg-white/[0.03]` | Subtle backgrounds |
| Surface mid | `bg-white/[0.06]` | Hover states, cards |
| Surface high | `bg-white/[0.10]` | Active/pressed states |
| Border subtle | `border-white/[0.06]` | Dividers, sidebar border |
| Border normal | `border-white/[0.08]` | Card borders |
| Border hover | `border-white/[0.15]` | Hover state borders |

### Text Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `text-white/90` | Headings, important text |
| Secondary | `text-white/65` | Body text, descriptions |
| Muted | `text-white/40` | Placeholders, hints, section labels |
| Accent | `text-amber-300` | Links, active items |

### Amber Accent System (ONLY amber - no cyan)

| Token | Hex | Usage |
|-------|-----|-------|
| `amber-300` | `#FCD34D` | Active text |
| `amber-400` | `#FBBF24` | Primary buttons |
| `amber-500` | `#F59E0B` | Hover accents |
| `amber-600` | `#D97706` | Pressed states |
| Glow | `rgba(245,158,11,0.15)` | Focus rings, active glows |

### Match Badge Colors (Unified Amber)

| Tier | Range | Style |
|------|-------|-------|
| Excellent | 70%+ | `bg-amber-500/90 text-black font-bold` + sparkle icon |
| Good | 50-69% | `bg-amber-600/80 text-white` |
| Fair | <50% | `bg-white/20 text-white/70` |

**IMPORTANT:** Never use cyan/teal for badges. All match indicators use amber scale.

---

## Typography

| Role | Font | Weights | Tailwind |
|------|------|---------|----------|
| Logo/Brand | Pacifico | 400 | `font-display` |
| Headings | Outfit | 500, 600, 700 | `font-heading` |
| Body | Nunito | 400, 500, 600 | `font-sans` |

### Type Scale

```
text-xs:    12px   (badges, captions)
text-sm:    14px   (body, metadata)
text-base:  16px   (default body)
text-lg:    18px   (emphasized)
text-xl:    20px   (card titles)
text-2xl:   24px   (section headers)
text-3xl:   30px   (page titles)
text-4xl:   36px   (hero text)
```

---

## Shape Language

```css
/* Pills & chips */
rounded-full or rounded-2xl

/* Cards */
rounded-xl (standard)
rounded-[1.75rem] (featured)
rounded-[2rem] (hero cards)

/* Sidebar items */
rounded-lg

/* Never sharp corners - minimum rounded-lg */
```

---

## Component Patterns

### Sidebar Navigation Item

```jsx
// Expanded state
className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
  text-white/70 hover:text-white/90 hover:bg-white/[0.04]
  transition-colors duration-200"

// Active state
className="bg-amber-500/15 text-amber-300 border-l-2 border-amber-400"

// Collapsed state (icon only)
className="w-11 h-11 flex items-center justify-center rounded-xl
  text-white/50 hover:text-white/90 hover:bg-white/[0.08]"
```

### Section Label (Sidebar)

```jsx
className="text-xs font-semibold text-white/40 tracking-wider uppercase px-3 mb-2"
```

### Pills/Chips (Inactive)

```jsx
className="px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap
  bg-gradient-to-br from-white/[0.06] to-white/[0.02]
  border border-white/[0.08] text-white/60
  hover:text-white/90 hover:border-white/15
  hover:from-white/[0.1] hover:to-white/[0.04]
  transition-all duration-200"
```

### Pills/Chips (Active)

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
  text-white font-semibold
  shadow-lg shadow-amber-500/25
  hover:shadow-amber-500/40
  transition-all duration-200"
```

### Secondary Button (Ghost)

```jsx
className="h-11 px-5 rounded-full
  bg-white/[0.06] border border-white/10
  text-white/80 font-medium
  hover:bg-white/[0.1] hover:text-white
  transition-colors"
```

### Icon Button

```jsx
className="w-11 h-11 rounded-xl
  bg-white/[0.04] border border-white/[0.06]
  flex items-center justify-center
  text-white/70 hover:bg-white/[0.08] hover:text-white
  transition-colors"
```

### Search Input (Hero)

```jsx
className="h-14 px-5 rounded-2xl w-full
  bg-white/[0.04] border border-white/[0.08]
  text-lg text-white placeholder:text-white/35
  focus:bg-white/[0.06] focus:border-amber-500/40
  focus:shadow-[0_0_20px_rgba(245,158,11,0.1)]
  transition-all outline-none"
```

### Search Input (Compact)

```jsx
className="h-10 pl-9 pr-4 rounded-xl w-full
  bg-white/[0.06] border border-transparent
  text-sm text-white placeholder:text-white/40
  focus:border-white/15 focus:bg-white/[0.08]
  transition-colors outline-none"
```

### Glass Card (Main containers)

```jsx
className="rounded-[1.75rem] bg-black/50 backdrop-blur-2xl
  border border-white/[0.08]
  shadow-2xl shadow-black/50"
```

### Discovery Card (Horizontal scroll)

```jsx
className="w-[180px] shrink-0 scroll-snap-align-start"

// Image container
className="aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.04]"

// Hover
whileHover={{ scale: 1.03, y: -2 }}
```

### Mood Card (Category grid)

```jsx
className="aspect-video rounded-2xl overflow-hidden relative cursor-pointer"

// Gradient backgrounds per category
const MOOD_GRADIENTS = {
  vibes: "from-purple-600/80 to-pink-500/80",
  moods: "from-rose-600/80 to-red-500/80",
  chaos: "from-orange-600/80 to-amber-500/80",
  brainy: "from-cyan-600/80 to-blue-500/80",
  dark: "from-slate-800/90 to-gray-900/90",
  comfort: "from-amber-500/80 to-yellow-400/80",
  late: "from-indigo-700/80 to-violet-600/80",
  specific: "from-emerald-600/80 to-teal-500/80"
};
```

### Command Palette

```jsx
// Backdrop
className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"

// Modal
className="w-[90%] max-w-[600px] max-h-[480px]
  bg-[#121218] border border-white/10
  rounded-2xl shadow-2xl overflow-hidden"

// Input
className="h-14 px-5 text-lg bg-transparent border-b border-white/[0.06]
  text-white placeholder:text-white/40 outline-none w-full"

// Item (default)
className="px-4 py-3 flex items-center gap-3 cursor-pointer
  text-white/70 hover:bg-white/[0.04] transition-colors"

// Item (selected)
className="bg-white/[0.08] text-white"
```

### Filter Bar

```jsx
// Container
className="flex items-center gap-3 mb-6 overflow-x-auto scrollbar-none py-1"

// Weight pills group
className="flex gap-1 p-1 bg-white/[0.04] rounded-full shrink-0"

// Type filter pills
className="flex gap-1 shrink-0"

// Sort dropdown
className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1.5 text-sm"
```

---

## Spacing System

### Base Scale (4px increments)

```
space-1:   4px
space-2:   8px
space-3:   12px
space-4:   16px
space-5:   20px
space-6:   24px
space-8:   32px
space-10:  40px
space-12:  48px
```

### Touch Targets

**Minimum 44px for all interactive elements.**

```jsx
// Buttons
className="h-11 ..." // 44px

// Icon buttons
className="w-11 h-11 ..."

// Nav items
className="py-2.5 ..." // ~44px with text
```

### Container Spacing

| Context | Padding |
|---------|---------|
| Mobile | `px-4` (16px) |
| Desktop | `px-6` (24px) |
| Cards | `p-5` or `p-6` |
| Modals | `p-6` |
| Sections | `py-12` (48px) vertical |

---

## Animation System

### Philosophy

- **Purpose-driven**: Every animation serves UX
- **Mobile-first**: 60fps on low-end devices
- **Spring physics**: Natural feel over duration-based
- **Paired**: Every enter has matching exit

### Spring Configurations

```js
// Import from src/lib/animations.js
springConfigs = {
  bouncy:  { stiffness: 300, damping: 24 },  // Buttons, cards
  snappy:  { stiffness: 400, damping: 30 },  // Hover states
  wobbly:  { stiffness: 250, damping: 20 },  // Emphasis
  gentle:  { stiffness: 180, damping: 26 },  // Modals, drawers
  soft:    { stiffness: 120, damping: 24 },  // Backgrounds
}
```

### Duration Limits

| Type | Max Duration |
|------|--------------|
| Micro-interactions | 300ms |
| Page transitions | 500ms |
| Sidebar expand/collapse | 300ms |
| Modal open/close | 400ms |

### Standard Animations

**Hover + Tap:**
```jsx
whileHover={{ scale: 1.03, y: -2 }}
whileTap={{ scale: 0.97 }}
transition={{ type: "spring", stiffness: 400, damping: 25 }}
```

**Staggered Children:**
```jsx
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};
```

**Sidebar Expand:**
```jsx
animate={{ width: isOpen ? 280 : 64 }}
transition={{ type: "spring", stiffness: 300, damping: 24 }}
```

**Modal:**
```jsx
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.97, y: 10 }}
```

### Entry/Exit Rules

```jsx
// ALWAYS wrap conditional renders
<AnimatePresence>
  {show && (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}  // REQUIRED
    />
  )}
</AnimatePresence>
```

### Accessibility

```jsx
// Always respect user preference
import { prefersReducedMotion } from '@/lib/animations';

if (prefersReducedMotion()) {
  // Skip or use instant transitions
}
```

---

## Mobile Patterns

### Sidebar as Drawer

```jsx
// Drawer container
className="fixed inset-y-0 left-0 w-[85vw] max-w-[320px] z-[100]
  bg-[--surface-elevated]"

// Backdrop
className="fixed inset-0 bg-black/60 z-[99]"

// Open via: hamburger tap OR swipe-right from left edge (20px)
// Close via: swipe-left OR tap backdrop OR Escape
```

### Horizontal Scroll

```jsx
className="flex gap-4 overflow-x-auto scrollbar-none
  scroll-snap-type-x-mandatory px-4 -mx-4"
style={{ WebkitOverflowScrolling: 'touch' }}

// Cards
className="scroll-snap-align-start shrink-0"

// Fade edges
className="[mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]"
```

### Safe Areas

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
```

---

## Copy Voice

Write like a friend texting movie recs at 2am:

**Do:**
- Internet-native vernacular ("hot girl summer energy")
- Temporal anchoring ("That 3am can't-sleep melancholy")
- Emotional honesty ("need a good ugly cry")
- Hyper-specific scenarios ("Heist crew with sexual tension")

**Don't:**
- Corporate streaming language
- Generic genre labels
- Formal phrasing
- Passive voice

---

## Component Reference

| Component | File | Patterns Used |
|-----------|------|---------------|
| Sidebar | `src/components/Sidebar/Sidebar.jsx` | Collapsible nav, stagger animation |
| MobileDrawer | `src/components/Sidebar/MobileDrawer.jsx` | Slide drawer, backdrop, swipe |
| CommandPalette | `src/components/CommandPalette/` | Overlay, keyboard nav, sections |
| DiscoverySection | `src/components/Discovery/` | Horizontal scroll, mood grid |
| FilterBar | `src/components/FilterBar.jsx` | Pill toggles, sort dropdown |
| MovieCard | `src/components/MovieCard.jsx` | Hover lift, amber badges, 3D tilt |
| MovieModal | `src/components/MovieModal.jsx` | "More Like This", trailer embed |

---

## Checklist for New Components

- [ ] Uses amber accent system (no cyan)
- [ ] Minimum 44px touch targets
- [ ] Has hover + tap states with spring physics
- [ ] Wrapped in AnimatePresence if conditional
- [ ] Has matching exit animation
- [ ] Respects `prefers-reduced-motion`
- [ ] Works with sidebar collapsed/expanded
- [ ] Mobile-responsive (drawer not sidebar on <768px)
- [ ] Uses design tokens from this system
