# Plan — Simplify product picture upload in leStores-AI

**Task:** 443 · **Spec:** `.claude/specs/443-simplify-product-picture-upload-in-lestores-ai.md` (Approved, Medium/Medium)
**Branch:** `feature/443-simplify-product-picture-upload-in-lestores-ai` (already on it — do not create another)
**Date:** 2026-10-26

---

## 0. Guardrails (from spec §12)
- Do **not** change the AI Vision analysis logic, the product submit flow, or the Shopify sync. Only the upload UI and how images are passed in.
- Do **not** touch the leStores Apple app or le-stores.com.
- Do **not** commit, push, merge, deploy or open a PR. `/ship` does that.
- Lesson **L1**: a photo can be added and removed — verify it everywhere it shows (the frame, after Next→Back, and in the guest `/try` demo).

---

## 1. Project scan (findings, with proof)

| Item | Finding | Proof |
|---|---|---|
| Tech stack | Next.js 16 / React 19, JavaScript + JSX, Redux Toolkit + redux-persist (localStorage, key "fash"), HeroUI, axios, Cloudinary upload via `/api/upload` | `package.json`, `src/store.js`, `CLAUDE.md` |
| Upload screen (shared) | `FirstStep.jsx` is imported by both the store dashboard (`add-product/Main.jsx`) and the guest demo (`try/add-product/TryMain.jsx`) | `Main.jsx:3`, `TryMain.jsx:3` |
| Current photo state | `product.uploadedImages` is an object `{frontView, sideView, backView, detailView}`, each `null` or `{url, publicId, originalUrl, originalPublicId, isBgRemovedImage, removeBgUrl, removePublicId}` | `features/productSlice.js:8-13`, `CropImage.jsx:102-113` |
| How downstream reads photos | Every reader uses `Object.values(reduxImages).filter(i => i !== null).map(i => ({url, publicId}))`. Only `url` and `publicId` are consumed. `Object.values()` works identically on an array. | `SecondStep.jsx:90-99,176-188,359-361`, `TrySecondStep.jsx:62-67,93-100` |
| AI pipeline input | `/api/ai/analyze-product` takes `imageUrls` (array) → `analyzeProductImages(urls, storeId)`, caps at 4, **no dependency on view labels or edited versions**; first URL = main photo | `api/ai/analyze-product/route.js:20-23`, `lib/aiProductAnalysis.js:99-135` |
| Crop/resize today | `CropImage.jsx` downscales to max 1600px, re-encodes JPEG 0.85, rejects >4MB — this is what keeps big phone photos under Vercel's ~4.5MB body limit | `CropImage.jsx:12-13,37-73,81-86` |
| Persistence | Whole `product` slice persisted to localStorage, **no whitelist** → `uploadedImages` survives refresh; a legacy `{frontView…}` object may rehydrate after deploy | `store.js:8-17` |
| Checks available | `npm run build` (gate). `npm run lint` = `next lint`, **broken on Next 16** (the `lint` subcommand was removed) — pre-existing, not from this task. No test runner. | `package.json`, lint run output |
| Before-results | Build baseline: see §6 (captured before any change). Lint: not runnable (pre-existing). | — |

**Nothing in spec §11 is wrong.** Risk stays **Medium** after the scan.

---

## 2. Approach

Keep all downstream readers unchanged by switching the shared photo state from a fixed 4-key object to an **ordered array**. Because every reader already uses `Object.values(...).filter(...).map(...)`, an array flows through the AI analysis, the form defaults, product submit, approve-product and the guest demo **without edits to those files**. Only the upload UI (`FirstStep`) and the slice's initial/clear shape change.

### 2.1 Reuse (Feature rule)
- Extract the existing downscale/encode/size-check logic out of `CropImage.jsx` into a small reusable helper (`resizeImageFile`) and call it on the direct-upload path. This preserves FR-08 and the Vercel size safeguard with no visible crop.
- Reuse the existing `/api/upload` POST (upload) and DELETE (remove) routes unchanged, and the existing error messages/toasts.
- Reuse the existing camera-capture code already in `FirstStep` (feed captured photo straight to upload instead of the crop screen).

### 2.2 New state shape
`uploadedImages: []` — array of `{ url, publicId, originalUrl, originalPublicId }`. (Drop the bg/adjust fields; nothing reads them after this change. Keep `publicId` for removal; the DELETE call sends `removeBgPublicId=""`.)

---

## 3. Changes by layer

### Frontend
| File | Change |
|---|---|
| `src/features/productSlice.js` | `initialState.uploadedImages = []`; `clearProductState` → `uploadedImages: []`. (Keep action names.) |
| `src/app/dashboard/add-product/components/FirstStep.jsx` | Rewrite the body: single "+" frame triggering a hidden `multiple` file input; ordered thumbnail list with a per-photo remove (X) and an uploading spinner; keep the camera button (now uploads directly). Remove: `VIEW_ORDER`, `selectedView`, the 4-key object, brightness/contrast/filter/remove-bg handlers + UI, `updateImageTransformationsWithView`, `getCloudinaryBgRemovedUrl`, `removeBackgroundLoader`, the `CropImage` import/usage and the crop screen, the `filters` import. On mount, normalize any stored value: `Array.isArray(stored) ? stored : Object.values(stored||{}).filter(Boolean)`. Multi-select: `remaining = 4 - current.length`; take first `remaining`; if more were picked, toast how many fit; validate each is an image; `resizeImageFile` → POST `/api/upload` → append in selection order. Next disabled until ≥1 photo; Back commits the array to Redux (keep existing pattern). |
| `src/app/dashboard/add-product/components/resizeImage.js` *(new)* | `resizeImageFile(file)` — the canvas downscale (max 1600px), JPEG 0.85 re-encode and >4MB guard lifted from `CropImage`. Returns a `File` or throws a friendly error. |
| `src/app/dashboard/add-product/components/RemoveImage.jsx` | Adapt to remove by array index/publicId instead of `viewType` (DELETE `/api/upload?publicId=…&removeBgPublicId=…`, then drop that item from the array). Or inline the remove handler in `FirstStep` and delete this file if it ends up unused. |
| `src/app/dashboard/add-product/components/CropImage.jsx` | Remove from the flow. Delete the file (only `FirstStep` imports it — confirm with grep before deleting). |

### Backend
N/A — `/api/upload` (POST/DELETE) and `/api/ai/analyze-product` are reused unchanged.

### Data
No database or persisted-schema change. The only shape change is the transient Redux `uploadedImages` (object → array). Defensive normalization on read handles any legacy object left in a returning user's localStorage. Confirm all readers (`SecondStep`, `TrySecondStep`, form `defaultValues.images`, approve-product payload) still produce the same `{url, publicId}` list with an array input.

### Security
File-type check (images only; reject video/other), >4MB guard after resize, controls disabled while a photo is uploading (no double-submit). No secrets in the browser (upload stays server-side). Same store-owner access; no permission change.

### Integrations
AI Vision analysis and Shopify sync unchanged — verified by baseline before/after: same AI form fill and same product creation for the same photos.

### Testing
No test runner. Manual/browser checks for every AC (§6) on **both** the dashboard flow and the guest `/try` flow, at phone width (375px) and desktop. `npm run build` must pass after changes.

### Release
Deploy to a Vercel preview (staging) and verify on a real phone. **Rollback:** revert the task branch's commits and redeploy — no data migration to undo.

---

## 4. Coverage — every AC mapped

| AC | Plan task(s) | How it's checked |
|---|---|---|
| AC-01 | FirstStep rewrite (frame only, no boxes/panel/crop) | Load Product Details with no photos → one "+" frame, none of the old controls present |
| AC-02 | Multi-select upload, ordered append | Select 3 photos → all 3 appear in picked order |
| AC-03 | `resizeImageFile` on direct upload | Pick a 6MB photo → uploads with no crop step, appears in list |
| AC-04 | `remaining` cap + message | 3 added, select 3 more → only 1 added, message shown |
| AC-05 | Remove handler (DELETE + array splice) | Remove middle photo → others keep order, media delete called |
| AC-06 | Array order preserved into Redux/AI | Add A then B → AI receives A first (main) |
| AC-07 | Downstream unchanged (array via Object.values) | 2 photos → Next → Submit → form filled, product created (same as before) |
| AC-08 | Shared FirstStep in `/try` | Guest flow shows same frame/behaviour |
| AC-09 | Keep camera, direct upload | Capture a photo → added to sequence, no crop |
| AC-10 | Image-only validation | Select a video → rejected "Please upload images only." |
| AC-11 | Next disabled logic on array length | 0 photos → Next disabled; ≥1 → enabled |
| AC-12 | Back commits array; mount normalizes | Add 2 → Next → Back → same 2 in order |

**§4.4 places:** dashboard upload (AC-01/02/05/07), guest demo (AC-08), AI/submit step (AC-06/07). **Stages:** add (AC-02/03), limit (AC-04), remove (AC-05), Back/Next (AC-12), submit (AC-07).
**§7 rows:** input (AC-10 + disable-while-uploading), stored data (no new store; delete on remove AC-05), removing a photo (AC-05), performance (resize AC-03), mobile (375px manual), accessibility (keyboard + labels on "+" and remove), breaking features (AC-06/07/08 + baseline), errors (upload/delete fail messages §5), rollback (revert branch).

---

## 5. Risks & undo
- **Legacy persisted object** rehydrating in the new array UI → handled by the normalize-on-read step; verify by seeding an old `{frontView…}` object in localStorage and loading the step.
- **Removing the crop** could let oversized photos through → `resizeImageFile` + >4MB guard keep the Vercel limit safe; test with a large phone photo.
- **How to undo:** revert the branch commits and redeploy. No migration.

---

## 6. Before baseline
- `npm run build`: **PASS** (exit 0) before any change — all routes compile, including `/try/add-product` and the dashboard add-product flow. This is the gate to re-run after coding.
- `npm run lint`: not runnable (pre-existing Next 16 issue) — not a gate for this task.

---

## 7. Logging (timesheet)
- plan approved & saved → `log-step.sh 443 plan` (and set `task.json.plan`)
- code written & reviewed → `log-step.sh 443 implement`
- §14 filled, every AC checked → `log-step.sh 443 validate`
- fix rounds → `log-step.sh 443 iterate`
