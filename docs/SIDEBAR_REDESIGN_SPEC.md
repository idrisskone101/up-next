# Sidebar Redesign Specification

**Goal:** Unify the sidebar with the main app's cinematic aesthetic. The sidebar currently feels disconnected - it uses `#121218` (--surface-elevated) while the main app has rich depth with amber glows on `#0a0a0f`. This spec brings visual cohesion.

---

## Design Overview

The sidebar should feel like a natural extension of the cinematic viewing room - not a separate UI panel bolted on. We achieve this by:

1. **Matching the depth** - Base the sidebar on `#0a0a0f` with subtle gradients, not flat `#121218`
2. **Warm glow integration** - Add subtle amber radial gradients that connect to the main content
3. **Consistent border language** - Use the same `white/[0.06]` borders with amber hover accents
4. **Active state cohesion** - Active items use amber glow matching movie card hover states

---

## Color Palette (Sidebar-Specific)

### Background Treatment
| Element | Current | New Value | Tailwind/CSS |
|---------|---------|-----------|--------------|
| Sidebar base | `#121218` | `#0a0a0f` with gradient | See gradient spec below |
| Sidebar border | `border-white/[0.06]` | `border-white/[0.06]` | Keep as-is |
| Hover border accent | N/A | `border-amber-500/20` | On hover only |

### Sidebar Background Gradient (CSS)
```css
/* Replace solid --surface-elevated with this gradient */
background-color: #0a0a0f;
background-image:
  linear-gradient(180deg, rgba(18, 18, 24, 0.95) 0%, rgba(10, 10, 15, 1) 100%),
  radial-gradient(ellipse at 20% 0%, rgba(245, 158, 11, 0.04) 0%, transparent 50%);
```

**Tailwind equivalent:**
```jsx
className="bg-[#0a0a0f] bg-gradient-to-b from-[#121218]/95 to-[#0a0a0f]"
// Plus a pseudo-element for the amber glow
```

### Text Colors (Sidebar)
| Element | Current | New | Hex |
|---------|---------|-----|-----|
| Section labels | `text-white/40` | `text-white/35` | Keep muted |
| Nav item default | `text-white/70` | `text-white/60` | Slightly more muted |
| Nav item hover | `text-white/90` | `text-white` | Full brightness |
| Nav item active | `text-amber-300` | `text-amber-300` | Keep |
| Recent search | `text-white/70` | `text-white/55` | More muted |
| Recent search hover | `text-white/90` | `text-white/85` | Slightly muted |

---

## Component Specifications

### 1. Sidebar Container (DesktopSidebar)

**File:** `src/components/Sidebar/Sidebar.jsx`

**Current:**
```jsx
<motion.aside
  style={{ backgroundColor: "var(--surface-elevated)" }}
  className="... border-r border-white/[0.06]"
>
```

**New:**
```jsx
<motion.aside
  className="
    fixed top-0 left-0 h-dvh z-[60]
    flex flex-col overflow-hidden will-change-[width]
    bg-[#0a0a0f]
    border-r border-white/[0.06]
  "
  style={{
    backgroundImage: `
      linear-gradient(180deg, rgba(18, 18, 24, 0.9) 0%, rgba(10, 10, 15, 1) 100%),
      radial-gradient(ellipse at 30% 10%, rgba(245, 158, 11, 0.03) 0%, transparent 60%)
    `
  }}
>
```

**Reasoning:** The gradient creates depth from top to bottom, and the amber radial glow at top-left echoes the main content's ambient lighting.

---

### 2. Header Area (Logo + Toggle)

**Current header:**
```jsx
<div className="flex items-center h-16 px-2.5 shrink-0">
```

**New header with amber accent line:**
```jsx
<div className="relative flex items-center h-16 px-2.5 shrink-0">
  {/* Subtle amber accent line at bottom */}
  <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0" />
</div>
```

**Toggle button update:**
```jsx
// Current
whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
className="... text-white/60 hover:text-white/90"

// New - add amber tint on hover
whileHover={{
  scale: 1.05,
  backgroundColor: "rgba(245, 158, 11, 0.08)"
}}
className="
  flex items-center justify-center w-11 h-11 rounded-xl
  text-white/50 hover:text-amber-300/90
  transition-colors duration-200
"
```

**Logo text:**
```jsx
// Current
className="ml-2 font-display text-xl text-white whitespace-nowrap overflow-hidden"

// New - add subtle amber gradient
className="
  ml-2 font-display text-xl whitespace-nowrap overflow-hidden
  bg-gradient-to-r from-white via-white to-amber-200/80
  bg-clip-text text-transparent
"
```

---

### 3. Search Input (SidebarSearch)

**File:** `src/components/Sidebar/SidebarSearch.jsx`

**Current:**
```jsx
className="
  w-full h-10 pl-9 pr-3 rounded-xl
  bg-white/[0.04] border border-white/[0.06]
  text-sm text-white placeholder:text-white/30
  focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.06]
  focus:shadow-[0_0_20px_rgba(245,158,11,0.1)]
  transition-all duration-200
"
```

**New (minor refinements):**
```jsx
className="
  w-full h-10 pl-9 pr-3 rounded-xl
  bg-white/[0.03] border border-white/[0.05]
  text-sm text-white placeholder:text-white/25
  focus:outline-none focus:border-amber-500/30 focus:bg-white/[0.05]
  focus:shadow-[0_0_16px_rgba(245,158,11,0.08)]
  transition-all duration-200
"
```

**Search icon color:**
```jsx
// Current
className="... text-white/30"

// New
className="... text-white/25"
```

---

### 4. Section Labels (SidebarSection)

**File:** `src/components/Sidebar/SidebarSection.jsx`

**Current:**
```jsx
<span className="text-xs font-semibold text-white/40 tracking-wider uppercase">
```

**New - more refined with letter spacing:**
```jsx
<span className="text-[10px] font-semibold text-white/30 tracking-[0.15em] uppercase">
```

**Chevron:**
```jsx
// Current
className="text-white/30 group-hover:text-white/50 transition-colors"

// New
className="text-white/20 group-hover:text-amber-500/60 transition-colors"
```

---

### 5. Navigation Items (SidebarNav)

**File:** `src/components/Sidebar/SidebarNav.jsx`

**Default state (expanded):**
```jsx
// Current
text-white/70 hover:text-white/90 hover:bg-white/[0.04]

// New
text-white/55 hover:text-white/90 hover:bg-amber-500/[0.06]
```

**Active state:**
```jsx
// Current
bg-amber-500/15 text-amber-300 border-l-2 border-amber-400

// New (enhanced glow)
bg-amber-500/10 text-amber-300
border-l-2 border-amber-400
shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]
```

**Collapsed state (icon only):**
```jsx
// Current
className="w-11 h-11 flex items-center justify-center rounded-xl mx-auto"
text-white/50 hover:text-white/90 hover:bg-white/[0.08]

// New
className="
  w-11 h-11 flex items-center justify-center rounded-xl mx-auto
  text-white/40 hover:text-amber-300 hover:bg-amber-500/[0.08]
  transition-colors duration-200
"
```

**Motion hover update:**
```jsx
// Current
whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.04)" }}

// New
whileHover={{
  scale: 1.02,
  backgroundColor: "rgba(245, 158, 11, 0.06)"
}}
```

**Tooltip styling:**
```jsx
// Current
bg-black/90 border border-white/10

// New - warmer tooltip
bg-[#0a0a0f] border border-amber-500/15
shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_10px_rgba(245,158,11,0.05)]
```

---

### 6. Categories Submenu

**Border accent:**
```jsx
// Current
<div className="space-y-0.5 py-1 border-l border-white/[0.06] pl-3">

// New - amber tinted border
<div className="space-y-0.5 py-1 border-l border-amber-500/10 pl-3">
```

**Category items:**
```jsx
// Current
whileHover={{ x: 2, backgroundColor: "rgba(255,255,255,0.04)" }}
className="text-white/70 hover:text-white/90"

// New
whileHover={{ x: 2, backgroundColor: "rgba(245, 158, 11, 0.05)" }}
className="text-white/50 hover:text-amber-200/90"
```

---

### 7. Recent Searches (RecentSearches)

**File:** `src/components/Sidebar/RecentSearches.jsx`

**Search item:**
```jsx
// Current
className="text-sm text-white/70 truncate hover:text-white/90 hover:bg-white/[0.04]"

// New
className="text-sm text-white/50 truncate hover:text-white/85 hover:bg-amber-500/[0.04]"
```

**Remove button:**
```jsx
// Current
className="text-white/30 hover:text-white/70 hover:bg-white/10"

// New
className="text-white/20 hover:text-red-400/70 hover:bg-red-500/10"
```

**Show more/less button:**
```jsx
// Current
className="text-xs text-white/40 hover:text-white/60"

// New
className="text-xs text-white/30 hover:text-amber-400/70"
```

**Clear all button:**
```jsx
// Current
className="text-xs text-white/30 hover:text-red-400/70"

// Keep the same - red is appropriate for destructive action
```

---

### 8. Mobile Drawer (MobileDrawer)

**File:** `src/components/Sidebar/MobileDrawer.jsx`

**Panel background:**
```jsx
// Current
style={{ backgroundColor: "var(--surface-elevated)" }}

// New
style={{
  backgroundColor: "#0a0a0f",
  backgroundImage: `
    linear-gradient(180deg, rgba(18, 18, 24, 0.9) 0%, rgba(10, 10, 15, 1) 100%),
    radial-gradient(ellipse at 30% 5%, rgba(245, 158, 11, 0.04) 0%, transparent 60%)
  `
}}
```

**Drag handle:**
```jsx
// Current
className="h-1 w-10 rounded-full bg-white/30"

// New
className="h-1 w-10 rounded-full bg-amber-500/30"
```

**Mobile header (in Sidebar.jsx):**
```jsx
// Current
<div className="flex items-center h-14 px-4 border-b border-white/[0.06]">
  <span className="font-display text-xl text-white">upNext</span>
</div>

// New
<div className="flex items-center h-14 px-4 border-b border-amber-500/10">
  <span className="font-display text-xl bg-gradient-to-r from-white to-amber-200/80 bg-clip-text text-transparent">
    upNext
  </span>
</div>
```

---

## Visual Hierarchy Summary

### Hover States Color Logic:
- **Background:** `rgba(245, 158, 11, 0.06)` - Very subtle amber tint
- **Text:** Progress to `white/90` or `amber-300` for active
- **Borders:** Progress from `white/[0.06]` to `amber-500/20`

### Active States:
- **Background:** `amber-500/10`
- **Text:** `amber-300`
- **Border-left:** `amber-400` (2px)
- **Inner shadow:** `inset_0_0_20px_rgba(245,158,11,0.05)`

### Muted/Inactive:
- **Text:** `white/50` to `white/55`
- **Icons:** `white/25` to `white/40`
- **Borders:** `white/[0.05]` to `white/[0.06]`

---

## Animation Notes

No animation changes required. The current spring configurations are excellent. The visual refinements focus purely on color/gradient alignment with the main content area.

---

## CSS Custom Properties to Add

Add to `src/index.css` in the `:root` block:

```css
/* Sidebar-specific surfaces */
--sidebar-bg: #0a0a0f;
--sidebar-glow: rgba(245, 158, 11, 0.03);
--sidebar-hover: rgba(245, 158, 11, 0.06);
--sidebar-active: rgba(245, 158, 11, 0.10);
```

---

## Implementation Checklist

- [ ] Update `Sidebar.jsx` - Desktop sidebar container background
- [ ] Update `Sidebar.jsx` - Header area with amber accent line
- [ ] Update `Sidebar.jsx` - Toggle button hover colors
- [ ] Update `Sidebar.jsx` - Logo gradient text
- [ ] Update `Sidebar.jsx` - Mobile header styling
- [ ] Update `SidebarSearch.jsx` - Input styling refinements
- [ ] Update `SidebarSection.jsx` - Section label styling
- [ ] Update `SidebarSection.jsx` - Chevron hover color
- [ ] Update `SidebarNav.jsx` - Default/hover/active states
- [ ] Update `SidebarNav.jsx` - Collapsed state colors
- [ ] Update `SidebarNav.jsx` - Tooltip styling
- [ ] Update `SidebarNav.jsx` - Motion hover color
- [ ] Update `Sidebar.jsx` - Categories border color
- [ ] Update `Sidebar.jsx` - Category item hover colors
- [ ] Update `RecentSearches.jsx` - Item hover states
- [ ] Update `RecentSearches.jsx` - Remove button colors
- [ ] Update `RecentSearches.jsx` - Show more button colors
- [ ] Update `MobileDrawer.jsx` - Panel background gradient
- [ ] Update `MobileDrawer.jsx` - Drag handle color
- [ ] Update `index.css` - Add sidebar CSS variables

---

## Before/After Reference

### Before (Current State)
- Sidebar: Flat `#121218` background
- Text: Generic `white/70` with no amber accent on hover
- Borders: Pure white opacity, no warmth
- Feels: Disconnected, utilitarian, cold

### After (This Spec)
- Sidebar: Rich `#0a0a0f` with subtle gradient depth
- Text: Muted defaults with amber-tinted hovers
- Borders: Warm amber accents on interaction
- Feels: Unified, cinematic, inviting

---

## Quality Checks

After implementation, verify:
1. Sidebar visually connects to main content (no hard color boundary)
2. Hover states feel warm and consistent with movie card hovers
3. Active nav items have the same "selected glow" feeling as excellent match badges
4. Text readability is maintained or improved
5. Mobile drawer feels equally polished
6. No accessibility regressions (contrast ratios maintained)
