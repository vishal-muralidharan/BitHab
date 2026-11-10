# UI Component Blueprint

Extracted UI components, props contracts, variants, and state primitives.

## Component catalog

- **Component: BottomNav**
  - Evidence: `src/components/layout/BottomNav.jsx:5` (confidence: high)
  - Props: `unknown`
  - Variants: none
- **Component: Header**
  - Evidence: `src/components/layout/Header.jsx:5` (confidence: high)
  - Props: `unknown`
  - Variants: none
- **Component: Layout**
  - Evidence: `src/components/layout/Layout.jsx:7` (confidence: high)
  - Props: `unknown`
  - Variants: none
- **Component: LegalFooter**
  - Evidence: `src/components/layout/LegalFooter.jsx:6` (confidence: high)
  - Props: `unknown`
  - Variants: none
- **Component: MobileTopbar**
  - Evidence: `src/components/layout/MobileTopbar.jsx:4` (confidence: high)
  - Props: `unknown`
  - Variants: none
- **Component: PublicLegalLayout**
  - Evidence: `src/components/layout/PublicLegalLayout.jsx:6` (confidence: high)
  - Props: `unknown`
  - Variants: none
- **Component: TermsAgreementModal**
  - Evidence: `src/components/layout/TermsAgreementModal.jsx:5` (confidence: high)
  - Props: `unknown`
  - Variants: none

## Form controls

| Control family | Themed primitive | Native uses | Status |
|---|---|---|---|
| date | none | 3 (src/pages/Notes.jsx:144, src/pages/Reminders.jsx:301, src/pages/Reminders.jsx:422) | violation |
| time | none | 2 (src/pages/Reminders.jsx:315, src/pages/Reminders.jsx:436) | violation |
| color | none | 2 (src/pages/Activities.jsx:227, src/pages/Activities.jsx:299) | violation |
| select | none | 4 (src/pages/Dashboard.jsx:842, src/pages/Dashboard.jsx:860, src/pages/Dashboard.jsx:873) | violation |
| dialog | none | 0 | gap |
| textarea | none | 2 (src/pages/Dashboard.jsx:658, src/pages/Notes.jsx:181) | violation |
| range | none | 0 | ok |
| file | none | 0 | ok |
| checkbox | none | 5 (src/pages/Focus.jsx:244, src/pages/Goals.jsx:146, src/pages/Goals.jsx:189) | violation |
| radio | none | 0 | ok |

## State primitives and alerts

- Primitive: `Modal` (`src/components/common/ConfirmModal.jsx:1`)
- Primitive: `Modal` (`src/components/layout/TermsAgreementModal.jsx:1`)
- Primitive: `Modal` (`tests/components/TermsAgreementModal.test.jsx:1`)
- Primitive: `role='alert'` (`src/pages/Settings.jsx:302`)

## Low level widgets

- `Modal`: `src/components/layout/TermsAgreementModal.jsx:1`

<!-- BEGIN CUSTOM: contracts -->
<!-- END CUSTOM: contracts -->
