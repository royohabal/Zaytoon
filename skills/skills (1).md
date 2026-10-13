# `skills.md` --- Palestinian Heritage Clothing Store

## Project Purpose

Build and maintain a distinctive, polished online clothing store
centered on Palestinian identity, heritage, art, and culture. The store
sells wearable clothing and accessories featuring original designs
inspired by Palestine.

The website should feel like a real independent fashion label---not a
generic template, dropshipping store, or text-heavy school project.
Prioritize strong visuals, clear shopping interactions, cultural
authenticity, and a memorable brand identity.

## Brand and Design Direction

-   **Overall feeling:** modern, meaningful, premium, artistic, warm,
    and confident.
-   **Visual inspiration:** Palestinian tatreez embroidery, olive trees,
    olive branches, the keffiyeh pattern, traditional motifs, stone
    architecture, and the colors of the Palestinian flag.
-   **Suggested palette:** warm ivory or sand, olive green, deep
    charcoal, and restrained accents of red. Use these colors
    consistently; avoid making every section bright red, green, black,
    and white at once.
-   **Typography:** pair a refined display serif or expressive headline
    font with a clean, highly readable sans-serif for body text and
    product details.
-   **Layout:** generous spacing, strong product photography,
    asymmetrical editorial moments, subtle borders, and carefully
    aligned product grids.
-   **Personality:** culturally grounded and contemporary. Avoid making
    the site look like a political news page or a generic souvenir shop.
-   **Brand name:** use the existing project name if one is already
    established. Do not rename the store without permission.

## Cultural and Design Principles

-   Treat Palestinian symbols, embroidery, patterns, and history
    respectfully.
-   Use visual storytelling rather than long paragraphs. Keep copy
    concise and meaningful.
-   Do not invent historical claims, artist stories, charity
    partnerships, product origins, or donation percentages.
-   Do not use random symbols as decoration if they misrepresent
    Palestinian culture.
-   If product imagery or assets are unavailable, create polished
    placeholders clearly intended to be replaced; do not pretend a
    mockup is a real product photograph.
-   Make each design feel intentional and wearable. Avoid simply placing
    a flag on every product.

## Homepage Experience

Create a fashion-store homepage with: 1. **Announcement bar:** one short
message, such as a collection launch or shipping notice, only if
relevant. 2. **Header:** brand logo/wordmark, shop navigation,
collection links, and working search, account (if supported), and cart
controls. 3. **Hero section:** one striking campaign image or collage, a
short headline, one brief supporting sentence, and a clear "Shop the
Collection" CTA. 4. **Featured collections:** visual tiles for
categories such as T-shirts, hoodies, embroidered pieces, accessories,
or new arrivals. Only show categories that fit the actual inventory. 5.
**Featured products:** product cards with large imagery, product name,
price, available color/size options where applicable, and a clear
shopping action. 6. **Heritage/story section:** a compact visual feature
explaining the design inspiration in a few sentences, not a wall of
text. 7. **Editorial or campaign section:** show how pieces look when
styled or worn, using strong photography. 8. **Footer:** concise links
for contact, shipping, returns, sizing, social media, and the brand
story. Do not invent contact details or policies.

Do not force every section onto the page if it makes the experience
repetitive. Keep the page focused and easy to shop.

## Product Catalog and Product Pages

Every product should have: - A clear product name and short
description. - A realistic price and currency based on the project's
existing data. Never invent a price if one has already been provided. -
High-quality image(s), with consistent aspect ratios and useful
alternate views when available. - Size and color selection when
relevant. - A size guide or link to one if the store supports it. -
Availability/stock status only when backed by actual data. - A clear Add
to Cart button. - Useful details such as material, fit, care
instructions, and design inspiration only when known. - A visible
selected state for size and color options.

Product cards should prioritize images and shopping information, not
long descriptions. Include quick-add only if size/color selection can be
handled correctly.

## Functional Requirements

All visible controls must work. Do not create buttons or links that look
functional but do nothing.

-   **Navigation:** links lead to the correct pages or sections.
-   **Product browsing:** collection/category filters work and can be
    cleared.
-   **Search:** search products by name and relevant terms; show a
    helpful empty state when no products match.
-   **Product details:** clicking a product opens its details page or a
    working product modal.
-   **Variants:** require a size or color selection before adding an
    item when needed.
-   **Cart:** add items, remove items, update quantities, and calculate
    subtotals correctly. Adding the same product with the same variants
    should update its quantity rather than create confusing duplicates.
-   **Cart feedback:** show a clear confirmation after adding an item
    and keep the cart count accurate.
-   **Checkout:** connect to a real checkout only if one is configured.
    Otherwise, clearly label checkout as a demo or provide a legitimate
    next step; never claim an order has been placed when it has not.
-   **Forms:** validate required fields and show understandable
    success/error messages.
-   **Responsive menu:** mobile navigation opens and closes correctly.
-   **Theme controls:** if dark/light mode already exists, preserve it
    and ensure every component remains readable in both modes.
-   **Persistence:** use the project's existing storage or backend
    approach for cart state. Do not add unnecessary services or replace
    the current stack without a reason.

## Motion and Interaction

Use restrained, purposeful motion to make the store feel polished: -
Smooth but quick hover transitions on product cards and buttons. -
Subtle image zoom or alternate-image reveal on hover, where
appropriate. - Gentle section reveal animations that do not delay access
to content. - A refined cart drawer or clear cart confirmation. - Small,
consistent feedback for selected sizes, filters, and added items.

Animations must be fast, accessible, and non-distracting. Respect
reduced-motion preferences. Do not add excessive floating elements,
cursor effects, or animations that interfere with shopping.

## Accessibility and Responsive Design

-   Design mobile-first and test at phone, tablet, and desktop widths.
-   Use semantic headings and buttons.
-   Add descriptive alt text to meaningful images.
-   Ensure keyboard navigation and visible focus states.
-   Maintain readable color contrast and legible text sizes.
-   Never communicate selected states or errors through color alone.
-   Avoid horizontal overflow, clipped product details, and tiny mobile
    tap targets.

## Technical Rules for Replit Changes

-   Inspect the existing codebase, framework, components, and data model
    before making changes.
-   Preserve working features and the current project structure unless a
    change is necessary.
-   Make targeted, coherent changes instead of rebuilding the entire
    website for a small request.
-   Reuse existing components and styling conventions where possible.
-   Do not remove working map/API/backend features if they exist in the
    project.
-   Do not expose API keys, secrets, or private environment variables in
    client-side code.
-   Do not add dependencies unless they provide a clear benefit.
-   Keep product data in a consistent, maintainable structure rather
    than duplicating product information across components.
-   Avoid placeholder links, dead buttons, fake reviews, fake stock
    counters, fake discounts, and fabricated testimonials.
-   If a backend or payment system is not configured, state that clearly
    rather than pretending it works.

## Performance and Quality

-   Optimize images and use consistent crop ratios.
-   Avoid loading large animations or unnecessary libraries.
-   Prevent layout shifts while images load.
-   Keep components readable and reusable.
-   Use clear loading, empty, and error states where needed.
-   Ensure there are no console errors, broken routes, or missing
    assets.

## Workflow for Every Task

1.  Inspect the current implementation and identify what already works.
2.  Make the smallest set of changes that fully meets the request.
3.  Check that the visual design matches the brand direction above.
4.  Test all affected interactions, including mobile layouts.
5.  Check for broken links, console errors, and accidental regressions.
6.  Summarize what changed and identify anything that still needs real
    product data, images, backend configuration, or manual setup.

## Definition of Done

A change is complete only when: - The result looks like a cohesive
Palestinian heritage fashion brand. - Product imagery and shopping
actions are more prominent than long text. - The design is responsive
and accessible. - Every visible interactive element works as intended. -
Existing working functionality remains intact. - No fake business claims
or nonfunctional controls have been introduced.
