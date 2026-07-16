# Bulk Multi-Product Upload with AI Grouping — How It Would Work

**Client request (verbatim):**
> "Select up 2/3 pictures of the same product different views and around 6 product at a
> time total 20 pictures at the same time, selected from the device and upload them together
> on Ree. Ree then identifies the product that goes together and label them."

**In plain terms:** dump ~20 loose photos from the phone in one go (2–3 views each of ~6
products), and have Ree automatically **figure out which photos belong to the same product**,
group them, and label each group — instead of adding products one at a time.

This document explains the current flow, what the new flow requires, where the real effort
sits, and the time estimate.

---

## 1. Important correction to the premise

The request assumes *"we currently upload 1 picture per product."* That's **not accurate** —
the current flow **already supports multiple pictures per product with views** (front / back /
side), up to **4 images each** (see [FirstStep.jsx:527](../src/app/dashboard/add-product/components/FirstStep.jsx#L527):
*"User can upload up to 4 images for each product"*).

So the multi-view part already exists. The two things that are genuinely **new** are:

1. Uploading **many products' photos at once** (currently it's one product at a time).
2. Ree **automatically deciding which loose photos belong to the same product** (currently
   *the user* decides that, by uploading one product's photos in one session).

That second point is the hard, time-consuming part — see §4.

---

## 2. The current flow (original approach)

The add-product flow is a **3-step wizard that handles one product at a time**:

```
Step 1  Select consignor
Step 2  Add THIS product's images (up to 4, tagged front/back/side), crop each
Step 3  AI analyses those images  →  fills in title, brand, category, size, etc.
        →  Save product  →  "Add another product" restarts the wizard
```

Key facts from the code:

- **Images are added one at a time** — camera shutter or a single-file picker (the file input
  is *not* multi-select), then each is cropped.
- **Grouping is manual and implicit** — because you upload one product's photos in one
  session, Ree already "knows" they belong together. There is no guessing involved.
- **AI labels one product at a time** — [SecondStep.jsx:185](../src/app/dashboard/add-product/components/SecondStep.jsx#L185)
  sends that product's image URLs to `/api/ai/analyze-product` and gets back the labels for
  that single item.

**Bottom line:** today Ree only ever has to *label* a product whose photos are already grouped
for it. It never has to *work out the grouping itself*.

---

## 3. The new flow (bulk approach)

```
1. Select ~20 photos from the device in one go
2. Bulk-upload them all to Cloudinary
3. Ree GROUPS them → clusters the 20 loose photos into ~6 products
       (front/back/side of the same item land in the same group)
4. Review screen → user checks the 6 groups, drags any stray photo
       into the right product, splits/merges if Ree got it wrong
5. Ree labels each confirmed group (existing AI analysis, run per group)
6. Save all ~6 products at once
```

Steps 1–2 are ordinary UI work. **Steps 3 and 4 are where the effort concentrates.**

---

## 4. Where the extra time goes (the hard parts)

### 4a. AI grouping / clustering — the single biggest cost
Given 20 unlabelled photos, Ree has to decide *"these 3 are the same jacket; those 2 are the
same dress."* That is a genuinely difficult computer-vision problem:

- It needs an **image-similarity step** — generating an embedding (a numeric "fingerprint")
  for each photo, then clustering photos whose fingerprints are close together.
- The current `/api/ai/analyze-product` **does not do this** — it labels an
  already-grouped product. So the grouping pipeline is **net-new**, not a tweak.
- **It will never be 100% accurate.** Real-world failure cases:
  - Two similar black dresses get merged into one product.
  - The front and back of the *same* item look unrelated and get split into two.
  - A close-up of a label doesn't obviously match its garment.
- Accuracy needs **tuning** (similarity thresholds, how many clusters to expect), which is
  iterative and eats hours on its own.

### 4b. The review / correction screen — mandatory, not optional
Because grouping is a *best guess*, the user **must** be able to fix it:

- See the ~6 detected groups as photo stacks.
- **Drag a stray photo** from one product to another.
- **Split** a group Ree wrongly merged, or **merge** two it wrongly split.
- Only then confirm and proceed to labelling.

Skipping this screen would mean wrong products get created silently — so it's required, and
drag-to-regroup UI is fiddly to build well.

### 4c. Batch processing
Labelling and saving 6 products in one pass (instead of one) means:

- Running the AI analysis per group and handling partial failures (product 4 fails, 1–3 & 5–6
  still save).
- Bulk create + bulk Shopify sync, with progress feedback.

### 4d. Cost & performance note
Bulk uploads multiply the AI calls — ~20 embeddings + ~6 full analyses per batch. Worth
confirming expected volume, because it affects OpenAI/vision cost and upload time.

---

## 5. Original vs. bulk — side by side

| Capability | Original (today) | Bulk (requested) |
|---|---|---|
| Multiple views per product (front/back/side) | ✅ Up to 4 | ✅ Kept |
| Products per session | ➊ One at a time | ➏ ~6 at once |
| Photos selected at once | 1 (single picker) | ~20 (bulk multi-select) |
| Who groups the photos | 👤 The user (implicitly) | 🤖 Ree (AI clustering) |
| Grouping accuracy | 100% (manual) | Best guess — needs a review/fix step |
| AI's job | Label a pre-grouped product | Group loose photos **then** label |

---

## 6. Time estimate

| Work | Hours |
|---|---|
| Bulk multi-image select + upload to Cloudinary | 8–12h |
| **AI grouping / clustering pipeline** (embeddings + clustering) | 16–24h |
| **Group review / correction screen** (drag, split, merge) | 12–18h |
| Batch analyse + batch create (reuse existing AI/save) | 8–12h |
| Accuracy tuning, testing, deploy | 8–12h |
| **Total** | **~50–75h** |

The total is **dominated by the AI grouping and the correction screen** (§4a + §4b), not by
the upload itself. The straightforward "select 20 and upload" part is a small slice of the
work.

---

## 7. What to set expectations on

- **Ree's auto-grouping is a best guess, not magic.** For ~20 loose photos it will sometimes
  merge two similar items or split one item's views. The review screen exists precisely to
  catch that — so the honest promise is *"Ree groups them for you and you confirm/fix in
  seconds,"* not *"Ree always groups them perfectly."*
- **Suggested phasing** (bill hourly against milestones):
  1. **Bulk upload + batch create** (no AI grouping yet — user drops 20 photos and assigns
     them to products manually). Delivers the "upload many at once" win fast. ~20–28h.
  2. **AI grouping + review screen** — add the automatic clustering on top. ~28–42h.
  3. **Tuning + polish.** ~8–12h.

  Phase 1 alone already removes the "one product at a time" pain and is fully usable while the
  harder AI grouping is built and tuned.

---

## 8. Short client-facing message (paste-ready)

> Great idea — let me explain where we are and what this would take.
>
> Quick note first: Ree already lets you add 2–3 photos of the same product (front/back/side)
> — that part exists today. What's new in your request is two things: uploading **many
> products' photos at once** (around 20 photos, ~6 products together), and having **Ree
> automatically work out which photos belong to the same product** and label each group.
>
> That auto-grouping is the clever (and most involved) part. Ree would look at all 20 photos,
> group the ones that are the same item, and then label each product for you. Because it's the
> computer guessing which photos go together, it won't be perfect every time — so there'd be a
> quick review screen where you glance at the groups and drag a stray photo into the right
> product before saving. Think "Ree groups them and you confirm in seconds," rather than
> "always perfect."
>
> Time-wise this is roughly **50–75 hours**, and most of that is the smart grouping and the
> review step — not the uploading itself.
>
> To keep it manageable and get you a win quickly, I'd suggest doing it in two parts:
> 1. **Bulk upload first** — drop 20 photos at once and assign them to products yourself. This
>    removes the "one product at a time" hassle straight away (~20–28h).
> 2. **Add the AI auto-grouping** on top, so Ree does the grouping for you (~28–42h).
>
> That way you get the everyday time-saver first, and we add the smart grouping once it's built
> and tuned. I'd bill hourly against each part so you can see it working as we go.
