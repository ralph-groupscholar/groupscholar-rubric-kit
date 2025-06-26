# Group Scholar Rubric Kit

A static microsite for building fair, fast, and human admissions rubrics.

## Quick start

Open `index.html` in a browser.

## Feedback capture

The feedback form posts to `/api/feedback` and stores submissions in Postgres.
Set `DATABASE_URL` in the deployment environment before enabling the form.

## Pulse dashboard

`/api/feedback-summary` powers the totals and distribution cards.
`/api/feedback-recent` returns the five most recent notes with anonymized labels.
