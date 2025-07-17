# Group Scholar Rubric Kit

A static microsite for building fair, fast, and human admissions rubrics.

## Quick start

Open `index.html` in a browser.

## Feedback capture

The feedback form posts to `/api/feedback` and stores submissions in Postgres.
Set `DATABASE_URL` in the deployment environment before enabling the form.
If your database requires SSL, set `DATABASE_SSL=true`.

## Pulse dashboard

`/api/feedback-summary` powers the totals and distribution cards.
`/api/feedback-recent` returns the five most recent notes with anonymized labels.
`/api/feedback-followup` returns the follow-up queue.
`/api/feedback-trends` powers the 14-day trendline.
`/api/feedback-hotspots` highlights the most frequent stage + focus pairings.

## Reviewer load ledger

`/api/reviewer-load` stores reviewer workload check-ins.
`/api/reviewer-load-summary` powers the capacity summary and risk mix.
`/api/reviewer-load-recent` returns the five latest load check-ins.
Seed load data with `node scripts/seed-reviewer-load.js`.

## Calibration action board

`/api/calibration-action` stores action items from the calibration board.
`/api/calibration-actions` returns the latest prioritized actions.
`/api/calibration-action-summary` provides status + priority mixes and due-soon counts.
Seed actions with `node scripts/seed-calibration-actions.js`.

## Rubric change backlog

`/api/rubric-change` stores rubric change requests.
`/api/rubric-change-summary` provides totals plus status/impact/area mixes.
`/api/rubric-change-recent` returns the latest change requests.
Seed changes with `node scripts/seed-rubric-changes.js`.

## Rubric drift tracker

`/api/drift-log` stores drift signals from calibration sessions.
`/api/drift-summary` aggregates severity, stage, and action-needed counts.
`/api/drift-recent` returns the latest drift signals.
Seed drift signals with `node scripts/seed-drift-log.js`.

## Reviewer capacity ledger

`/api/capacity` stores reviewer load check-ins.
`/api/capacity-summary` returns averages and risk mix totals.
`/api/capacity-recent` returns the latest check-ins.
Seed capacity check-ins with `node scripts/seed-capacity.js`.
