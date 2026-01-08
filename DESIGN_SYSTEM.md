# Design System

**Apply this system to ALL frontend changes. No exceptions.**

**Brand Archetype:** Jester - Playful, warm, optimistic, relatable

---

## Foundation: Warm & Inviting Light Mode

Discovery-first light interface with warm accent colors. Think "friendly movie companion" - approachable, playful, and inviting.

### Core Principles

1. **Delightful interactions** - Subtle animations, playful micro-interactions
2. **Warm and inviting** - Cream/golden accents prevent cold/sterile feeling
3. **Simple and intuitive** - Ease of use, clear navigation
4. **Touch-first** - Minimum 44px targets
5. **Paired animations** - Every enter has matching exit

---

## Layout System

### Sidebar Pattern

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
--surface-elevated: #FFFCF5;  /* cream-white */
--surface-card: #FFFCF5;
--sidebar-bg: #F8F6EE;         /* warm cream undertone */
```

### Command Palette (Cmd+K)

- Instant open (no delay)
- Recent searches + suggestions + actions
- Keyboard navigation (arrows + Enter)
- Dimmed backdrop with blur

---

## Color System

### Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Cream | `#F0ECAC` | Soft accents, hover fills, subtle highlights |
| Golden | `#EEC745` | Primary buttons, CTAs, excellent match badges |
| Orange-red | `#E04A28` | Hover states, secondary emphasis, good badges |
| Deep red | `#B01110` | Logo accent, links, strong emphasis |

### Core Surfaces (Warm Cream System)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#FAF8F0` | Primary background (cream-tinted) |
| `--bg-elevated` | `#FFFCF5` | Sidebar, elevated surfaces (cream-white) |
| `--bg-surface` | `#FFFCF5` | Cards, modals, popovers |
| `--bg-overlay` | `rgba(0,0,0,0.5)` | Modal/palette backdrops |

### Surface Scale (Brand-Tinted)

| Element | Value | Usage |
|---------|-------|-------|
| Surface low | `bg-brand-cream/20` | Subtle backgrounds, inactive buttons |
| Surface mid | `bg-brand-cream/30` | Hover states, pills |
| Surface high | `bg-brand-cream/40` | Active/pressed states |
| Border subtle | `border-brand-cream/40` | Dividers, card borders |
| Border hover | `border-brand-cream/50` | Hover state borders |
| Border active | `border-brand-golden/40` | Focus/active borders |

### Text Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `text-gray-900` | Headings, important text |
| Secondary | `text-gray-600` | Body text, descriptions |
| Muted | `text-gray-400` | Placeholders, hints, section labels |
| Accent | `text-brand-red` | Links, active items |

### Accent Colors (Tailwind)

```js
brand: {
  cream: '#F0ECAC',
  golden: '#EEC745',
  orange: '#E04A28',
  red: '#B01110',
}
```

### Match Badge Colors

| Tier | Range | Style |
|------|-------|-------|
| Excellent | 70%+ | `bg-brand-golden text-[#481B13] font-bold` + sparkle icon |
| Good | 50-69% | `bg-brand-orange/80 text-white` |
| Fair | <50% | `bg-gray-200 text-gray-600` |

---

## Typography

| Role | Font | Weights | Tailwind |
|------|------|---------|----------|
| Logo/Brand | Pacifico | 400 | `font-display` |
| Headings | Rubik | 500, 600, 700 | `font-heading` |
| Body | Rubik | 400, 500, 600 | `font-sans` |

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
  text-gray-600 hover:text-gray-900 hover:bg-gray-100
  transition-colors duration-200"

// Active state
className="bg-brand-cream/30 text-brand-red border-l-2 border-brand-red"

// Collapsed state (icon only)
className="w-11 h-11 flex items-center justify-center rounded-xl
  text-gray-500 hover:text-gray-900 hover:bg-gray-100"
```

### Section Label (Sidebar)

```jsx
className="text-xs font-semibold text-gray-400 tracking-wider uppercase px-3 mb-2"
```

### Pills/Chips (Inactive)

```jsx
className="px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap
  bg-gray-100 border border-gray-200 text-gray-600
  hover:text-gray-900 hover:border-gray-300
  hover:bg-gray-200
  transition-all duration-200"
```

### Pills/Chips (Active)

```jsx
className="px-4 py-2.5 rounded-2xl text-sm font-medium
  bg-brand-golden/20 text-brand-orange
  border border-brand-golden/30
  shadow-[0_0_12px_rgba(238,199,69,0.15)]"
```

### Primary Button

```jsx
className="h-11 px-6 rounded-full
  bg-gradient-to-br from-brand-golden to-brand-orange
  text-white font-semibold
  shadow-lg shadow-brand-golden/25
  hover:shadow-brand-golden/40
  transition-all duration-200"
```

### Secondary Button (Ghost)

```jsx
className="h-11 px-5 rounded-full
  bg-gray-100 border border-gray-200
  text-gray-700 font-medium
  hover:bg-gray-200 hover:text-gray-900
  transition-colors"
```

### Icon Button

```jsx
className="w-11 h-11 rounded-xl
  bg-gray-100 border border-gray-200
  flex items-center justify-center
  text-gray-600 hover:bg-gray-200 hover:text-gray-900
  transition-colors"
```

### Search Input (Hero)

```jsx
className="h-14 px-5 rounded-2xl w-full
  bg-white border border-gray-200
  text-lg text-gray-900 placeholder:text-gray-400
  focus:bg-white focus:border-brand-golden/50
  focus:shadow-[0_0_20px_rgba(238,199,69,0.15)]
  transition-all outline-none"
```

### Search Input (Compact)

```jsx
className="h-10 pl-9 pr-4 rounded-xl w-full
  bg-gray-100 border border-transparent
  text-sm text-gray-900 placeholder:text-gray-400
  focus:border-gray-300 focus:bg-white
  transition-colors outline-none"
```

### Glass Card (Main containers)

```jsx
className="rounded-[1.75rem] bg-white
  border border-gray-200
  shadow-xl shadow-gray-200/50"
```

### Discovery Card (Horizontal scroll)

```jsx
className="w-[180px] shrink-0 scroll-snap-align-start"

// Image container
className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100"

// Hover
whileHover={{ scale: 1.03, y: -2 }}
```

### Mood Card (Category grid)

```jsx
className="aspect-video rounded-2xl overflow-hidden relative cursor-pointer"

// Gradient backgrounds per category
const MOOD_GRADIENTS = {
  vibes: "from-purple-500/80 to-pink-400/80",
  moods: "from-rose-500/80 to-red-400/80",
  chaos: "from-orange-500/80 to-amber-400/80",
  brainy: "from-cyan-500/80 to-blue-400/80",
  dark: "from-slate-700/90 to-gray-800/90",
  comfort: "from-brand-golden/80 to-yellow-300/80",
  late: "from-indigo-600/80 to-violet-500/80",
  specific: "from-emerald-500/80 to-teal-400/80"
};
```

### Command Palette

```jsx
// Backdrop
className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"

// Modal
className="w-[90%] max-w-[600px] max-h-[480px]
  bg-white border border-gray-200
  rounded-2xl shadow-2xl overflow-hidden"

// Input
className="h-14 px-5 text-lg bg-transparent border-b border-gray-200
  text-gray-900 placeholder:text-gray-400 outline-none w-full"

// Item (default)
className="px-4 py-3 flex items-center gap-3 cursor-pointer
  text-gray-600 hover:bg-gray-100 transition-colors"

// Item (selected)
className="bg-gray-100 text-gray-900"
```

### Filter Bar

```jsx
// Container
className="flex items-center gap-3 mb-6 overflow-x-auto scrollbar-none py-1"

// Weight pills group
className="flex gap-1 p-1 bg-gray-100 rounded-full shrink-0"

// Type filter pills
className="flex gap-1 shrink-0"

// Sort dropdown
className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
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
- **Playful**: Subtle bounce adds personality

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
  bg-white shadow-2xl"

// Backdrop
className="fixed inset-0 bg-black/40 z-[99]"

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

Write like a friend texting movie recs:

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
| MovieCard | `src/components/MovieCard.jsx` | Hover lift, brand badges, 3D tilt |
| MovieModal | `src/components/MovieModal.jsx` | "More Like This", trailer embed |

---

## Checklist for New Components

- [ ] Uses brand accent system (golden, orange, red)
- [ ] Minimum 44px touch targets
- [ ] Has hover + tap states with spring physics
- [ ] Wrapped in AnimatePresence if conditional
- [ ] Has matching exit animation
- [ ] Respects `prefers-reduced-motion`
- [ ] Works with sidebar collapsed/expanded
- [ ] Mobile-responsive (drawer not sidebar on <768px)
- [ ] Uses design tokens from this system
