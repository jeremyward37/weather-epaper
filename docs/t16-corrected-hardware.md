# T16 corrected production hardware record

Observed 2026-10-07. [T16 card](https://app.notion.com/p/3e7d9adbacad8159a797d88686a8ee03), [PR21](https://github.com/jeremyward37/weather-epaper/pull/21), [review packet](t16-review.md). Original physical criteria remain required.

## Approval and verified upload

Jeremy said “approve corrected T16 flash” and then “done” after the physical BOOT/RESET request. Existing Terminal override applies. Reviewed documentation head847c8b1a494e3a6cc8cf0300f7977625d3a6db70 had build and firmware SUCCESS in run37701828781, read before upload. Frozen audited source3fc1e59235b4fc3b456c2b6d75aa380965899cc1, approved production1320576 bytes SHA4d9e35cfeaf3b712abc5eb2737b95fcd4c5e3d45bd077f2c8c031df977e8a648. All five source/bundle checks revalidated. Same USB303A:1001 serial2884859F0EFC / ESP32-S3v0.2 enumerated /dev/cu.usbmodem114101 and port had no other owner.

Upload23:26:35UTC used manual-ROM no-reset/hard-reset, DIO80m16MB,115200 and offsets0/8000/e000/10000. Exit0; all four written-image hashes verified. No native Wi-Fi NVS write or broad erase. [Actual flash log](../firmware/logs/t16-corrected-production-flash.txt). Agent did not substitute a rebuild or debug/harness artifact. Original [first-release hardware record](t16-hardware.md) remains historical.

## Actual corrected startup

Hard-reset after manual ROM upload initially produced no application log. Jeremy was asked for normal RESET with BOOT released and replied “Reset done—weather is visible.” Raw observer captured:

| UTC | Step | Evidence |
|---|---|---|
|23:27:23.623|Cold wake|cold-immediate; not scheduled TIMER evidence|
|23:27:23.721|ADC|raw0 /0.000V provisional; USB/no pack|
|23:27:27.827|Saved Wi-Fi|connected4103ms; no credential re-entry|
|23:27:32.170|NTP|synced4346ms|
|23:27:33.360|Verified fetch|accepted15000lowbat1188ms|
|23:27:38.060|Display|changed-refreshed-hibernated-sha-saved4694ms|
|23:27:38.117|Sleep|122seconds, target1791415800 (17:30MDT), debug_interval0|
|23:27:38.173|USB|disappeared during deep sleep|

[Startup snapshot](../firmware/logs/t16-corrected-startup-runtime.txt) is a bounded excerpt, not the final one-hour trace. This proves the correction's successful active completion and SHA save on actual hardware; no false BUSY-after-hibernate error in the observed cycle. Jeremy reports weather visible. Whole-panel visual fidelity/index comparison subsequently passed with IMG_2844.JPG and independent visual QA; see the photo record below. This does not claim photographed pixel equality.

## Host reference

Verified HTTPS read at23:25:56UTC; all published hashes match metadata, both raw frames exactly15000 bytes. Both bin/PNG comparisons using tools/framediff.py with the image venv returned0 differing pixels. Host footer10/7 5:05PM, renderedAt23:05:58.240Z; original11:49AM snapshot is historical. Lowbat binSHA4c99fa46b9692bb30fc00f1686deda7b27e65f845ebb0aae3547e3be899d3d33, PNGSHAdf9ad98c06dd2a030654b00fb34e7ddab69cda5cb1f1c025f038a0a84755ba6f. [Host verification](../firmware/logs/t16-corrected-host-verification.json). No hosting change occurred. T21 reliability disposition remains separate.

## Remaining test and capture state

A90-minute same-board raw observer started17:26:49MDT with a planned18:56:49 end. Evening reconciliation at21:04–21:07 found session54253 unavailable and no matching process. The saved trace ends18:00:01.699MDT without a completion record; termination cause is unknown. Jeremy left the device connected but does not know whether the Mac slept. The partial trace is preserved in firmware/logs/t16-corrected-evening-runtime.txt. No DTR/RTS ioctl; HUPCL disabled, with host reset limitations preserved. Actual TIMER reasons are required for scheduled-wake evidence; USB resets are not TIMER evidence.

Brief BOOT from sleep observed23:28:19.067UTC, actual BOOT-immediate; saved Wi-Fi1836ms/NTP686ms/accepted15000lowbat1179ms; display1ms `identical-no-redraw`, followed by78s sleep to the same17:30 target. Jeremy answered “Yes—screen stayed unchanged without flashing.” Actual trace plus human observation establishes a successful unchanged frame suppression check and brief BOOT immediate wake. USER and long BOOT-clear checks remain pending. Production scheduled span at least one hour (nominal17:30/18:00/18:30 slots), scheduled unavailable-Wi-Fi and recovery, USER/long-clear and final independent hardware reconciliation remain Pending. Runtime wake begins20 seconds ahead of the nominal target by the reviewed lead schedule; compare the fetch/target time too. Jeremy said the proposed5:58–6:02PM Wi-Fi-loss window would disrupt others and requested testing later. That physical criterion remains pending, not waived; no router change occurred. No suitable current meter is available; that allowed reason remains recorded. No actual current, calibrated threshold or battery life claim. No T16 acceptance, merge, T17 or T24 start.

## First corrected production TIMER slot

Actual23:29:41.048UTC wake reports `outcome=timer`, consistent with the approximately20-second planned lead before nominal17:30MDT. Saved join1849ms/NTP1741ms; fetch23:30:01.230UTC accepted15000lowbat1197ms; display1ms `identical-no-redraw`, then sleep1779seconds to target1791417600 (18:00MDT), debug_interval0, USB disappears. This is one real corrected scheduled cycle; at least one hour of production slots is still pending. The saved trace later includes the18:00 slot, but no18:30 record. The observer is no longer running; see evening reconciliation below.

## Whole-panel visual fidelity photo

Jeremy supplied IMG_2844.JPG in this chat for the requested comparison. Original local file `/Users/jeremyward/Downloads/IMG_2844.JPG`, SHAe3cfabfc8e0e4effc0586613a0b07ada4098442657f18758e8df68b6685cd7f0. The photo itself remains local; this record does not publish its surrounding desk/background. Saved low-battery reference PNGSHAdf9ad98c06dd2a030654b00fb34e7ddab69cda5cb1f1c025f038a0a84755ba6f, rawSHA4c99fa46b9692bb30fc00f1686deda7b27e65f845ebb0aae3547e3be899d3d33.

Root and [independent visual QA](t16-photo-qa.md) both Pass the observed physical fidelity case:81° sunny, LAST LIGHT7:29PM; hourly6PM81°/9PM67°/12AM62°1%/3AM59° and icons; Thu82°/54°1%,Fri82°/58°1%,Sat78°/51°43% and icons; footer10/7 5:05PM with refresh/battery/logo. Divider/rule locations, margins, upright/unmirrored orientation, dark-on-light polarity and visible placement agree. Full display content is present with no visible crop or shift. Current HI/LO follows the existing baseline; the user-requested LO/HI swap remains deferred to T24.

The USB/no-pack provisional ADC rule selects lowbat; the footer glyph is expected and is not a battery state-of-charge claim. Current saved lowbat versus normal raw comparison gives100 differing pixels in bounding box136,281,14,10, confined to that footer glyph. Exit1 is expected for this intentional state difference; both raw/PNG equality comparisons remain0 pixels.

Photo perspective/lighting/focus and conversation resizing prevent photographed pixel-equality or quantitative contrast measurements. The separate byte/pixel checks apply to the saved served frames. Visual photo Pass does not pass the combined full-hour/offline criterion or final acceptance. Two corrected TIMER slots are saved (17:30/18:00); no18:30 or full-hour completion record. The observer is no longer running. Wi-Fi-loss/recovery, remaining button checks, final reconciliation and acceptance/authorized merge remain pending.

## Evening reconciliation — 2026-10-07 21:07 MDT

Second actual TIMER wake23:59:24.159UTC (17:59:24MDT): saved join1844ms/NTP2441ms; accepted15000lowbat fetch00:00:01.555UTC (18:00:01MDT),1488ms; display1ms identical-no-redraw; sleep1779seconds to target1791419400 (18:30MDT), debug_interval0. The earlier planned lead and actual wake differ, while the fetch remains aligned with the nominal18:00 slot. No third-cycle inference is made. Partial log SHA3e795a95dc1609521b2692b865c10e2da3ed83103669d9662d47ff198a54c913.

IMG_2846.JPG original SHA37d97937f8e93b3f4c2fb947a2ed93ccf4281c11cb9c22e214ccb834d435de2b, retained locally. Visible frame70°/night icon, FIRST LIGHT7:05AM, hourly9PM67°/12AM62°1%/3AM59°/6AM56°1%, dailyThu82°/54°1% Fri82°/58°1% Sat78°/51°43%, footer10/7 8:42PM. This supports a later visible change; no contemporaneous saved8:42 reference or runtime wake cause is available. Prior first-photo fidelity Pass remains valid; no new exact photo/frame match or full-hour pass is claimed.

Jeremy: “I left it connected but I had to leave so I don't know if it went sleep or not.” Mac sleep is a possible explanation for the incomplete host log, not an established cause. The board can continue from USB independently of host logging. No observer is currently running. Resume with a daytime70+minute capture positioned to cover three consecutive :00/:30 production slots and the Mac kept awake; preserve real TIMER reasons and fetch targets. Deferred offline/recovery, USER/longclear, final independent reconciliation and Jeremy acceptance/authorized merge remain pending. No source, artifact, flash or hosting change.

Independent evening review: [t16-evening-qa.md](t16-evening-qa.md). Narrow second TIMER/fetch/no-redraw Pass; wake was approximately36seconds early rather than the configured20-second lead, with the fetch starting approximately18:00:00.067MDT. Cause remains unresolved; preserve and reconcile wake/fetch times in the next capture. Select the daytime70-minute window five minutes before its first chosen slot through five minutes after its third, rather than an arbitrary70-minute interval.
