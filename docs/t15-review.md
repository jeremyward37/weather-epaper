# T15 review packet — Wi-Fi provisioning

Task: [T15](https://app.notion.com/p/3e7d9adbacad812f82cedeb47e813b0b). Branch: `codex/t15-wifi-provisioning`, based on accepted/merged T14 `08be1ac`. PR/source revision and frozen hashes will be recorded after independent QA. Status **In progress; software preparation underway; all T15 physical checks Pending**. T14 was accepted by Jeremy and PR #19 merged; that approval authorizes T15 preparation, not its new firmware release.

## Behavior

The approved setup bitmap is drawn on provisioning entry. A password-protected `WeatherStation-Setup` hotspot serves the Wi-Fi-only captive portal at `192.168.4.1`; the public setup password is `firstlight`. Saved credentials reconnect on the next boot without a panel redraw. Setup remains visible until T16 downloads a frame. Runtime BOOT short release invokes a logged T16 refresh hook; a five-second hold clears credentials and returns to setup. USER is unused. Holding BOOT during physical reset enters the ROM downloader instead.

Credentials remain in native Wi-Fi NVS. Preferences stores provisioning/frame metadata and reset intent; home identifiers/passwords are not logged. The approved frames, server, fetch behavior and refresh schedule are unchanged. The normal firmware stays awake on USB. A separate bounded persistence harness enters one ten-second timer sleep after a thirty-second grace period, then verifies saved reconnect without entering setup; it is a distinct artifact, not the T16 schedule.

## Acceptance and QA

| Criterion | Evidence | Result |
|---|---|---|
| Pinned WiFiManager and required API/hotspot/portal | Source review and build; actual phone reachability still required | Software QA pending; physical Pending |
| BOOT reset and short refresh hook, USER unused | Production-controller tests; actual runtime check required | Software QA pending; physical Pending |
| Setup only on provisioning entry; frame identity slot | Source/native checks; setup header must remain byte-identical | Software QA pending |
| Credentials survive power cycle and deep sleep | Native NVS path and separate bounded test build; Jeremy's serial/panel observations required | Physical Pending |
| No credentials printed or committed | Source/upstream logging audit plus sanitized actual serial | Software QA pending; physical Pending |
| Original four Jeremy checks with serial excerpts | Flash, phone/save, reconnect and long press | Pending |
| Independent QA and final-head CI | Separate GPT-6.1 Sol · High audit, normal/harness builds, renderer/server checks | Pending |
| Jeremy acceptance and authorized merge | Explicit instruction after evidence | Pending |

## Needs Jeremy

First review this packet and its PR, then explicitly approve **T15 normal firmware flash and the separate persistence test**. Agents prepare the bundles but do not upload or operate hardware under [AGENTS.md](../AGENTS.md) rule 13. Do not repeat T14 flashing: these are new artifacts with their own hashes. Leave USB connected while software preparation runs.

After approval, the orchestrator will guide these steps in order:

1. Close the current monitor with Ctrl+C. Discover the serial port. With USB connected, hold **BOOT**, press/release **RESET**, wait two seconds, then release BOOT. Rediscover the ROM port; e-paper can keep its old image during this step.
2. Verify the normal bundle's source revision and all SHA-256 checks, then upload the four explicit address/file pairs: bootloader `0x0000`, partitions `0x8000`, boot_app0 `0xe000`, app `0x10000`, DIO/80m/16MB. Use the frozen-bundle command supplied below. Do not use the broken vendor `nobuild` uploader. Press/release RESET with BOOT released if the app remains in downloader mode; rediscover its application port and open the monitor.
3. Confirm the approved setup frame and `Setup AP IP: 192.168.4.1`. On a phone join `WeatherStation-Setup` with `firstlight`, open `http://192.168.4.1`, and enter home Wi-Fi credentials privately. Expect generic `Trying submitted Wi-Fi` / `Provisioning complete; setup frame retained`, hotspot closure, and the unchanged panel. Return sanitized serial only; do not share home SSID/password or credential-form screenshots.
4. Disconnect/reconnect USB with BOOT released twice. Expect `Saved Wi-Fi connected; panel retained`, no setup-display log, no hotspot and no panel refresh. Keep the battery connector empty.
5. Briefly press/release BOOT: expect one refresh-hook message. While firmware is running, hold BOOT at least five seconds, then release: expect reset, one setup redraw and the portal. A continued hold must not repeatedly redraw; USER should do nothing. Re-provision and confirm another power-cycle reconnect. Also check a wrong Wi-Fi submission remains in setup and permits a corrected submission; saved-network unavailability should enter setup after the bounded reconnect wait.
6. After reviewing its separate hash, flash the persistence harness by the same ROM/hash/offset procedure. Provision if needed. Leave BOOT released: after thirty seconds it enters one ten-second timer sleep. CDC may disappear; rediscover/reopen the application port. Expect `Timer wake reconnected; persistence observed`, retained panel and no hotspot/redraw. A `FAIL timer wake required portal; persistence unproven` message does not pass persistence even if re-provisioning subsequently succeeds.
7. Restore the frozen normal T15 bundle and confirm saved reconnect plus BOOT reset again. Return the actual serial excerpts, whole-panel setup photo and observed outcomes, including which artifact was flashed each time. Tests are Pending until observed.

## Artifacts and exact commands

Pending final independent QA/source revision. The completed packet will list both distinct bundles and their source/app hashes before any release approval is requested. Existing T14 snapshot remains unchanged at `/private/tmp/weather-epaper-t14-artifacts/4ac387dbbbb3672b11672222f360a83804c8d615/` for recovery under the accepted [T14 packet](t14-review.md).

## Limits and next gate

No actual radio, phone, NVS persistence or runtime reset observation is claimed from compilation/mocks. Battery calibration and life await the pack and later cards. T16 owns weather download, ext0 wake integration and the half-hourly schedule. T15 stays In progress until its criteria, independent QA, Jeremy acceptance and authorized merge all pass. No T16 work is dispatched.
