# DESIGN.md - Spoyt Design System

## Colors

| Variable | Value | Usage |
|----------|-------|-------|
| --primary | #4CAF50 | Primary buttons, active states |
| --primary-dark | #388E3C | Hover states |
| --primary-light | #C8E6C9 | Light accents |
| --background | #1a1a2e | Main background |
| --surface | #16213e | Cards and surfaces |
| --surface-light | #0f3460 | Elevated surfaces |
| --text-primary | #FFFFFF | Main text |
| --text-secondary | #B0BEC5 | Secondary text |
| --text-hint | #78909C | Hint/placeholder text |
| --error | #F44336 | Error states |
| --warning | #FF9800 | Warning states |
| --success | #4CAF50 | Success states |
| --border | rgba(255,255,255,0.1) | Borders |

## Typography

- **Font Family:** 'Rubik', sans-serif (supports Hebrew RTL)
- **Direction:** RTL (Right-to-Left)

| Style | Size | Weight |
|-------|------|--------|
| Heading 1 | 28px | 700 |
| Heading 2 | 22px | 600 |
| Heading 3 | 18px | 600 |
| Body | 16px | 400 |
| Caption | 14px | 400 |
| Small | 12px | 400 |

## Spacing

| Variable | Value |
|----------|-------|
| --spacing-xs | 4px |
| --spacing-sm | 8px |
| --spacing-md | 16px |
| --spacing-lg | 24px |
| --spacing-xl | 32px |
| --spacing-xxl | 48px |

## Border Radius

| Variable | Value |
|----------|-------|
| --radius-sm | 8px |
| --radius-md | 12px |
| --radius-lg | 16px |
| --radius-xl | 24px |
| --radius-full | 50% |

## Components

### Buttons

- **Primary Button:** Green background, white text, 12px radius
- **Secondary Button:** Transparent, green border, green text
- **Icon Button:** Circular, 48px

### Cards (PlanCard)

- Background: --surface
- Border: 1px solid --border
- Border radius: --radius-lg
- Padding: --spacing-md

### Input Fields

- Background: rgba(255,255,255,0.05)
- Border: 1px solid --border
- Border radius: --radius-sm
- Color: --text-primary

### Navigation

- Bottom navigation with 5 items: בית (Home), גלה (Discover), + (FAB), שלי (My), פרופיל (Profile)
- Active state: --primary color
- Height: 64px
