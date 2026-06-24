# NBP Design Guidelines

Design system extracted from **[nbp.pl](https://nbp.pl)** — the official site of **Narodowy Bank Polski**.
Use these tokens and assets to build UIs that stay visually consistent with the NBP brand.

> Source: `https://nbp.pl` · Extracted: 2026-06-24
> Machine-readable tokens: [`../assets/design-tokens.json`](../assets/design-tokens.json)

---

## 1. Assets

| Asset | File | Notes |
|---|---|---|
| Homepage screenshot | [`../assets/homepage.png`](../assets/homepage.png) | Full-page reference capture |
| Logo (wordmark + emblem) | [`../assets/logo.svg`](../assets/logo.svg) | SVG, `viewBox="0 0 205 64"` |
| Favicon | [`../assets/favicon.ico`](../assets/favicon.ico) | Browser tab icon |
| Design tokens | [`../assets/design-tokens.json`](../assets/design-tokens.json) | Structured JSON |
| Fonts (self-hosted) | [`../assets/fonts/`](../assets/fonts/) | 26 TTF files + ready-to-use [`fonts.css`](../assets/fonts/fonts.css) |

---

## 2. Colors

The palette is built around a deep institutional **navy** with a **gold/sand accent** — conveying authority, tradition, and trust.

### Brand
| Token | Hex | Usage |
|---|---|---|
| `brand.primary` | `#152E52` | Navy — header background, headings, primary text, top-level nav |
| `brand.accent` | `#BDAD7D` | Gold/sand — accent buttons, highlights, badges, calendar markers |
| `brand.link` | `#4A74B0` | Blue — links and primary CTA buttons ("WIĘCEJ") |

### Backgrounds
| Token | Hex | Usage |
|---|---|---|
| `background.default` | `#FFFFFF` | Page background |
| `background.light` | `#F7F7F7` | Subtle section / card background |
| `background.muted` | `#C4C4C4` | Placeholder / disabled surfaces |
| `background.dark` | `#152E52` | Header, footer, dark sections |

### Text
| Token | Hex | Usage |
|---|---|---|
| `text.primary` | `#152E52` | Headings, emphasis, nav |
| `text.body` | `#464646` | Default body copy |
| `text.secondary` | `#323232` | Secondary copy |
| `text.muted` | `#707070` | Captions, metadata |
| `text.link` | `#4A74B0` | Inline links |
| `text.onDark` | `#FFFFFF` | Text on navy/gold surfaces |

### Borders
| Token | Hex | Usage |
|---|---|---|
| `border.default` | `#BFCEDD` | Inputs, dividers (soft blue-gray) |
| `border.light` | `#E5E5E5` | Light separators |

---

## 3. Typography

Two font families: a **serif for headings** (institutional, editorial feel) and a **sans-serif for body/UI**.

### Families
- **Headings:** `"Brygada 1918", Georgia, "Times New Roman", serif`
- **Body / UI:** `"Libre Franklin", -apple-system, Arial, "Noto Sans", sans-serif`

Both are **self-hosted** in [`../assets/fonts/`](../assets/fonts/) (TTF). Just import the bundled
stylesheet — it declares every `@font-face`:

```css
@import url("../assets/fonts/fonts.css");
```

The original TTFs are also available on Google Fonts:
[Brygada 1918](https://fonts.google.com/specimen/Brygada+1918) · [Libre Franklin](https://fonts.google.com/specimen/Libre+Franklin).

```text
Brygada 1918    — weights 400, 500, 600, 700 (+ italics)   → assets/fonts/brygada-1918/
Libre Franklin  — weights 100–900 (+ italics)              → assets/fonts/libre-franklin/
```

### Weights
| Name | Value |
|---|---|
| regular | 400 |
| medium | 500 (headings, buttons) |
| semibold | 600 (H3, top-level nav) |
| bold | 700 |

### Size scale
| Token | Size | Usage |
|---|---|---|
| `sm` | 13px | Buttons, labels, metadata |
| `base` | 15px | Body text (≈15.5px on source) |
| `md` | 16px | Lead paragraphs |
| `lg` | 20px | Sub-headings |
| `xl` | 27px | H1 / H2 (Brygada 1918, weight 500, line-height 40px) |
| `2xl` | 34px | Hero headings |

### Line height
- Tight `1.2` · Heading `1.48` · Base `1.55` · Relaxed `1.8`

---

## 4. Spacing

Base unit **4px**, scaling on a consistent step:

`4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 px`

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `none` | 0px | Sharp panels, banners |
| `xs` | 2px | Subtle controls |
| `sm` | 4px | Buttons (primary & accent) |
| `md` | 6px | Inputs, search field |
| `circle` | 50% | Avatars, calendar day markers, icon badges |
| `full` | 999px | Pills |

The brand leans toward **small radii (2–6px)** — restrained and formal, not rounded/playful.

---

## 6. Components

### Header
- Background `#152E52` (navy), white content.
- Contains logo, search field, language switch (PL/EN), high-contrast toggle.

### Navigation
- Top-level items: navy `#152E52`, **uppercase**, weight 600.
- Sub-items: navy, sentence case, weight 400.

### Buttons
| Variant | Background | Text | Radius | Padding | Notes |
|---|---|---|---|---|---|
| Primary (link CTA) | `#4A74B0` | `#FFFFFF` | 4px | 6px 12px | Uppercase, weight 500 — e.g. "WIĘCEJ" |
| Accent | `#BDAD7D` | `#152E52` | 4px | 12px 27px | Uppercase, weight 500 — e.g. "MENU" |

### Inputs / Search
- White background, `0.8px solid #BFCEDD` border, radius 6px, padding ~10px, text `#464646`.

### Footer
- Navy `#152E52` background, white text, copyright line:
  *"Copyright © 1998–2026 Narodowy Bank Polski. Wszystkie prawa zastrzeżone."*

---

## 7. Logo Usage

- File: [`../assets/logo.svg`](../assets/logo.svg) — emblem (circular medallion) + "Narodowy Bank Polski" wordmark, intrinsic `205×64`.
- Scale via `width`/`height` keeping aspect ratio; SVG stays crisp at any size.
- The default logo is designed for **light backgrounds**. On navy/dark surfaces, use a white/inverted variant (ensure full contrast — do not place the dark logo on `#152E52`).
- Preserve clear space around the logo (≈ the height of the emblem) and never stretch, recolor, or rotate it.

---

## 8. Visual Style Summary

NBP's visual identity is **formal, institutional, and trustworthy** — exactly what you'd expect from a central bank. A deep navy anchors the palette, paired with a refined gold/sand accent that signals heritage and value. Serif headings (Brygada 1918) give an editorial, authoritative voice while Libre Franklin keeps body and UI text clean and highly legible. Small border radii, generous white space, and a restrained color range keep the experience calm and official rather than trendy. When building for this brand, favor clarity, accessibility (the site ships a high-contrast mode), and quiet confidence over decoration.
