# LawHelper Design Guidelines

## Design Approach
**System**: Custom professional platform drawing from Material Design's structural clarity + Fluent Design's depth principles, tailored for legal professionals prioritizing efficiency and trust.

**Design Principles**:
- Professional authority through structured hierarchy
- Information density without clutter
- Trustworthy, stable interface patterns
- Scannable content with clear visual separation

---

## Typography System

**Font Families** (Google Fonts):
- **Primary**: Inter (body, UI elements) - weights: 400, 500, 600, 700
- **Display**: Instrument Serif (headings, hero) - weights: 400, 600

**Type Scale**:
- Hero Display: 4xl-6xl, Instrument Serif 600
- Page Headings: 3xl-4xl, Instrument Serif 600
- Section Titles: xl-2xl, Inter 600
- Body Large: lg, Inter 400
- Body: base, Inter 400
- UI Labels: sm, Inter 500
- Meta/Captions: xs, Inter 400

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16, 24**
- Micro spacing (button padding, card gaps): 2, 4
- Component spacing (between elements): 6, 8, 12
- Section spacing (between major areas): 16, 24

**Container Strategy**:
- Max widths: 7xl for full layouts, 6xl for content-heavy sections, 4xl for forms/documents
- Consistent section padding: py-16 md:py-24

---

## Component Library

**Navigation**:
- Horizontal top nav with logo left, primary links center, auth/profile right
- Secondary nav tabs for feature sections
- Sidebar navigation for application dashboard (collapsible on mobile)

**Cards**:
- Elevated cards with subtle borders for data sections
- Flat cards with dividers for list items
- Feature cards: Icon top-left, title, description, action link

**Forms**:
- Full-width labels above inputs
- Input fields with consistent height (h-12), subtle borders
- Form sections grouped with clear headings
- Action buttons aligned right (primary) with secondary left

**Tables/Data Display**:
- Striped rows for readability
- Fixed header on scroll for long tables
- Sortable columns with indicator icons
- Row actions appear on hover (edit, delete, view)

**Buttons**:
- Primary: Solid with backdrop blur when over images
- Secondary: Outlined
- Text/Link: Underline on hover
- Sizes: sm (h-9 px-4), md (h-11 px-6), lg (h-13 px-8)

**Status Indicators**:
- Badges for case status (pills with text)
- Progress bars for document completion
- Timeline component for case history

**Icons**: Heroicons (outline for navigation, solid for emphasis)

---

## Page Structures

**Landing Page** (maintaining existing particle/gradient animations):
- Hero: Full-bleed gradient background with particles, large hero image (right-aligned, 50% width showing professional using platform), headline left, CTA buttons with backdrop blur
- Trust Bar: Client logos strip
- Feature Grid: 3-column layout showcasing 5 tools (case management, document gen, medical analysis, demand letters, discovery)
- How It Works: 3-step process with numbered cards
- Testimonials: 2-column attorney testimonials with photos, firm names
- Pricing: 3-tier comparison table
- CTA Section: Centered with trial offer
- Footer: 4-column (Product, Company, Resources, Legal) with newsletter

**Dashboard**:
- Left sidebar: Primary navigation
- Top bar: Search, notifications, user profile
- Main area: Metric cards (4 across), recent cases table, quick actions panel
- Multi-column for cards, single column for tables

**Feature Pages** (Case Management, Document Generation, etc.):
- Hero: 2-column (60/40) with feature image right showing tool in action
- Overview: Text content max-w-4xl
- Capabilities: 2-column grid of detailed features
- Integration: Visual workflow diagram
- CTA section

**Document Editor**:
- Full-screen layout with toolbar top
- 2-panel: Editor left (65%), reference panel right (35%)
- Floating action buttons for save/export

---

## Images

**Hero Images Required**:
1. **Landing Hero**: Professional attorney using laptop in modern office, right-aligned, shows screen with platform interface, natural lighting, confident posture
2. **Case Management Page**: Dashboard view showing organized case files, clean desk setup, multiple monitors
3. **Document Generation**: Close-up of document being reviewed with AI highlights visible on screen
4. **Medical Records Analysis**: Split-screen showing medical records on left, AI analysis highlights on right
5. **About/Team Page**: Professional team photo in modern office setting

**Supporting Images**:
- Attorney testimonial headshots (professional, consistent style)
- Client logo marks for trust bar (grayscale)
- Feature illustrations showing each tool's interface in context

All hero images positioned right-aligned (50-60% width), allowing headline/CTA space on left. Images should convey professionalism, modern technology, and legal expertise.

---

## Animations
**Minimal, Professional**:
- Subtle fade-in on scroll for cards (150ms delay between items)
- Smooth transitions on hover states (200ms)
- Page transitions: Simple fade (300ms)
- No distracting motion - maintain existing landing page particles only