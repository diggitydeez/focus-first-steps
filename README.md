# Freelancer First Steps

Build a polished interactive desktop web prototype called “Focus — Freelancer Setup”. It should look and feel like a natural extension of the existing Toggl Focus product shown in the reference: white workspace, soft gray surfaces, compact left navigation, black typography, and restrained pink-to-purple accents. Do not copy logos or use external brand assets. Use clean sans-serif typography, subtle 1px borders, 12–16px radii, generous whitespace, and accessible contrast. Avoid gradients, excessive cards, oversized hero text, and generic startup-landing-page styling.

PRODUCT HYPOTHESIS

Freelancers who configure one client engagement before tracking will reach meaningful value sooner than freelancers who create an unstructured project and immediately start a timer, because their first week of time data can immediately show progress against a commercial boundary.

PROTOTYPE GOAL

Create one complete, testable journey:

choose freelancer mode → describe or import one existing engagement → review an AI-proposed client/project/commercial structure → start a correctly categorized timer → preview a useful week-one progress insight.

This is a frontend prototype only. No authentication, database, external API, Supabase, or real LLM is needed. Keep all data in browser state. Simulate AI extraction using lightweight client-side parsing plus sensible fallback data. The prototype must accept evaluator-written text, not only one hard-coded sample.

GLOBAL SHELL

After onboarding, use a compact Focus-style application shell:

- narrow left rail with the product mark “Focus”

- sections Track, Analyze, Plan

- items Timer, Reports, Projects, Tasks

- small user avatar at bottom

- desktop-first layout at 1440px but responsive down to tablet

- clear Back actions during onboarding

- a subtle step indicator

Do not include team management, approvals, time off, invoicing, or enterprise features.

SCREEN 1 — INTENT

Heading: “What will you mainly use Focus for?”

Supporting copy: “We’ll tailor your first experience to help you get useful time data this week.”

Three selectable options:

1. “Manage my freelance client work” — Balance clients, projects and billable commitments.

2. “Track my own time” — See where my working day goes.

3. “Plan work for a team” — Coordinate people and capacity.

Only the freelancer option continues through the full prototype. Select it by default after click, then enable Continue.

Include a quiet secondary link: “Skip and start tracking”.

SCREEN 2 — SET UP FIRST CLIENT ENGAGEMENT

Heading: “Set up your first client engagement”

Copy: “Bring what you already know. Focus will propose a structure you can check before anything is created.”

Show three input modes as compact tabs or tiles:

- Describe it

- Paste notes

- Upload screenshot

Describe it is active by default.

Large editable textarea prefilled with this fictional example:

“I work with Northstar Studio on a monthly €2,000 retainer covering up to 30 hours. Most of my time is split between their website redesign and analytics dashboard. Client calls, revisions and admin should be tracked separately.”

Add a small example hint below.

Primary button: “Create suggested setup”

Secondary: “Set up manually”

For Upload screenshot, implement a convincing file-drop state but do not require actual OCR. Selecting a local image should show its filename and allow analysis using the fallback result.

The prompt must work with arbitrary non-empty text.

SIMULATED EXTRACTION BEHAVIOR

Implement lightweight deterministic parsing in the frontend:

- detect billing words: retainer/monthly → Monthly retainer; fixed/flat/project fee → Fixed fee; hourly/per hour → Hourly

- detect €/$/£ numeric amounts where possible

- detect an hour quantity near “hours”

- attempt to infer a client name after phrases like “with”, “for”, or “client”

- infer workstreams from phrases after “between”, “including”, “covering”, or comma-separated activities

- always suggest “Client communication & admin” as a non-billable or reviewable category

- if parsing is uncertain, use neutral fallbacks and mark the field “Confirm”

- never generate more than 3 projects/workstreams

- do not generate dozens of tasks

- allow any non-empty input to proceed

Show a 1.2-second processing state with messages:

“Finding the client…”

“Identifying billing terms…”

“Creating a useful first-week structure…”

SCREEN 3 — REVIEW SUGGESTED STRUCTURE

Heading: “Review your engagement”

Copy: “Nothing is created until you confirm it.”

Use one calm editable form, not a dashboard.

Fields:

- Client name

- Billing model: Hourly / Fixed fee / Monthly retainer

- Fee or hourly rate with currency

- Included hours and period

- Start date

Projects/workstreams section with editable rows and remove controls, maximum 3:

- Website redesign

- Analytics dashboard

Categories section:

- Client communication & admin

Each row can be marked Billable, Non-billable, or Ask each time.

Use small “AI suggested” labels and “Confirm” badges only where appropriate.

Include a compact summary panel:

“Focus will create 1 client, 2 projects and 1 reusable category.”

Buttons:

- Back

- Confirm and create

All inputs and remove/add controls must work.

SCREEN 4 — READY TO TRACK

Show a success confirmation:

“Northstar Studio is ready”

“Your first entry will already be connected to the structure you just reviewed.”

Then display a compact timer composer:

Description: “What are you working on?”

Project dropdown showing Website redesign and Analytics dashboard

Client shown as Northstar Studio

Category dropdown

Billable toggle

Large Start timer button

Include an “Uncategorized from calendar” row below:

“Northstar weekly check-in · Today, 14:00–14:45”

Button: “Categorize”

Clicking Categorize opens a small modal to choose project, category and billable status, then saves and changes the row to “Ready to track”.

Starting the timer changes it to a running state with an elapsed counter. Include a prominent button “Preview Friday” so evaluators can reach the W0 value state without waiting.

SCREEN 5 — FRIDAY / WEEK-ONE VALUE

Keep the app shell. Heading: “This week”

Subheading: “Northstar Studio · Sep 7–11”

Show one primary insight card:

Title: “You’re using time faster than planned”

Status badge: “Needs attention”

Progress: “18 of 20 planned hours used”

Copy: “At this pace, you’ll reach the monthly allowance about 6 days early.”

Show a simple horizontal progress bar at 90%.

Below, show a compact breakdown:

- Website redesign — 9.5h

- Analytics dashboard — 4.3h

- Client communication & revisions — 4.2h

Call out: “23% of this engagement was spent on communication and revisions.”

Actions:

- Review time

- Add missed time

- Adjust next week

Make Review time open an editable list of entries. Make Add missed time open a functional modal. Make Adjust next week change a small planned-hours value and update the progress calculation.

Also show two quiet secondary cards:

- “2 uncategorized events” with Review

- “€1,200 of €2,000 retainer represented by tracked time” labelled “Directional, not an invoice”

IMPORTANT PRODUCT DETAILS

- Clearly distinguish tracked, planned, included and billable time.

- Do not claim the product automatically detects contractual scope creep.

- Describe the warning as an early commercial signal, not a definitive judgment.

- Preserve a visible “Skip and start tracking” escape hatch.

- Use concise human copy, not AI buzzwords.

- Add tooltips to unfamiliar terms such as Included hours and Directional.

- Use realistic empty, loading, success and validation states.

- All primary buttons, back navigation, edit controls, dropdowns, toggles and modals must work.

- Include a “Restart prototype” link in the final screen for evaluator testing.

- Do not add unrelated pages or features.

- Do not include fake testimonials, pricing pages or marketing content.

IMPLEMENTATION

Use React, TypeScript and Tailwind or the existing Lovable frontend stack. Use local state only. Create clean reusable components and keep the code straightforward enough to inspect. Provide accessible labels, keyboard-friendly controls and visible focus states. Seed the example data but ensure custom evaluator input produces an editable plausible result using the heuristic extraction and fallbacks described above.

Name the project “Focus Freelancer Activation”.

VISUAL FIDELITY — HIGH PRIORITY ACCEPTANCE CRITERION

The prototype must feel like it belongs inside the current Toggl Focus interface, not like a generic new SaaS product inspired by it. Follow the visual language visible in Focus:

- dense but calm productivity-tool layout

- white main canvas and very light warm-gray navigation surfaces

- black or near-black headings, medium-gray secondary copy

- a restrained magenta-purple accent for selected states and primary actions

- teal/green used only for client/project identity and positive status, not as a competing brand color

- thin neutral-gray borders and subtle shadows only on floating drawers/modals

- compact controls, pills, segmented switches and dropdowns

- left navigation approximately 230–250px wide on desktop

- 14–16px body copy; page headings around 24–30px, never oversized

- use Inter as the closest available web-font approximation; prioritize the same clean, practical typographic rhythm over decorative styling

- square-ish controls with modest 8–12px radii; avoid bubbly 20–30px cards

- no gradients, glassmorphism, neon, illustrations, marketing hero sections or generic dashboard icon grids

- use the approximate palette: ink #181818, secondary #626262, border #E4E2E1, canvas #FFFFFF, nav #FAF9F8, accent #A946A0, accent-soft #F7EAF5, project teal #168A76

- active nav and selected options should use pale pink backgrounds with purple text/icons, consistent with Focus

- primary buttons should be solid magenta-purple with white type; secondary buttons white with thin gray borders

- forms and drawers should resemble Focus project/task editors: aligned labels, clear hierarchy, compact rows, no ornamental cards

- the final week view should resemble an operational Focus screen with one clear insight added, rather than a separate analytics product

COPY STYLE

Use short, direct, helpful product language. Avoid hype, jargon and conversational filler.

Prefer:

- “Set up a client”

- “Describe the work”

- “Review setup”

- “Start tracking”

- “This week”

Avoid phrases such as “unlock insights”, “supercharge”, “seamless”, “AI-powered”, or “transform your workflow”.

The AI should remain visible through small “Suggested” labels and the analysis state; do not repeatedly advertise AI in the copy.

Treat visual resemblance, interaction completeness and cold-open clarity as equally important. A reviewer should understand within one minute that this is a focused extension of Toggl Focus for freelancer activation.

Use these screenshots only as visual and structural references. Do not copy their personal names, client names, calendar content or project data. Replace all displayed content with the fictional Northstar Studio example defined in the prompt.

Replace them consistently with fictional data:

Client: Northstar Studio

Projects: Website Redesign and Analytics Dashboard

Events: Client check-in, Design review, Project work

Rate/retainer: the fictional figures in our prompt

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://focus-first-steps.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b2421fd8-97a6-4fec-90c9-ea210c5ba612).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
