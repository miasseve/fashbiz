# Plan — Task #447: Make the colour value editable (name + value together)

Follows the spec `.claude/specs/447-make-the-colour-value-editable-on-the-product.md` (§12).
Branch: `feature/447-make-the-colour-value-editable-on-the-product` (already on it — never create another).

> **Revised 2026-10-26:** the approach below described a fixed named-colour palette. At the
> reviewer's direction this was replaced by a **free colour picker** (native `<input type="color">`)
> beside the original editable name field — name and value are independently editable, no preset
> list, no palette/off-list handling. What was actually built: `ColorPicker.jsx` is now a free
> picker; `taxonomy.js` palette additions were reverted; `EditableColor.jsx` is a name field + picker;
> the add form and admin edit keep their text name field with a picker beside it; the admin route
> still accepts `colorHex`. The spec (§1–§13) is the current source of truth; the detail below is
> kept only for history.

## Context

The AI stores colour as `color: { name, hex }` ([Product.js:9-16](src/models/Product.js#L9-L16)). Today only the **name** is editable (a free-text box on the add form; a name-only text box in the admin UI; nothing on the store details page), and the **hex** stays whatever the AI guessed — so a "corrected" product keeps the wrong swatch/value and the name and value drift apart. We make the colour editable as a **named-colour palette**: picking a swatch sets name + hex together from one source, so they can never disagree. This applies on the add-product form (real + guest demo), the store product details page, and the admin product edit. AI detection is untouched; the webshop keeps getting the colour **name** only on create (a later edit is in-app only — D9).

## Approach

One source of truth for colours, one reusable picker, wired into every write path so none can set a name without its matching value (spec lessons L1, L4).

### 1. Colour palette — single source of truth
Add to [taxonomy.js](src/lib/taxonomy.js) (co-located with the existing `NORMALIZED_COLORS` so names stay in sync):
- `COLOR_PALETTE`: ordered array of `{ name, hex }` for the 28 names in `NORMALIZED_COLORS`, using the shades confirmed in spec §8, plus `{ name: "multicolor", hex: "#FFFFFF", gradient: true }` (keeps today's stored value — D8; the gradient flag only drives the swatch look).
- `getPaletteColor(name)`: returns the `{ name, hex }` entry for a name (case-insensitive), or `null`.

Names must exactly match `NORMALIZED_COLORS` (lowercase) so AI-detected colours map to a swatch.

### 2. Reusable picker — `src/components/ColorPicker.jsx` (new, client component)
- Props: `value` = `{ name, hex }`, `onChange({ name, hex })`, optional `disabled`.
- Renders a swatch button per `COLOR_PALETTE` entry (swatch + visible name label); "multicolor" renders a CSS gradient swatch. Selected entry is marked by more than colour (ring + check + `aria-checked`).
- **FR-08**: if `value` is a colour whose name isn't in the palette, render it as a leading "current" swatch so it still shows and can be replaced.
- Accessibility (AC-15): `role="radiogroup"` with `role="radio"` buttons, reachable by Tab/arrow keys, selectable with Enter/Space, visible focus outline, each with an accessible name. Reuses the native-swatch idea from [Profile.jsx:948-953](src/app/dashboard/profile/Profile.jsx#L948-L953) but as a named palette, not a free `type="color"`.

### 3. Add-product form — [ProductFormFields.jsx:151-181](src/app/dashboard/add-product/components/ProductFormFields.jsx#L151-L181)
Replace the name text box + hidden hex input + static swatch with `ColorPicker`:
- Keep `register("color.name")` and `register("color.hex")` as hidden inputs (so RHF still submits them), driven by `setValue`.
- `value={{ name: watch("color.name"), hex: watch("color.hex") || colorHex }}`; `onChange` calls `setValue("color.name", name, { shouldValidate: true })` and `setValue("color.hex", hex, { shouldValidate: true })` together.
- AI prefill already sets `color.name`/`color.hex` ([SecondStep.jsx:208-213, 270-276](src/app/dashboard/add-product/components/SecondStep.jsx#L208-L213); Try at [TrySecondStep.jsx:116-118](src/app/try/add-product/TrySecondStep.jsx#L116-L118)), so the picker opens on the AI colour. No change needed to the submit payload — `createProduct` already saves `{name,hex}` and `createShopifyProduct` sends the (now corrected) `color.name` ([shopifyAction.js:87-94](src/actions/shopifyAction.js#L87-L94)) → AC-07.
- This file is shared by the real flow and the guest demo (try) flow, so both get it in one change (D5 / AC-05).

### 4. Store product details page — new inline `EditableColor`, mirroring `EditablePrice`
- New `src/app/dashboard/product/[productId]/EditableColor.jsx` (client), modelled on [EditablePrice.jsx](src/app/dashboard/product/[productId]/EditablePrice.jsx): display mode shows the swatch + name + edit button; edit mode shows `ColorPicker` + save/cancel. Save calls `updateProduct(productId, { color: { name, hex } })`, toasts, `router.refresh()`. Validates a palette colour was chosen before saving (guards against invalid hex, since `updateOne` runs no schema validators).
- In [page.jsx](src/app/dashboard/product/[productId]/page.jsx) replace the three static colour cells (`color?.name || "N/A"` at [:80-81](src/app/dashboard/product/[productId]/page.jsx#L80-L81) and the two other layout branches ~:154-155, ~:315-316) with `<EditableColor productId={...} color={parsedProduct.color} />`. This adds the swatch everywhere colour shows (FR-05 / AC-06) and makes it editable (FR-02 / AC-03, AC-04).
- A later edit forwards `color` to `updateShopifyProduct`, which ignores it ([shopifyAction.js:1664-1677](src/actions/shopifyAction.js#L1664-L1677)) → saved in-app only, webshop unchanged (D9 / AC-18b). No change to `updateProduct` or `updateShopifyProduct`.

### 5. Admin product edit — [admin/products/[productId]/page.jsx:398-403](src/app/admin/products/[productId]/page.jsx#L398-L403) + route
- Replace the colour **name** text input with `ColorPicker`; track `colorHex` in form state (init from `p.color?.hex`, [:78](src/app/admin/products/[productId]/page.jsx#L78)); send both `colorName` and `colorHex` in the PATCH body.
- Route [route.js:106-108](src/app/api/admin/products/[productId]/route.js#L106-L108): accept `colorHex` and store name + value together — `update.color = { name: ..., hex: ... }` (fall back to existing values when a field is absent). Fixes the drift at the source (L4 / D7 / AC-19).

### 6. Validation
- Add-product `productSchema` already allows `color {name required, hex optional}` ([validations.js:196-199](src/actions/validations.js#L196-L199)) — unchanged; the picker always supplies a valid hex.
- `updateProductSchema` is **unchanged**: the details-page colour is edited through the dedicated `EditableColor` control (direct `updateProduct` call), not the `EditButton` modal, so no colour field is added there (keeps other fields' behaviour identical — FR-10 / AC-11).

## Files

**Add**
- `src/components/ColorPicker.jsx` — reusable named-colour palette picker.
- `src/app/dashboard/product/[productId]/EditableColor.jsx` — inline colour editor for the details page.

**Change**
- `src/lib/taxonomy.js` — add `COLOR_PALETTE` + `getPaletteColor`.
- `src/app/dashboard/add-product/components/ProductFormFields.jsx` — swap colour block for `ColorPicker`.
- `src/app/dashboard/product/[productId]/page.jsx` — use `EditableColor` in the colour cells (all layout branches).
- `src/app/admin/products/[productId]/page.jsx` — colour picker + send `colorHex`.
- `src/app/api/admin/products/[productId]/route.js` — accept `colorHex`, store `{name,hex}`.

**Must not change:** AI detection ([aiProductAnalysis.js](src/lib/aiProductAnalysis.js), [google-vision/route.js](src/app/api/google-vision/route.js)), `updateShopifyProduct` colour behaviour, other product fields, `updateProductSchema`, le-stores.com / Apple app.

## AC coverage
- FR-01 add form → AC-01; guest demo → AC-05 (same shared file)
- FR-03 name+value one source → AC-02 (add save), AC-17 (untouched), AC-19 (admin)
- FR-02/FR-04 details edit + persist → AC-03, AC-04
- FR-05 swatch shown on details → AC-06
- FR-06 webshop name-only on create → AC-07
- FR-07 list coverage + multicolor → AC-08
- FR-08 saved colour not in list → AC-09 (ColorPicker "current" swatch)
- FR-09 AI unchanged → AC-10 (no AI files touched; before/after compare)
- FR-10 other fields unchanged → AC-11
- §5 save fail → AC-12 · existing data untouched → AC-13 · "No Color" → AC-14
- §7 accessibility → AC-15 · mobile 375px → AC-16 · permissions → AC-18 (store `updateProduct` ownership check [productActions.js:1274](src/actions/productActions.js#L1274); admin route is admin-gated)

## Checks, risk, rollback
- **Project checks:** `npm run lint` and `npm run build` (no test framework configured — manual/browser verification). Capture a "before" lint/build at the start of implementation and "after" for §14.
- **Risk:** Medium (per spec). No DB migration; existing records change only when a user edits them (AC-13). `updateOne` runs no validators, so `EditableColor` and the picker constrain values to valid palette hex.
- **Rollback:** revert the branch commits and redeploy; nothing to undo in stored data.

## Verification (end-to-end)
1. `npm run dev`. Add a product; when AI tags a wrong colour, open the picker, choose "Navy" → name shows "navy" and swatch is navy (AC-01); save → stored `color` is `{name:"navy", hex:"#1F2A5B"}` (AC-02); the created webshop product's "Color" option is "navy" (AC-07).
2. On the product details page, confirm the swatch shows next to the name (AC-06); change the colour, save, refresh → persists (AC-03/04); confirm the webshop listing is unchanged for this later edit (AC-18b/D9).
3. Repeat in the guest demo (try) flow (AC-05) and the admin edit (AC-19).
4. Edge cases: a saved "teal" (not in list) still shows and is replaceable (AC-09); keyboard-only run through the picker (AC-15); 375px width (AC-16); force a save failure → friendly toast, colour unchanged (AC-12).
5. Compare an AI run before/after to confirm detection output is identical (AC-10); confirm editing size/brand/price still behaves as before (AC-11).
