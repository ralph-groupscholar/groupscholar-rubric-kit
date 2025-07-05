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

## Calibration action board

`/api/calibration-action` stores action items from the calibration board.
`/api/calibration-actions` returns the latest prioritized actions.
`/api/calibration-action-summary` provides status + priority mixes and due-soon counts.
Seed actions with `node scripts/seed-calibration-actions.js`.
