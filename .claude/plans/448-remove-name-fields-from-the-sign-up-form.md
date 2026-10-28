# Plan — Task #448: Remove name fields from the Store sign-up form

Follows the spec `.claude/specs/448-remove-name-fields-from-the-sign-up-form.md` (§12).
Branch: `feature/448-remove-name-fields-from-the-sign-up-form` (already on it — never create another).
Type: Feature · Risk: **High** (registration flow + saved/personal data).

## Context

The leStores-AI **Store** sign-up asks for First Name and Last Name. The client wants sign-up as
short as possible, so a store owner can register with the fewest fields. We remove those two fields
from the Store tab only.

Investigation (two Explore passes) found the requirement is enforced in **four** independent places,
all unconditional today — so removing the inputs alone is not enough, and a naive removal would
break registration at the server/DB layer:

- `registerSchema` — `firstname`/`lastname` `.required()` unconditionally ([validations.js:5-6](src/actions/validations.js#L5-L6)); the server gate at [authActions.js:44](src/actions/authActions.js#L44) and the client resolver ([StoreForm.jsx:25](<src/app/(auth)/register/StoreForm.jsx#L25>)).
- `User` model — both `required: true` unconditionally ([User.js:8-9](src/models/User.js#L8-L9)); enforced on the `.save()` path ([authActions.js:122](src/actions/authActions.js#L122)). (The "claim unclaimed store" path at [authActions.js:76-90](src/actions/authActions.js#L76-L90) passes no `runValidators`, so the model does not gate there.)
- `profileSchema` (shared) — `.required()` unconditionally ([validations.js:93-94](src/actions/validations.js#L93-L94)); server gate at [authActions.js:304](src/actions/authActions.js#L304) **with** `runValidators: true` at [authActions.js:326](src/actions/authActions.js#L326).
- `profileSchema` (duplicated local copy) — [Profile.jsx:43-44](src/app/dashboard/profile/Profile.jsx#L43-L44).

Key de-risking facts found:
- **Only the Store tab** collects a human name in self-signup. The Brand tab is commented out of [RegisterForm.jsx](<src/app/(auth)/register/RegisterForm.jsx>); Consignor ("Client") shares `registerSchema`, so the schema change must keep requiring names for non-store roles. All other store-creation paths (admin add / CSV import / Discover) already hard-code `firstname:"Unclaimed", lastname:"Store"`.
- **No email or Stripe customer is created at register time** — `registerUser` only validates, saves, and transfers guest products. The owner name is read *later* by admin screens, the login session, subscription/reset emails, the Stripe customer (created at subscription), and the public SSO exchange. So, per the approved decision (spec D2), we keep those working by storing a **non-blank placeholder derived from the Store Name** rather than editing ~20 reader sites.
- No test runner exists; project checks are `npm run lint` + `npm run build` only.

## Approach

Scope the relaxation to `role === "store"` at the gate *and* the backstop, and auto-fill a
store-name placeholder so every downstream reader stays non-blank. Nothing changes for Consignor
(or the dormant Brand), and no existing record is touched.

### 1. Store form — remove the name row
[StoreForm.jsx](<src/app/(auth)/register/StoreForm.jsx>): delete the First/Last Name flex row (the
`<div className="flex …">` wrapper at lines **81-108**, both inputs and their error spans). Store
Name (line 109) becomes the first field. `role: "store"` is still hard-coded ([:27, :48](<src/app/(auth)/register/StoreForm.jsx#L27>)); the submit spreads `...data` ([:46](<src/app/(auth)/register/StoreForm.jsx#L46>)), which will simply no longer carry `firstname`/`lastname`. No other field changes.

### 2. Register validation — make names store-optional (keep others required)
[validations.js:5-6](src/actions/validations.js#L5-L6), `registerSchema`: convert `firstname` and
`lastname` to the project's established `.when("role")` pattern (as `storename`/`businessNumber`
already do at [:52-56](src/actions/validations.js#L52-L56)):
```js
firstname: Yup.string().when("role", {
  is: "store",
  then: () => Yup.string().trim().nullable(),
  otherwise: () => Yup.string().trim().required("First name is required"),
}),
lastname: Yup.string().when("role", { /* same shape */ }),
```
This relaxes both the server gate ([authActions.js:44](src/actions/authActions.js#L44)) and the
client resolver in one place; Consignor (`role` = consignor → `otherwise`) still requires names.

### 3. User model — conditional required for store
[User.js:8-9](src/models/User.js#L8-L9): mirror the existing conditional fields
([country :30-35](src/models/User.js#L30-L35), [businessNumber :36-41](src/models/User.js#L36-L41)):
```js
firstname: { type: String, required: function () { return this.role !== "store"; } },
lastname:  { type: String, required: function () { return this.role !== "store"; } },
```
Needed because the `.save()` path runs validators. Non-store roles stay required; existing records
are unaffected (validators run on write, not read).

### 4. registerUser — auto-fill the placeholder for store
[authActions.js](src/actions/authActions.js), both store write paths, set the owner name from the
Store Name (derivation per spec D2; must be non-blank so later readers don't show `" "`):
- New-user path ([:95-122](src/actions/authActions.js#L95-L122)): for `role === "store"`, write
  `firstname: storename`, `lastname: ""`. (Keep the existing brand/consignor handling untouched —
  `lastname: role === "brand" ? undefined : lastname` stays for non-store.)
- Claim-unclaimed path ([:76-90](src/actions/authActions.js#L76-L90)): replace the `firstname,
  lastname` it writes with `firstname: storename, lastname: ""` (the incoming request no longer has
  a name; this also upgrades the old "Unclaimed"/"Store" placeholder to the real store name).

Result for a nameless store: `session.user.name` = `firstname + " " + lastname` = `"<storename> "`
([auth.config.js:34](src/auth.config.js#L34), **left unchanged** — scope bars touching auth);
emails greet `"Hi <storename>,"`; admin and Stripe show `"<storename>"`; SSO returns
`firstname:"<storename>", lastname:""`. All non-blank. `auth.config.js` is intentionally **not**
edited.

### 5. Profile edit — don't block a nameless store from saving (spec FR-07)
Relax the same two name fields to store-optional in **both** profile schemas, using the `.when("role")`
pattern already present there:
- Shared [validations.js:93-94](src/actions/validations.js#L93-L94) (server gate at [authActions.js:304](src/actions/authActions.js#L304)).
- Local duplicate [Profile.jsx:43-44](src/app/dashboard/profile/Profile.jsx#L43-L44) (client resolver).
- The `User` model change (step 3) also covers the profile DB write, which runs `runValidators: true` ([authActions.js:326](src/actions/authActions.js#L326)).
- **Gotcha to handle:** the server `.when("role")` only works if `role` is in the payload passed to
  `updateUser`. `role` is a form default ([Profile.jsx:169](src/app/dashboard/profile/Profile.jsx#L169)) but may not be submitted. Add a hidden `register("role")` (or otherwise include `role` in the `updateUser` payload) so the server conditional resolves; if `role` were absent, the `otherwise` branch would wrongly require a name for stores too. The visible First/Last Name inputs on the profile page stay (now optional) — owners may still add a name later; removing them is out of scope.

### Not fixing (noted): latent brand bug
[authActions.js:97](src/actions/authActions.js#L97) sets `lastname: undefined` for brand while the
model requires it — a brand `.save()` would throw. Brand signup is commented out, so this is
unreachable today and out of scope. Left as-is; flagged for a future task.

## Files

**Change**
- `src/app/(auth)/register/StoreForm.jsx` — remove the First/Last Name row (lines 81-108).
- `src/actions/validations.js` — `registerSchema` (5-6) and `profileSchema` (93-94): name fields → store-optional via `.when("role")`.
- `src/models/User.js` — `firstname`/`lastname` (8-9) → conditional `required` (non-store).
- `src/actions/authActions.js` — `registerUser`: set store placeholder name in both write paths (76-90, 95-122).
- `src/app/dashboard/profile/Profile.jsx` — local `profileSchema` (43-44) → store-optional; ensure `role` is submitted to `updateUser` (hidden `register("role")`).

**Must not change:** authentication/session/password handling, incl. `auth.config.js` and `auth.js`; Consignor and (dormant) Brand name behaviour; Store Name / Country / Business Registration Number / Phone / Email / Password fields; admin/CSV/Discover store-creation paths; all name *reader* sites (they keep working via the placeholder); le-stores.com and the Apple app.

## AC coverage
- FR-01 → AC-01 (Store tab shows no name fields; other fields intact) — step 1
- FR-02/FR-08 → AC-02, AC-03 (register + login with no name) — steps 1-4
- FR-03 → AC-04 (backend save no required error) — steps 2,3,4
- FR-04 → AC-05 admin, AC-06 emails, AC-07 Stripe, AC-08 session, AC-12 SSO (all non-blank via placeholder) — step 4
- FR-05 → AC-09 (Consignor still requires names; Brand dormant) — steps 2,3 role-gating
- FR-06 → AC-10 (existing names unchanged — no migration, validators run on write only)
- FR-07 → AC-11 (store profile saves without a name) — step 5

## Checks, risk, backup, rollback
- **Project checks:** `npm run lint` and `npm run build`. Capture both **before** any change (baseline for §14) and **after**. Build OOMs on this host — run with `NODE_OPTIONS=--max-old-space-size=8192`. No test framework → verification is manual/browser + a Vercel preview deploy.
- **Risk: High.** No schema migration and no bulk update — existing records are never written by this change, so their stored names are safe (AC-10).
- **Backup before coding (required, High risk):** take a MongoDB snapshot/`mongodump` of the target database before the change is deployed to any shared/staging environment, and record it in §14. Rationale: precaution only; the code performs no data migration.
- **Rollback (written + tested):** `git revert` the task commits (or redeploy the previous build) and redeploy. Test the rollback by checking out the pre-change commit and confirming `lint`/`build` pass and the original required-name validation returns. Records created while live keep `firstname:<storename>, lastname:""`; after rollback the model is required again, but validators don't run on read, so those accounts still load. Note: after rollback, those stores would need a name to pass a *future* profile edit — acceptable and reversible. Record the rollback test result in §14.

## Verification (end-to-end, on a Vercel preview deploy with real-like data)
1. `npm run dev`. Open `/register`, Store tab → confirm **no** First/Last Name fields; Store Name, Country, Business Registration Number, Phone, Email, Password present (AC-01).
2. Register a store: Store Name "Nordic Vintage", Country DK, VAT 12345678, a valid phone, `store@example.com`, valid password; submit with no name → success toast, redirect to `/login`, no "First name is required" (AC-02, AC-04).
3. Log in as that store → dashboard loads; inspect the session → `session.user.name` is non-blank (`"Nordic Vintage "`) (AC-03, AC-08).
4. As admin, open **Stores & Users** and **Store Details** → owner cell shows "Nordic Vintage", not blank/space (AC-05).
5. Trigger a subscription/reset email for that store → greeting non-blank ("Hi Nordic Vintage,") (AC-06). Create its Stripe customer (subscription flow) → customer name non-blank (AC-07). Hit the public SSO exchange for it → valid payload, `firstname:"Nordic Vintage"`, `lastname:""` (AC-12).
6. Open the **Consignor ("Client")** tab → First/Last Name still present and required; submit empty → error (AC-09).
7. Take an **existing** store/consignor that already has a real name → log in, open profile/admin → stored name unchanged (AC-10).
8. As the nameless store, open **Profile**, change phone/address, save with the name fields empty → saves, no "First name is required" (AC-11).
9. Run `npm run lint` and `NODE_OPTIONS=--max-old-space-size=8192 npm run build` after changes → both clean (compare to the baseline from §14).
