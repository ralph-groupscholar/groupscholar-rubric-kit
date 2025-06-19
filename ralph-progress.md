# Group Scholar Rubric Kit Progress

## Iteration 1
- Created a rubric kit microsite with sections for modules, workflow, and signal library.
- Designed a bold visual system (Fraunces + Space Grotesk, warm gradients, tactile cards).
- Added clear CTAs and a rubric snapshot card to convey the tool quickly.
- Deployed to https://groupscholar-rubric-kit.vercel.app.

## Iteration 2
- Added a template pack section with downloadable artifacts and a facilitator checklist.
- Linked the new templates area from navigation and hero CTAs.
- Expanded styling for template cards and checklist panel.
- Redeployed to https://groupscholar-rubric-kit.vercel.app.

## Iteration 3
- Added a calibration studio section with a facilitated agenda and anchor scoring guide.
- Introduced new layout styling for calibration cards and consensus mapping.
- Redeployed to https://groupscholar-rubric-kit.vercel.app.

## Iteration 4
- Added a feedback loop section with a reviewer pulse form and rubric health prompts.
- Wired a serverless API endpoint to persist feedback to Postgres with a dedicated table.
- Added client-side submission handling and refreshed layout styling.

## Iteration 4
- Wired the feedback form to a Vercel serverless endpoint backed by Postgres.
- Added payload validation, safe length caps, and table auto-creation for rubric feedback.
- Documented database setup needs for deployment.
- Redeployed to https://groupscholar-rubric-kit.vercel.app.
- Redeployed to https://groupscholar-rubric-kit.vercel.app.

## Iteration 5
- Added a feedback pulse dashboard with live totals, stage distribution, and focus-area counts.
- Built a feedback summary API endpoint to read aggregated metrics from Postgres.
- Wired client-side rendering and styling for the new pulse section.
- Redeployed to https://groupscholar-rubric-kit.vercel.app.

## Iteration 6
- Added a recent feedback API endpoint to surface the latest reviewer notes.
- Wired the pulse dashboard to render recent notes with tags and timestamps.
- Added client-side rendering helpers to format and truncate recent feedback.

## Iteration 6
- Added a recent notes panel to the feedback pulse dashboard for quick review context.
- Built a feedback-recent API endpoint to return the latest five submissions with anonymized labels.
- Improved client-side rendering to avoid HTML injection and show role/stage/focus tags.
