#!/usr/bin/env python3
"""Measure publisher arrivals and deployments; never infer original cron slot.

Offline input: `gh api --paginate --slurp .../actions/workflows/publish.yml/runs`
plus a JSON object mapping run IDs to job arrays from .../runs/{id}/jobs.
No network calls or credentials are used by this tool.
"""
import argparse
import csv
import json
from collections import Counter
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

UTC = timezone.utc
RUN_FIELDS = ('id', 'event', 'status', 'conclusion', 'created_at', 'run_started_at',
              'updated_at', 'head_sha', 'html_url', 'run_attempt')
JOB_FIELDS = ('id', 'name', 'status', 'conclusion', 'started_at', 'completed_at')
STEP_NAMES = {'Check local publish window', 'Render complete publish bundle',
              'Upload Pages artifact', 'Deploy to GitHub Pages'}


def instant(value):
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('timestamps must have UTC offset')
    return result.astimezone(UTC)


def flatten_runs(payload):
    if isinstance(payload, dict):
        payload = payload.get('workflow_runs', payload.get('runs', []))
    if payload and isinstance(payload[0], dict) and 'workflow_runs' in payload[0]:
        runs = [run for page in payload for run in page['workflow_runs']]
    else:
        runs = payload
    if len({run['id'] for run in runs}) != len(runs):
        raise ValueError('duplicate run IDs: supply complete, non-overlapping pages')
    return runs


def sanitize(runs, jobs):
    result = []
    for run in sorted(runs, key=lambda r: r['created_at']):
        item = {field: run[field] for field in RUN_FIELDS if field in run}
        source_jobs = jobs.get(str(run['id']), run.get('jobs', []))
        item['job_evidence_available'] = str(run['id']) in jobs or run.get('job_evidence_available', 'jobs' in run)
        item['jobs'] = []
        for job in source_jobs:
            clean = {field: job[field] for field in JOB_FIELDS if field in job}
            clean['steps'] = [{field: step[field] for field in JOB_FIELDS if field in step}
                              for step in job.get('steps', []) if step['name'] in STEP_NAMES]
            item['jobs'].append(clean)
        result.append(item)
    return result


def publication(run):
    """Successful Pages step completion, falling back conservatively to job end."""
    for job in run.get('jobs', []):
        if job['name'] != 'deploy' or job.get('conclusion') != 'success':
            continue
        for step in job.get('steps', []):
            if step['name'] == 'Deploy to GitHub Pages' and step.get('conclusion') == 'success':
                if step.get('completed_at'):
                    return instant(step['completed_at'])
        if job.get('completed_at'):
            return instant(job['completed_at'])
    return None


def outcome(run):
    if publication(run):
        return 'deployment_success'
    if not run.get('job_evidence_available', 'jobs' in run):
        return 'unknown_jobs'
    skipped_render = any(step['name'] == 'Render complete publish bundle'
                         and step.get('conclusion') == 'skipped'
                         for job in run.get('jobs', []) for step in job.get('steps', []))
    if run.get('conclusion') == 'success' and skipped_render:
        return 'successful_noop'
    return 'no_successful_deployment'


def expected_slots(start, end, zone):
    """Construct local wall-clock instants each day, then convert to UTC.

    Slots start after the DST transition hours in America/Denver; UTC conversion
    still matters for the 23/25-hour transition days and winter offsets.
    """
    slots = []
    day = start
    while day <= end:
        minutes = [4 * 60 + 47] + [hour * 60 + minute for hour in range(5, 22) for minute in (17, 47)]
        for minute in minutes:
            local = datetime.combine(day, time(minute // 60, minute % 60), zone)
            slots.append(local.astimezone(UTC))
        day += timedelta(days=1)
    return slots


def percentile(values, proportion):
    if not values:
        return None
    ordered = sorted(values)
    # Nearest-rank percentile, including all gaps rather than per-run success rate.
    import math
    return ordered[max(0, math.ceil(proportion * len(ordered)) - 1)]


def analyze(runs, start, end, zone):
    slots = expected_slots(start, end, zone)
    beginning = datetime.combine(start, time(), zone).astimezone(UTC)
    ending = datetime.combine(end + timedelta(days=1), time(), zone).astimezone(UTC)
    selected = [run for run in runs if beginning <= instant(run['created_at']) < ending]
    scheduled = [run for run in selected if run['event'] == 'schedule']
    manual = [run for run in selected if run['event'] == 'workflow_dispatch']
    publications = sorted([(publication(run), run) for run in runs if publication(run)], key=lambda p: p[0])
    week_publications = [(at, run) for at, run in publications if beginning <= at < ending]
    rows = []
    for slot in slots:
        # Arrival buckets measure observation, not trigger lateness. A long-delayed
        # run can land in another slot's bucket, and multiple runs can share one.
        arrivals = [run for run in scheduled if slot <= instant(run['created_at']) < slot + timedelta(minutes=30)]
        wake = slot + timedelta(minutes=13)
        previous_wake = wake - timedelta(minutes=30)
        delivered = [(at, run) for at, run in publications if previous_wake < at <= wake]
        delivered_scheduled = [(at, run) for at, run in delivered if run['event'] == 'schedule']
        latest = [(at, run) for at, run in publications if at <= wake]
        newest = latest[-1] if latest else None
        rows.append({
            'expected_local': slot.astimezone(zone).isoformat(),
            'expected_utc': slot.isoformat(),
            'wake_local': wake.astimezone(zone).isoformat(),
            'scheduled_arrival_count': len(arrivals),
            'scheduled_arrival_ids': ';'.join(str(run['id']) for run in arrivals),
            'new_scheduled_deployment_before_wake': bool(delivered_scheduled),
            'new_any_deployment_before_wake': bool(delivered),
            'deployment_ids_before_wake': ';'.join(str(run['id']) for _, run in delivered),
            'latest_deployment_id': newest[1]['id'] if newest else '',
            'deployment_age_at_wake_minutes': round((wake - newest[0]).total_seconds() / 60, 3) if newest else None,
        })
    buckets = sum(row['scheduled_arrival_count'] > 0 for row in rows)
    arrivals_in_buckets = sum(row['scheduled_arrival_count'] for row in rows)
    publication_gaps = [(later[0] - earlier[0]).total_seconds() / 60
                        for earlier, later in zip(week_publications, week_publications[1:])]
    creation_gaps = [(instant(later['created_at']) - instant(earlier['created_at'])).total_seconds() / 60
                     for earlier, later in zip(sorted(scheduled, key=lambda r: r['created_at']),
                                               sorted(scheduled, key=lambda r: r['created_at'])[1:])]
    durations = [(at - instant(run['created_at'])).total_seconds() / 60 for at, run in week_publications]
    days = []
    for offset in range((end - start).days + 1):
        day = start + timedelta(days=offset)
        day_runs = [run for run in selected if instant(run['created_at']).astimezone(zone).date() == day]
        day_rows = [row for row in rows if row['expected_local'].startswith(str(day))]
        counts = Counter(outcome(run) for run in day_runs if run['event'] == 'schedule')
        days.append({'date': str(day), 'expected_slots': len(day_rows),
                     'scheduled_runs': sum(run['event'] == 'schedule' for run in day_runs),
                     'manual_runs': sum(run['event'] == 'workflow_dispatch' for run in day_runs),
                     'scheduled_outcomes': dict(counts),
                     'empty_arrival_buckets': sum(row['scheduled_arrival_count'] == 0 for row in day_rows),
                     'wakes_without_new_scheduled_deployment': sum(not row['new_scheduled_deployment_before_wake'] for row in day_rows),
                     'wakes_without_new_any_deployment': sum(not row['new_any_deployment_before_wake'] for row in day_rows)})
    summary = {
        'period': {'start_local_date': str(start), 'end_local_date': str(end), 'timezone': str(zone)},
        'source_run_count': len(runs), 'week_run_count': len(selected),
        'expected_slots': len(slots), 'scheduled_runs': len(scheduled), 'manual_runs': len(manual),
        'scheduled_run_count_deficit': len(slots) - len(scheduled),
        'scheduled_outcomes': dict(Counter(outcome(run) for run in scheduled)),
        'manual_outcomes': dict(Counter(outcome(run) for run in manual)),
        'occupied_arrival_buckets': buckets, 'empty_arrival_buckets': len(slots) - buckets,
        'multiple_arrival_buckets': sum(row['scheduled_arrival_count'] > 1 for row in rows),
        'scheduled_arrivals_outside_buckets': len(scheduled) - arrivals_in_buckets,
        'wakes_with_new_scheduled_deployment': sum(row['new_scheduled_deployment_before_wake'] for row in rows),
        'wakes_with_new_any_deployment': sum(row['new_any_deployment_before_wake'] for row in rows),
        'week_successful_deployments': len(week_publications),
        'publication_gap_minutes': {'count': len(publication_gaps), 'max': max(publication_gaps, default=None), 'p95': percentile(publication_gaps, .95)},
        'scheduled_arrival_gap_minutes': {'count': len(creation_gaps), 'max': max(creation_gaps, default=None), 'p95': percentile(creation_gaps, .95)},
        'creation_to_deploy_minutes': {'count': len(durations), 'max': max(durations, default=None), 'p95': percentile(durations, .95), 'count_over_13_minutes': sum(duration > 13 for duration in durations)},
        'max_deployment_age_at_wake_minutes': max((r['deployment_age_at_wake_minutes'] for r in rows if r['deployment_age_at_wake_minutes'] is not None), default=None),
        'daily': days,
        'limitations': [
            'GitHub created_at does not identify the intended cron slot. Empty arrival buckets are missing observations, not proof that a particular trigger was dropped; true trigger lateness is unmeasurable here.',
            'The count deficit compares all schedule-event runs created during the week with intended slots. It cannot distinguish dropped, coalesced, disabled, or out-of-period delayed triggers.',
            'Publication time is successful Pages deploy-step completion (job completion fallback). It does not prove CDN visibility, framebuffer weather freshness, or a physical device download.',
            'Before-wake delivery means a deployment completed after the previous half-hour wake and by the current wake. First daily wake uses 04:30 as the lower bound. Manual publications are counted separately and only included in any-deployment coverage.',
            'Gap percentiles include overnight gaps and only successive deployments/arrivals within the selected period; wake coverage separately measures the approved daytime schedule.',
            'All timestamps are offset-aware and expected schedule is generated in the chosen local timezone. Source history must include the latest deployment before the week to calculate initial age.',
        ],
    }
    return summary, rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runs', required=True, type=Path)
    parser.add_argument('--jobs', type=Path)
    parser.add_argument('--start', required=True, type=date.fromisoformat)
    parser.add_argument('--end', required=True, type=date.fromisoformat)
    parser.add_argument('--timezone', default='America/Denver')
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    if args.end < args.start:
        parser.error('--end must be on or after --start')
    runs = flatten_runs(json.loads(args.runs.read_text()))
    jobs = json.loads(args.jobs.read_text()) if args.jobs else {}
    clean = sanitize(runs, jobs)
    summary, rows = analyze(clean, args.start, args.end, ZoneInfo(args.timezone))
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / 'runs.json').write_text(json.dumps({'runs': clean}, separators=(',', ':')) + '\n')
    (args.out / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    with (args.out / 'slots.csv').open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
