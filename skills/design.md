---
name: brew-logic-conventions
description: Use for any change to the Brew store UI, products, translations, or theming.
---

# Brew conventions

- Brand: Brew. Slogan "Engineer your cup". Beans are roasted in Kuwait by Brew. Never mention other roasters.
- Fonts: Space Grotesk headings, Inter body, IBM Plex Sans Arabic for Arabic.
- Light mode (default): background #F5EFE6, cards #FBF8F2, text #2B1D14, olive #6B7A3A.
- Dark mode: background #1C1410, cards #2A1F18, text #F2E8DA, accent #9AA85A.
- Radius tokens: --radius-sm 8px, --radius-md 14px, --radius-lg 20px. Badges and floating buttons fully round.
- Every change must work on the home, Machines, Beans, and /product/[id] pages, in light and dark mode, in Arabic with RTL layout, and on mobile.
- Brand and product names stay in English in Arabic mode.
- The site, search, and chatbot read from one shared product catalog. Change products only there.
- Never invent tasting notes or technical specs.
- Cart, favorites, theme, language, and currency persist in localStorage.
- Only change what the request asks for.
