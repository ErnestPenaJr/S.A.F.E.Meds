# S.A.F.E Meds — Project Recreation Guide for Claude Code

> **Mission:** Recreate the "S.A.F.E Meds" (Smart Medication Management) web application from scratch using the Base44 platform. This document is the single source of truth for architecture, data model, UI, and behavior.

---

## 1. Platform & Tech Stack

| Layer | Technology |
|------|-----------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Routing | react-router-dom v7 |
| State / Data | @tanstack/react-query, Base44 SDK (`@base44/sdk`) |
| Icons | lucide-react |
| Dates | date-fns, moment |
| Charts | recharts |
| Rich text | react-quill |
| Maps | react-leaflet |
| Drag & drop | @hello-pangea/dnd |
| 3D | three.js |
| Markdown | react-markdown |
| Animations | framer-motion |
| Backend | Base44 BaaS (auth, entities, integrations, hosting) |

> **Do NOT install packages outside the list above.** Only use what's already available.

---

## 2. Project Structure

```
src/
├── App.jsx                  # Router + auth/providers wrapper
├── main.jsx                 # React entry point
├── index.css                # Tailwind + design tokens
├── pages.config.js          # Page registry + layout config
├── Layout.jsx               # Sidebar layout (wraps all pages)
├── api/
│   ├── base44Client.js      # Base44 SDK client init
│   ├── entities.js          # Entity SDK re-exports
│   └── integrations.js     # Integration SDK re-exports
├── entities/                # JSON schema files (one per entity)
├── pages/                   # Route-level page components
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── home/               # Dashboard widgets
│   ├── medications/        # Medication cards, forms, search
│   ├── interactions/       # Drug interaction UI
│   ├── schedule/           # Schedule views
│   ├── share/              # Shared list UI
│   ├── pharmacy/           # Pharmacy finder UI
│   ├── notifications/      # Browser notification manager
│   ├── subscription/       # Paywall gate
│   └── common/              # Shared modals, empty states
├── lib/                     # Auth context, utils, query client
├── hooks/                   # Custom hooks
└── utils/
    └── index.ts             # createPageUrl helper
```

---

## 3. Core Configuration Files

### `api/base44Client.js`
```js
import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, serverUrl, token, functionsVersion } = appParams;

export const base44 = createClient({
  appId, serverUrl, token, functionsVersion,
  requiresAuth: false
});
```

### `api/entities.js`
```js
import { base44 } from './base44Client';
export const Query = base44.entities.Query;
export const User = base44.auth;
```

### `api/integrations.js`
```js
import { base44 } from './base44Client';
export const Core = base44.integrations.Core;
export const InvokeLLM = base44.integrations.Core.InvokeLLM;
export const SendEmail = base44.integrations.Core.SendEmail;
export const UploadFile = base44.integrations.Core.UploadFile;
export const GenerateImage = base44.integrations.Core.GenerateImage;
export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile;
```

### `utils/index.ts`
```ts
export function createPageUrl(pageName: string) {
  return '/' + pageName.toLowerCase().replace(/ /g, '-');
}
```

### `pages.config.js`
```js
import Dashboard from './pages/Dashboard';
import Medications from './pages/Medications';
import Schedule from './pages/Schedule';
import AddMedication from './pages/AddMedication';
import Interactions from './pages/Interactions';
import Share from './pages/Share';
import SharedView from './pages/SharedView';
import Pharmacy from './pages/Pharmacy';
import EmergencyCard from './pages/EmergencyCard';
import Pillbox from './pages/Pillbox';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Home from './pages/Home';
import Layout from './Layout.jsx';

export const PAGES = {
  Dashboard, Medications, Schedule, AddMedication, Interactions,
  Share, SharedView, Pharmacy, EmergencyCard, Pillbox,
  Profile, Subscription, Home
};

export const pagesConfig = {
  mainPage: "Home",
  Pages: PAGES,
  Layout: Layout,
};
```

### `App.jsx` (Router)
```jsx
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from '@/lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (<div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>);
  }
  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    else if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}
export default App
```

---

## 4. Entities (Data Model)

Every entity is a JSON file in `entities/<Name>.json`. Built-in fields on every record (do NOT declare): `id`, `created_date`, `updated_date`, `created_by_id`.

### 4.1 `Medication`
Tracks medications, supplements, vitamins, and herbal items.

| Field | Type | Notes |
|-------|------|-------|
| name | string | **required** |
| type | enum: medication, supplement, vitamin, herbal | default: medication |
| generic_name | string | |
| brand_name | string | |
| dosage | string | e.g. "10mg" — **required** |
| form | enum: tablet, capsule, liquid, injection, topical, inhaler, patch, drops, powder, gummy, softgel | **required** |
| color | string | pill identification |
| shape | enum: round, oval, capsule, rectangle, triangle, diamond, other | pill identification |
| imprint | string | code on pill |
| reminder_enabled | boolean | default: true |
| side_effects | string | known side effects |
| frequency | enum: once_daily, twice_daily, three_times_daily, four_times_daily, as_needed, weekly, monthly, custom | **required** |
| custom_frequency | string | |
| times | array<string> | HH:MM strings |
| with_food | boolean | |
| instructions | string | |
| prescribing_doctor | string | |
| start_date | date | |
| end_date | date | |
| pharmacy | string | |
| ndc_number | string | |
| rxnorm_id | string | |
| active | boolean | default: true |
| notes | string | |
| quantity | number | |
| refills_left | number | |
| refill_due_date | date | |
| supplement_purpose | string | |
| ingredient_list | array<string> | |

**RLS:** insert → role: user; read/update/write → created_by == user.email

### 4.2 `MedicationSchedule`
Individual dose instances.

| Field | Type | Notes |
|-------|------|-------|
| medication_id | string | **required** |
| scheduled_time | string | HH:MM — **required** |
| date | date | **required** |
| taken | boolean | default: false |
| taken_at | date-time | |
| skipped | boolean | default: false |
| notes | string | |
| adherence_streak | number | consecutive days taken — default: 0 |

**RLS:** read/write → created_by == user.email

### 4.3 `DrugInteraction`
Drug-drug / drug-supplement interaction records.

| Field | Type | Notes |
|-------|------|-------|
| medication_a_id | string | **required** |
| medication_b_id | string | **required** |
| medication_a_name | string | cached for display |
| medication_b_name | string | cached for display |
| severity | enum: high, medium, low | **required** |
| confidence | number | 0–100 |
| description | string | **required** |
| mechanism | string | |
| clinical_effects | array<string> | |
| recommendations | array<string> | |
| source | enum: openFDA, rxnorm, manual, user_confirmed | |
| acknowledged | boolean | default: false |
| acknowledged_at | date-time | |

**RLS:** read/write → created_by == user.email

### 4.4 `Pharmacy`
User's saved pharmacies.

| Field | Type | Notes |
|-------|------|-------|
| name | string | **required** |
| address | string | |
| city | string | |
| state | string | |
| zip | string | |
| phone | string | |
| fax | string | |
| hours | string | |
| is_favorite | boolean | default: false |
| notes | string | |

**RLS:** read/write → created_by == user.email

### 4.5 `EmergencyContact`
Emergency contact records.

| Field | Type | Notes |
|-------|------|-------|
| name | string | **required** |
| relationship | enum: spouse, parent, child, sibling, friend, caregiver, doctor, other | **required** |
| phone | string | **required** |
| phone_secondary | string | |
| email | string | |
| is_primary | boolean | default: false |
| can_view_medications | boolean | default: false |
| notes | string | |

**RLS:** read/write → created_by == user.email

### 4.6 `SharedList`
Shareable medication lists for doctors/family/caregivers.

| Field | Type | Notes |
|-------|------|-------|
| title | string | **required** |
| description | string | |
| medication_ids | array<string> | **required** |
| recipient_email | string | |
| recipient_name | string | **required** |
| share_type | enum: doctor, family, caregiver | **required** |
| include_schedule | boolean | default: true |
| favorite_pharmacy | string | JSON string of pharmacy info |
| access_code | string | |
| expires_at | date-time | |
| active | boolean | default: true |

**RLS:** read/write → created_by == user.email

### 4.7 `Subscription`
User subscription state.

| Field | Type | Notes |
|-------|------|-------|
| user_email | string | **required** |
| plan_type | enum: free, premium | default: free — **required** |
| status | enum: active, inactive, canceled, past_due | default: active — **required** |
| billing_cycle | enum: monthly, annual | default: monthly |
| trial_end_date | date | |
| started_at | date-time | |
| expires_at | date-time | |
| payment_method | string | |
| external_subscription_id | string | |
| monthly_price | number | default: 4.99 |

**RLS:** read/write → created_by == user.email

### 4.8 `User` (built-in)
Do NOT create this entity. Built-in fields: `id`, `created_date`, `full_name`, `email`. Editable: `role` (admin/user). Custom fields stored via `base44.auth.updateMe()`: `allergies` (array), `notifications_enabled` (boolean), `notification_lead_time` (number).

---

## 5. Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Home** | `/` | Authenticated dashboard: greeting, streak banner, today's stats, today's medications, upcoming doses, recent activity, quick actions |
| **Dashboard** | `/dashboard` | Public landing/marketing page (pre-login) |
| **Medications** | `/medications` | List/filter/CRUD medications; quick add; prescription scanner; refill alerts |
| **AddMedication** | `/addmedication` | Full form to create/edit medication with all fields, schedule times, pill ID |
| **Schedule** | `/schedule` | Daily/weekly schedule view, mark doses taken/skipped, smart schedule generator |
| **Pillbox** | `/pillbox` | Visual pillbox organizer (drag & drop) |
| **Interactions** | `/interactions` | LLM-powered drug interaction analysis, saved interactions, food interactions, safety alerts, manual search |
| **Share** | `/share` | Create/manage shared medication lists for doctors/family/caregivers |
| **SharedView** | `/sharedview` | Public view of a shared list via access code |
| **Pharmacy** | `/pharmacy` | Find pharmacies (map + list), save favorites |
| **EmergencyCard** | `/emergencycard` | Printable emergency card with allergies, contacts, medications |
| **Profile** | `/profile` | Account info, allergies, notification settings, emergency contacts (entity-backed), pharmacies (entity-backed) |
| **Subscription** | `/subscription` | Free vs Premium plans, Stripe checkout, billing |

---

## 6. Layout (Sidebar Navigation)

The `Layout.jsx` component wraps every authenticated page with:
- **Desktop:** Fixed left sidebar with logo, primary nav, secondary nav, user footer with logout
- **Mobile:** Top header with sidebar trigger + quick "Add Med" button

**Primary Navigation:**
- Home → `/`
- My Medications → `/medications`
- Schedule → `/schedule`
- Pillbox Organizer → `/pillbox`
- Drug Interactions → `/interactions`
- Share Lists → `/share`
- Find Pharmacy → `/pharmacy`

**Secondary Navigation (My Health):**
- My Profile → `/profile`
- Emergency Card → `/emergencycard`
- Subscription → `/subscription`

**Branding:** "S.A.F.E Meds" with gradient blue→green pill icon.

**Background:** `bg-gradient-to-br from-blue-50 via-white to-green-50`

---

## 7. Key Components

### Home widgets (`components/home/`)
- `MedicationStats` — stat cards (total meds, total doses, taken, pending)
- `TodaysMedications` — today's dose list with take/skip actions
- `UpcomingDoses` — next 3 pending doses
- `RecentActivity` — recently taken/skipped doses

### Medication components (`components/medications/`)
- `MedicationCard` — card with dosage, frequency, badges, active toggle, edit/delete menu, education link
- `MedicationFilters` — search + status + type filters
- `MedicationEducationCard` — LLM-generated education modal
- `QuickAddMedication` — fast name-only add
- `QuickMedicationSearch` — search suggestions
- `LiveMedicationSearch` — real-time RxNorm/OpenFDA search
- `MedicationSearchSuggestions` — dropdown suggestions
- `PrescriptionScanner` — camera scan → extract data via LLM

### Interaction components (`components/interactions/`)
- `InteractionAnalysis` — LLM analysis results with severity cards
- `SavedInteractions` — DB-stored interactions with acknowledge button
- `FoodInteractions` — food/drug interactions
- `InteractionSearch` — manual pair search
- `SafetyAlerts` — safety warning feed

### Schedule components (`components/schedule/`)
- `DailyScheduleView` — day timeline
- `ScheduleCalendar` — monthly calendar
- `ScheduleConflicts` — conflict detection
- `SmartScheduleGenerator` — LLM-assisted schedule

### Share components (`components/share/`)
- `CreateShareModal` — create shared list
- `SharePreview` — preview before sharing
- `SharedListCard` — list card
- `SharedListSimple` — simplified view
- `SimpleShareForm` — quick share form

### Pharmacy components (`components/pharmacy/`)
- `PharmacyList` — list of nearby pharmacies
- `PharmacyMap` — leaflet map
- `FavoritePharmacyCard` — saved pharmacy card

### Notifications (`components/notifications/`)
- `NotificationManager` — browser notification scheduler (checks schedule, fires reminders)
- `NotificationModal` — notification UI

### Subscription (`components/subscription/`)
- `SubscriptionGate` — wraps premium features, shows upgrade prompt if free plan / limit exceeded

### Common (`components/common/`)
- `ConfirmModal` — confirmation dialog
- `EmptyState` — empty list placeholder
- `InfoModal` — info dialog
- `DatabaseSchema` — schema viewer

---

## 8. Integrations (Base44 Core)

Used via `base44.integrations.Core`:

| Integration | Usage in App |
|------------|-------------|
| `InvokeLLM` | Drug interaction analysis, medication education, prescription scanning, smart schedule generation |
| `UploadFile` | Prescription image upload |
| `ExtractDataFromUploadedFile` | Extract medication data from scanned labels |
| `GenerateImage` | (available, used sparingly) |
| `SendEmail` | Share list delivery, emergency card export |
| `TranscribeAudio` | (available) |
| `GenerateSpeech` | (available) |
| `GenerateVideo` | (available) |

**InvokeLLM pattern:**
```js
const result = await InvokeLLM({
  prompt: "...",
  response_json_schema: { type: "object", properties: { ... } },
  add_context_from_internet: true  // only with gemini_3_flash / gemini_3_1_pro
});
```

---

## 9. External APIs & Services

The app does **not** call external REST APIs directly (no RxNorm, OpenFDA, Google Places, or Google Maps API keys). Instead, it uses **Base44's `InvokeLLM` with `add_context_from_internet: true`** as a universal data layer — the LLM performs web searches (Google, Google Maps, news) and returns structured JSON.

### 9.1 Base44 InvokeLLM (primary "API")

All external data flows through `InvokeLLM`. Each call includes a detailed prompt + `response_json_schema` for structured output.

| Feature | Prompt Goal | `add_context_from_internet` |
|---------|------------|---------------------------|
| **Medication search** (`LiveMedicationSearch`) | Search medications by name → returns name, generic, brand names, forms, strengths, primary use, confidence | ✅ `true` |
| **Drug interaction analysis** (`Interactions` page) | Analyze full med/supplement list for drug-drug, drug-supplement, supplement-supplement, food interactions, safety alerts, timing recommendations | ❌ `false` (uses LLM training knowledge) |
| **Pharmacy finder** (`Pharmacy` page) | Find up to 15 pharmacies near a location → returns name, address, phone, website, latitude, longitude | ✅ `true` |
| **Food interactions** (`FoodInteractions`) | Food/drug interactions for all items | ❌ `false` |
| **Safety alerts** (`SafetyAlerts`) | Safety warnings and precautions | ❌ `false` |
| **Medication education** (`MedicationEducationCard`) | Patient-friendly education about a medication | ❌ `false` |
| **Smart schedule generator** (`SmartScheduleGenerator`) | Generate optimal dosing schedule from medication list | ❌ `false` |
| **Prescription scanner** (`PrescriptionScanner`) | Uses `UploadFile` + `ExtractDataFromUploadedFile` (not InvokeLLM) to OCR a prescription label photo | N/A |

**InvokeLLM pattern:**
```js
const result = await InvokeLLM({
  prompt: "...",
  response_json_schema: { type: "object", properties: { ... } },
  add_context_from_internet: true  // only with gemini_3_flash / gemini_3_1_pro
});
```

> **Note:** `add_context_from_internet: true` only works with `gemini_3_flash` or `gemini_3_1_pro` models. Other models will raise an error.

### 9.2 OpenStreetMap (map tiles)

- **Library:** `react-leaflet` + `leaflet`
- **Tile URL:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Attribution:** OpenStreetMap contributors
- **No API key required** (free tiles)
- Used in `PharmacyMap` component to render the pharmacy map with user location + pharmacy markers

### 9.3 Leaflet Marker Icons (CDN)

Custom colored markers loaded from CDN (no local assets):
- **User location (blue):** `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png`
- **Pharmacy (green):** `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png`
- **Selected pharmacy (red):** `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png`
- **Default icons:** `https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png` etc.
- **Marker shadows:** `https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png`

### 9.4 Stripe (payments, via backend functions)

> ⚠️ **Requires Builder+ plan** — backend functions are currently inaccessible on the free plan.

Backend functions (in `functions/` directory):
- `createCheckoutSession` — creates a Stripe Checkout session for premium subscription
- `stripeWebhook` — handles Stripe webhook events (subscription created, payment failed, etc.)
- `cancelSubscription` — cancels a Stripe subscription

The `Subscription` entity mirrors Stripe state (`external_subscription_id`, `status`, `plan_type`, `billing_cycle`, `trial_end_date`).

### 9.5 Browser Notifications API

Used by `NotificationManager` component (rendered in Layout):
- `Notification.requestPermission()` — asks user for permission
- `new Notification(title, { body, icon })` — fires dose reminders
- Checks `MedicationSchedule` for upcoming doses
- Fires `notification_lead_time` minutes before scheduled time
- Permission state tracked in Profile (`notificationPermission`)

### 9.6 Browser Geolocation API

Used by `Pharmacy` page:
- `navigator.geolocation.getCurrentPosition()` — gets user's lat/lng for "find pharmacies near me"
- Sets `userLocation` state → passed to `PharmacyMap` as blue marker

### 9.7 localStorage

- `medtracker_recent_searches` — stores last 5 medication search terms (in `LiveMedicationSearch`)

### 9.8 SEO backend functions

> ⚠️ **Requires Builder+ plan**

- `robots` — serves `/robots.txt`
- `sitemap` — serves `/sitemap.xml`

---

## 10. Auth & User Management

- Platform owns auth backend — never implement login pages or auth logic.
- `base44.auth.me()` → current user (throws if not logged in)
- `base44.auth.updateMe({ allergies, notifications_enabled, notification_lead_time })` → persist custom user data
- `base44.auth.isAuthenticated()` → Promise<boolean>
- `base44.auth.logout(redirectUrl)` → logout + redirect
- `base44.auth.redirectToLogin(nextUrl)` → go to login page
- `base44.users.inviteUser(email, role)` → invite user ("user" or "admin")

---

## 11. Entity SDK Usage

```js
import { base44 } from '@/api/base44Client';

// List
base44.entities.Medication.list('-created_date', 20)  // sort, limit
// Filter
base44.entities.Medication.filter({ active: true })
// CRUD
base44.entities.Medication.create({ name: "...", dosage: "10mg", ... })
base44.entities.Medication.update(id, { active: false })
base44.entities.Medication.delete(id)
// Bulk
base44.entities.Medication.bulkCreate([...])
base44.entities.Medication.bulkUpdate([{ id, ... }])
base44.entities.Medication.updateMany({ active: true }, { $set: { active: false } })
base44.entities.Medication.deleteMany({ active: false })
// Realtime
const unsubscribe = base44.entities.Medication.subscribe((event) => { ... });
```

---

## 12. Design System

### Colors (CSS variables in `index.css`)
- Light theme: white bg, near-black foreground
- Dark theme: near-black bg, near-white foreground
- Semantic tokens: `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`
- Chart palette: 5 colors
- Sidebar tokens: `--sidebar-background`, `--sidebar-foreground`, etc.

### Brand gradient
`bg-gradient-to-r from-blue-500 to-green-500` — used on primary buttons, logo, active nav items.

### Typography
System font stack (Inter preferred). Use Tailwind classes: `font-heading`, `font-body`, `font-display` if tokens defined.

### Radius
`--radius: 0.5rem` (8px) — cards use `rounded-xl` (12px).

### Tailwind class rules
- Write Tailwind classes as **literal strings** — dynamic `bg-${color}-500` will be purged.
- Use `safelist` in `tailwind.config.js` only for runtime-sourced values.

---

## 13. Build & Run

```bash
npm install
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

**Vite config:** `@` alias → `src/`. Mode: development for dev, production for build.

---

## 14. Recreation Steps (in order)

1. **Initialize project** — Vite + React, install all packages from Section 1.
2. **Create config files** — `api/base44Client.js`, `api/entities.js`, `api/integrations.js`, `utils/index.ts`, `pages.config.js`, `App.jsx`, `main.jsx`, `index.css`, `tailwind.config.js`.
3. **Create entities** — Write all 7 entity JSON files (Section 4) to `entities/`.
4. **Create Layout** — `Layout.jsx` with sidebar navigation (Section 6).
5. **Create shadcn/ui components** — All primitives in `components/ui/` (button, card, input, label, select, badge, alert, switch, dialog, tabs, dropdown-menu, etc.).
6. **Create pages** — Build each page per Section 5, importing components and using the entity SDK.
7. **Create feature components** — Per Section 7, in logical order (home → medications → interactions → schedule → share → pharmacy → notifications → subscription → common).
8. **Wire integrations** — LLM calls for interactions, education, scanning, schedule generation.
9. **Add auth context** — `lib/AuthContext.jsx`, `lib/query-client.js`, `lib/NavigationTracker.jsx`.
10. **Test all flows** — Add medication → schedule dose → mark taken → check streak → check interactions → share list → view emergency card.

---

## 15. Key Behaviors to Replicate

- **Streak counter:** Home dashboard shows a flame banner with the max `adherence_streak` from today's taken doses.
- **Drug interactions:** LLM analyzes the full medication list; results saved to `DrugInteraction` entity; users can "Acknowledge" interactions (sets `acknowledged=true` + timestamp).
- **Subscription gate:** Free users limited to 5 active medications; premium features (scanner, advanced interactions) gated behind `SubscriptionGate`.
- **Notifications:** `NotificationManager` runs in Layout, checks `MedicationSchedule` for upcoming doses, fires browser notifications `notification_lead_time` minutes before.
- **Profile:** Emergency contacts and pharmacies are entity-backed (create/delete via SDK), not JSON blobs.
- **Prescription scanner:** Upload image → `ExtractDataFromUploadedFile` → pre-fill AddMedication form.
- **Emergency card:** Printable view with allergies, emergency contacts, active medications.
- **Shared lists:** Generate access code, share via email, recipient views at `/sharedview?code=...`.

---

## 16. Important Notes

- **Never** create a login page — platform provides auth UI.
- **Never** store large blobs (base64, PDFs) in entity fields — use `UploadFile` and store the URL.
- **Never** install packages outside the approved list.
- **Always** export pages/components as default, named same as the file.
- **Always** use `find_replace` for editing existing files; `write_file` for new files and entity schemas.
- **Always** handle loading and empty states on data-driven views.
- **Always** make UI responsive (mobile + desktop).
- **RLS** is critical — every entity restricts data to the owning user via `created_by == {{user.email}}`.