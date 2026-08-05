# Prompt Figma Make — Fitur Calculate Invoice (Mobile)

Design a mobile app screen for a property management finance feature called "Invoice", built with Material Design components. Use Phosphor Icons (phosphoricons.com) for all icons, Montserrat as the font family throughout. Color palette: primary color #27B29B (teal green), secondary/text color #334155 (dark slate gray, used for body text and secondary elements), and white (#FFFFFF) as the third base color for backgrounds and cards.

## Overall structure
A single screen with a top segmented tab bar containing 3 tabs: "Draft", "Ready to Send", "Sent". Each tab shows a scrollable list of cards. Use Material Design tab component styled with primary color as the active indicator.

**Search & filter bar** (appears below the tab bar, above the "Select all" row, shared pattern across all 3 tabs):
- A Material Design search input field with a magnifying glass icon (Phosphor), placeholder text "Cari no. invoice atau unit", full width, rounded corners, white background with light border
- A filter icon button (funnel icon) to the right of the search field that opens a bottom sheet filter panel
- **Filter bottom sheet contents:**
  - "Periode invoice" — a dropdown/select field to filter by invoice month-year (e.g. "Juli 2026")
  - "Status invoice" — a set of selectable chips/tags matching the statuses relevant to the current tab (Draft: Approved/Waiting approval/No data/Inactive; Ready to Send: Ready to sent/Zero amount; Sent: Unpaid/Overdue/Paid) — allow multi-select
  - Two buttons at the bottom: "Reset" (text/outlined button) to clear all filters, and "Terapkan" (primary filled button) to apply
- When filters are active, show small removable filter chips row right below the search bar summarizing active filters (e.g. "Juli 2026 ✕", "Overdue ✕"), with a "Reset semua" text link at the end
- The search should match against invoice number and unit number as the user types

---

## TAB 1: Draft

Purpose: Finance staff reviews utility meter scan data (done by engineering) per apartment unit before calculating invoices.

**Top bar row:** a "Select all" checkbox on the left, and a small text label on the right showing count of selected units (e.g. "3 unit dipilih"), visible only when items are selected.

**Card list, one card per apartment unit, each card contains:**
- Top row: checkbox (Material checkbox) + unit number (e.g. "A-1201") in bold, and the meter scan month (e.g. "Jul 2026") aligned right in muted gray text with a small calendar icon.
- Below that, two side-by-side utility blocks (Electric and Water), each block containing:
  - A small square icon badge (rounded corners) with a colored background: amber/warning background for Electric (lightning bolt icon), light teal/primary-tinted background for Water (drop icon)
  - A status chip/pill below the icon with one of these states and colors:
    - "Approved" — green background, green text
    - "Waiting approval" — amber background, amber text
    - "No data" — gray background, gray text (utility hasn't been scanned yet)
    - "Inactive" — gray background, gray text (unit has no meter for this utility)
  - If status is Approved or Waiting approval (i.e. meter has been scanned), show meter reading info: "prev → curr" numbers in small muted text, and the usage number ("pakai") displayed larger and bold as the most important figure, with a small "terpakai" label next to it.
- If the unit's combination of statuses means it CANNOT be calculated yet (see business rule below), show a thin divider line then a small warning row with a warning-color triangle icon and text "Belum bisa dihitung" (Not ready to calculate).

**Business rule for enabling calculation (for reference, doesn't need to be coded, just reflected visually via disabled/muted state):**
A unit can be calculated if BOTH utilities are either "Approved" or "Inactive" — but NOT if either one is "Waiting approval" or "No data". Cards/checkboxes for ineligible units appear visually disabled (checkbox grayed out, can't be selected).

**Bottom sticky action bar:** a full-width primary-colored button labeled "Calculate" with a calculator icon, disabled (grayed out) state when no unit is selected. 

**Confirmation modal (bottom sheet style):** When "Calculate" is tapped, show a bottom sheet modal with: a small icon badge (calculator icon, primary-tinted background), title "Calculate invoice?", a description sentence explaining invoices will be generated for the selected units based on approved meter data, and two buttons side by side: "Batal" (secondary/outlined) and "Ya, calculate" (primary filled button).

---

## TAB 2: Ready to Send

Purpose: List of invoices that have been calculated and are pending review/send to tenants.

**Top bar row:** same pattern as Draft — "Select all" checkbox left, selected count right.

**Card list, one card per invoice, each card contains:**
- Left: checkbox (disabled if invoice is "Zero amount" status)
- A bill icon: a rounded-square icon with a gradient background (teal/primary gradient for normal invoices, red gradient with an exclamation mark instead of "Rp" symbol for Zero amount invoices), containing an "Rp" label and two small decorative lines mimicking a bill/receipt look
- Middle: bill title formatted as "[Month Year] Bill" (bold), unit number below it as "Unit [number]" (muted small text), and below that a status line — either "Belum dikirim" (Not yet sent) in muted gray, or "Total invoice Rp 0" in red text for Zero amount invoices
- Right side: total amount in bold (formatted as Indonesian Rupiah, e.g. "Rp 1.250.000,00"), colored red for Zero amount cards, and a small trash/delete icon button below it
- Zero amount cards appear slightly faded/reduced opacity to visually indicate they're not actionable

**Bottom sticky action bar:** full-width primary button "Send" with a paper-plane/send icon, disabled when nothing is selected.

**Confirmation modal for Send:** bottom sheet with send icon (primary-tinted badge), title "Kirim invoice ke tenant?", description mentioning the number of invoices that will be sent and that this action is final/can't be undone, buttons "Batal" and "Ya, kirim".

**Confirmation modal for Delete:** triggered by tapping the trash icon on any card. Bottom sheet with trash icon (red-tinted badge), title "Hapus invoice ini?", description naming the specific unit and noting it will need to be recalculated from the Draft tab if needed again, buttons "Batal" and a red "Ya, hapus" button.

---

## TAB 3: Sent

Purpose: List of invoices already sent to tenants, showing payment status. This tab has NO checkboxes/selection — it's view-only with tap-to-view-detail.

**Card list, one card per sent invoice, each card contains:**
- Same bill icon style as Ready to Send tab (teal gradient, "Rp" symbol)
- Middle: "[Month Year] Bill" title (bold), "Unit [number]" below (muted), and "Due [date]" below that (muted, small)
- Right side: total amount bold, and below it a status pill/badge:
  - "Unpaid" — amber background, amber text
  - "Overdue" — red background, red text
  - "Paid" — green background, green text
- A small chevron-right icon at the far right edge of the card indicating it's tappable to view invoice detail

---

## General styling notes
- Rounded corners on all cards (16px radius), white card background on a very light gray page background
- Use Material Design elevation/shadow subtly for cards
- All icons from Phosphor Icons — use the "regular" or "bold" weight consistently
- Font: Montserrat for all text — semi-bold/bold (600-700) for titles and amounts, regular (400) for muted/secondary text
- Primary color #27B29B used for: active tab indicator, primary buttons, positive/active icon accents
- Secondary color #334155 used for: main body text, titles
- White #FFFFFF used for: card backgrounds, button text on primary buttons
- Status colors (amber/red/green) are separate accent colors, not part of the 3 base colors — use standard Material warning/error/success tones for these