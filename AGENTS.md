# Khảm Hoa Store

IMPORTANT:

Before generating code:

- Read AGENTS.md completely
- Follow project architecture
- Follow design system
- Follow coding conventions
- Reuse existing implementation whenever possible


Khảm Hoa Store is a premium e-commerce platform specializing in:

- Mother-of-pearl jewelry
- Handcrafted accessories
- Luxury gifts

Brand Personality:

- Modern Luxury
- Elegant
- Feminine
- Minimalist
- Premium Craftsmanship

Target Customers:

- Women 22-45
- Luxury gift buyers

Every feature, page and component must reinforce trust, elegance and premium aesthetics.

Never create UI that resembles:

- Admin dashboard
- SaaS application
- Gaming website
- Corporate enterprise portal

# Technology Stack

Frontend

- Next.js App Router
- React
- TypeScript
- TailwindCSS
- Context API

Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

Rules

- Always use TypeScript
- Never use JavaScript
- Never introduce Redux
- Never introduce Zustand
- Prefer Server Components
- Use Client Components only when required
- Keep dependencies minimal

# Design System

Visual Style

- Modern Luxury
- Elegant Feminine
- Premium Minimalism

Colors

Primary:
#D8A39D

Secondary:
#F8E6E6

Accent:
#E8D8C3

Background:
#FFFFFF
#FAF8F6

Text:
#333333
#777777

Forbidden

- Black backgrounds
- Neon colors
- Heavy gradients
- Aggressive shadows

Layout

- Generous whitespace
- Airy spacing
- Soft rounded corners
- Elegant composition

Components must feel premium and refined.

Animations must be subtle and smooth.

# AI Engineering Behavior

Before coding:

1. Analyze requirements
2. Detect edge cases
3. Detect UX issues
4. Detect SEO opportunities
5. Detect performance risks
6. Detect security risks

When generating code:

- Production ready
- No placeholders
- No fake implementations
- No unnecessary comments

Always explain:

- Why the solution is chosen
- Possible alternatives
- Tradeoffs

If requirements are unclear:
Ask concise clarification questions.

If architecture can be improved:
Suggest improvements before coding.

Cart:
- LocalStorage persistence
- Instant cart update

Voucher:
- Percentage discount
- Fixed discount
- Minimum order value
- Expiration date

Order:
- Pending
- Confirmed
- Shipping
- Delivered
- Cancelled

Inventory:
- Never allow negative stock
- Update sold count automatically

Every page must include:

- SEO title
- Meta description
- Open Graph tags
- Canonical URL

Product pages require:

- Product schema
- Breadcrumb schema

Every page must have:

Loading State
Empty State
Error State

Never show blank screens.

Always provide fallback UI when API fails.

