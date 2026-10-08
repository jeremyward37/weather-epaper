# T16 resumed evening evidence — independent QA

Reviewed 2026-10-07 at approximately 21:07 MDT. Read-only review of managed PR #21 documentation/source, actual scratch runtime log and Jeremy's new photo. No flash, serial attachment, source changes, software test reruns, Git or Notion writes performed.

## Evidence identities

- Runtime: `/private/tmp/weather-epaper-t16-corrected-production-runtime.txt`, SHA256 `3e795a95dc1609521b2692b865c10e2da3ed83103669d9662d47ff198a54c913` at review. Last line is `2026-10-08T00:00:01.699+00:00` (2026-10-07 18:00:01.699 MDT).
- Photo: `/Users/jeremyward/Downloads/IMG_2846.JPG`, SHA256 `37d97937f8e93b3f4c2fb947a2ed93ccf4281c11cb9c22e214ccb834d435de2b`. Original remains local; image was inspected through view_image.
- Jeremy reports leaving the device connected but does not know whether the Mac slept. Root reports exec session54253 no longer known and no matching observer process. These establish that the old observation is not currently active; they do not establish why capture stopped.

## Second production slot: partial Pass

The same-board log records actual `outcome=timer` at23:59:24.159UTC (17:59:24.159MDT), saved Wi-Fi join1844ms, fresh NTP2441ms, verified `accepted-15000-lowbat` at00:00:01.555UTC (18:00:01.555MDT), and `identical-no-redraw` at00:00:01.562UTC. The accepted fetch duration1488ms places fetch initiation approximately18:00:00.067MDT, consistent with waiting until the nominal18:00 slot. Sleep then logs1779seconds, next target1791419400 (18:30MDT), debug_interval0, followed by USB disconnection.

Thus two corrected production TIMER slots (17:30 and18:00) are actually captured, with successful verified fetches, unchanged-frame suppression and sleep scheduling. The second wake occurs approximately36seconds before the nominal target rather than exactly the configured20-second lead. Do not describe this wake as an exact20-second physical timing match or infer its cause. The application retained the selected target and completed its fetch at the nominal slot; firmware permits early-target retention through this interval. A longer capture should preserve actual wake and fetch times and reconcile this timing difference.

No18:30 wake/cycle appears. The two nominal slots span30minutes; even including the cold startup the trace spans approximately33minutes. **The required production observation of at least one hour remains Pending.** Previous brief BOOT/no-redraw and IMG_2844 reference-fidelity passes remain valid within their original limits.

## Evening photo: useful but limited evidence

Visible content:70° with night/moon icon; FIRST LIGHT7:05AM; hourly9PM67° partly cloudy,12AM62° rain1%,3AM59° partly cloudy,6AM56° rain1%; Thu82°/54°1%,Fri82°/58°1%,Sat78°/51°43%; footer10/7 8:42PM with refresh, battery and logo. Full visible content is upright, dark on light, and shows no obvious crop or shift.

Relative to the earlier81°/5:05PM photograph, this is a changed later weather frame, supporting that a later display update occurred. The footer is a frame-render timestamp, not a device wake timestamp. This photograph alone cannot prove the wake cause, exact refresh time, uninterrupted operation, all scheduled slots, or why host capture stopped. No matching8:42PM served raw/PNG snapshot was supplied for this review, so **no exact contemporaneous reference-fidelity or photographed pixel-equality claim** is made. HI/LO still follows the current baseline; requested LO/HI remains queuedT24. The glyph does not demonstrate battery presence, charge, calibrated threshold or sleep current.

## Remaining criteria and next evidence

- Complete a continuous production capture spanning at least one hour with three consecutive half-hour slots and actual TIMER causes, nominal fetch times, verified frames and sleep outcomes. A fresh daytime70-minute window is appropriate **when started five minutes before the first chosen slot and ended five minutes after the third**, entirely inside the5AM–10PM schedule. An arbitrary70-minute window can contain only two slots, so choose slot-relative start/end times. Keep the Mac awake and USB connected for capture; preserve the approved production artifact and debug_interval0. No new flash is inherently required.
- Inspect/reconcile the second-slot early wake difference in that fresh trace; target fetch timing and planned next targets are the relevant outcomes.
- Scheduled Wi-Fi-loss panel retention and recovery remain physically untested/deferred, not waived. Do not disrupt shared Wi-Fi without a suitable agreed test arrangement.
- USER non-wake and five-second BOOT credential-clear/reprovision physical checks remain pending in the corrected T16 packet.
- No suitable current meter is the documented allowed measurement limitation; no measured sleep-current or battery-life claim.
- Final independent reconciliation, Jeremy's T16 acceptance and authorized merge after green latest-head CI remain required. No T17/T24 start is inferred.

Conclusion: second TIMER/fetch/no-redraw slot earns a narrow partial Pass; latest photo establishes visible later frame progression. Full-hour hardware acceptance remains Pending because the serial record stops at18:00 and the reason is unknown. No source defect or capture-cause diagnosis is asserted from the available evidence.
