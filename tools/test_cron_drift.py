import importlib.util
import unittest
from datetime import date, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location('cron_drift', Path(__file__).with_name('cron-drift.py'))
cron = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cron)


def run(run_id, created, deployed=None, event='schedule', noop=False):
    jobs = [{'name': 'render', 'conclusion': 'success', 'steps': [
        {'name': 'Render complete publish bundle', 'conclusion': 'skipped' if noop else 'success'}]}]
    if deployed:
        jobs.append({'name': 'deploy', 'conclusion': 'success', 'completed_at': deployed,
                     'steps': [{'name': 'Deploy to GitHub Pages', 'conclusion': 'success', 'completed_at': deployed}]})
    return {'id': run_id, 'created_at': created, 'event': event, 'conclusion': 'success',
            'job_evidence_available': True, 'jobs': jobs}


class MeasurementTest(unittest.TestCase):
    zone = ZoneInfo('America/Denver')
    day = date(2026, 10, 2)

    def test_missing_slots_are_counted_in_denominator(self):
        summary, rows = cron.analyze([], self.day, self.day, self.zone)
        self.assertEqual(summary['expected_slots'], 35)
        self.assertEqual(summary['empty_arrival_buckets'], 35)
        self.assertEqual(summary['scheduled_run_count_deficit'], 35)
        self.assertEqual(summary['wakes_with_new_any_deployment'], 0)
        self.assertIsNone(rows[0]['deployment_age_at_wake_minutes'])

    def test_noop_and_multiple_arrivals_do_not_create_wake_coverage(self):
        runs = [run(1, '2026-10-02T01:00:00-06:00', noop=True),
                run(2, '2026-10-02T05:18:00-06:00', noop=True),
                run(3, '2026-10-02T05:19:00-06:00', noop=True)]
        summary, rows = cron.analyze(runs, self.day, self.day, self.zone)
        self.assertEqual(summary['scheduled_outcomes'], {'successful_noop': 3})
        self.assertEqual(summary['occupied_arrival_buckets'], 1)
        self.assertEqual(summary['multiple_arrival_buckets'], 1)
        self.assertEqual(summary['scheduled_arrivals_outside_buckets'], 1)
        self.assertEqual(summary['empty_arrival_buckets'], 34)
        self.assertEqual(summary['wakes_with_new_any_deployment'], 0)

    def test_publication_deadline_and_manual_are_distinct(self):
        runs = [run(1, '2026-10-02T04:47:00-06:00', '2026-10-02T05:00:00-06:00'),
                run(2, '2026-10-02T05:17:00-06:00', '2026-10-02T05:30:01-06:00'),
                run(3, '2026-10-02T06:15:00-06:00', '2026-10-02T06:20:00-06:00', 'workflow_dispatch')]
        summary, rows = cron.analyze(runs, self.day, self.day, self.zone)
        self.assertTrue(rows[0]['new_scheduled_deployment_before_wake'])
        self.assertFalse(rows[1]['new_scheduled_deployment_before_wake'])
        self.assertTrue(rows[2]['new_scheduled_deployment_before_wake'])
        self.assertFalse(rows[3]['new_scheduled_deployment_before_wake'])
        self.assertTrue(rows[3]['new_any_deployment_before_wake'])
        self.assertEqual(summary['scheduled_runs'], 2)
        self.assertEqual(summary['manual_runs'], 1)
        self.assertEqual(summary['wakes_with_new_scheduled_deployment'], 2)
        self.assertEqual(summary['wakes_with_new_any_deployment'], 3)
        self.assertEqual(summary['creation_to_deploy_minutes']['count_over_13_minutes'], 1)

    def test_latest_publication_carries_across_midnight_without_fresh_coverage(self):
        runs = [run(1, '2026-10-01T21:47:00-06:00', '2026-10-01T21:48:00-06:00')]
        _, rows = cron.analyze(runs, self.day, self.day, self.zone)
        self.assertEqual(rows[0]['latest_deployment_id'], 1)
        self.assertEqual(rows[0]['deployment_age_at_wake_minutes'], 432)
        self.assertFalse(rows[0]['new_any_deployment_before_wake'])

    def test_timezone_day_selection_and_dst(self):
        # 05:59 UTC belongs to previous local date; 06:00 UTC belongs to Oct 2.
        summary, _ = cron.analyze([run(1, '2026-10-02T05:59:59Z', noop=True),
                                  run(2, '2026-10-02T06:00:00Z', noop=True)],
                                 self.day, self.day, self.zone)
        self.assertEqual(summary['week_run_count'], 1)
        for first, second, gap in [(date(2026, 3, 7), date(2026, 3, 8), 23),
                                   (date(2026, 10, 31), date(2026, 11, 1), 25)]:
            slots = cron.expected_slots(first, second, self.zone)
            self.assertEqual(len(slots), 70)
            self.assertEqual(slots[35] - slots[0], timedelta(hours=gap))
            self.assertEqual(slots[0].astimezone(self.zone).hour, 4)
            self.assertEqual(slots[35].astimezone(self.zone).hour, 4)

    def test_missing_job_details_are_unknown_and_evidence_is_sanitized(self):
        clean = cron.sanitize([{'id': 1, 'event': 'schedule', 'created_at': '2026-10-02T12:00:00Z',
                              'conclusion': 'success', 'actor': {'email': 'sensitive'}}], {})
        self.assertEqual(cron.outcome(clean[0]), 'unknown_jobs')
        self.assertNotIn('actor', clean[0])
        self.assertEqual(cron.outcome(cron.sanitize(clean, {})[0]), 'unknown_jobs')

    def test_duplicate_page_records_are_rejected(self):
        duplicate = {'id': 1, 'created_at': '2026-10-02T12:00:00Z'}
        with self.assertRaisesRegex(ValueError, 'duplicate run IDs'):
            cron.flatten_runs({'runs': [duplicate, duplicate]})


if __name__ == '__main__':
    unittest.main()
