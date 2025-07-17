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
- Attempted `vercel --prod` deploy but hit the daily deployment limit.

## Iteration 7
- Replaced the unused reviewer roles card with a follow-up queue driven by the feedback database.
- Added a follow-up API endpoint to return contact-approved submissions with emails.
- Fixed the recent feedback API response shape and hardened the client to accept legacy payloads.
- Extended pulse styles to support the new follow-up list layout.

## Iteration 15
- Added a reviewer roles breakdown to the feedback pulse dashboard.
- Extended the summary API to aggregate role counts alongside stages and focus.
- Wired the new roles list into the pulse UI.

## Iteration 16
- Deduplicated hotspot rendering/loading logic to avoid double fetches and repeated UI handlers.
- Restored a single pair of hotspot DOM bindings after cleanup.

## Iteration 16
- Fixed hotspot pulse wiring by defining the missing DOM hooks for the hotspot list and status elements.

## Iteration 17
- Added a calibration action board with a submission form, summary metrics, and prioritized action list.
- Built new Postgres-backed API endpoints for calibration actions plus status/priority summaries.
- Seeded production with realistic calibration action items and refreshed styling for the new section.
- Fixed duplicate pulse element bindings in the client script.

## Iteration 103
- Added a calibration drift watch card with a variance log form, metrics, and recent signals list.
- Built Postgres-backed drift endpoints (create, summary, recent) with validation and safety caps.
- Seeded production with starter drift signals and wired the client to render the new dashboard.
- Attempted `vercel --prod` but hit the daily deployment limit.

## Iteration 104
- Consolidated drift tracking to a single rubric drift tracker section to remove duplicate forms/IDs.
- Simplified client logic to use the rubric drift log endpoints only and removed duplicate loaders.
- Deleted deprecated calibration drift endpoints to prevent conflicting data paths.

## Iteration 105
- Removed duplicate reviewer load fetchers so the ledger consistently uses the reviewer-load endpoints.
- Cleaned up duplicate capacity loader calls to avoid double refreshes on page load.

## Iteration 106
- Added reviewer load alerts powered by a new API endpoint to flag overload risk from recent check-ins.
- Updated the reviewer load ledger UI with a load alerts card and alert-level tags.
- Wired client-side fetch/render logic to keep the alerts list synced after submissions.

## Iteration 135
- Added a stage hotspot card to the reviewer load ledger to highlight where check-ins cluster.
- Built a new reviewer-load-stages API endpoint that aggregates load metrics by stage.
- Wired the new stage coverage list into the capacity dashboard and refresh flow.

## Iteration 138
- Added a reviewer load trendline card with 14-day check-in totals, average hours, and peak day tracking.
- Built a reviewer-load-trends API endpoint to aggregate daily load counts and average hours.
- Wired capacity trend loading into the dashboard refresh flow and check-in submission path.
