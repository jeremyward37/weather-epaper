#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
test_binary=$(mktemp "${TMPDIR:-/tmp}/weather-epaper-native.XXXXXX")
trap 'rm -f "$test_binary"' EXIT
c++ -std=c++17 -Wall -Wextra -Werror -Ifirmware/test/native firmware/src/provisioning.cpp firmware/test/native/test.cpp -o "$test_binary"
for scenario in button saved timeout reset held-wake held-release portal portal-reset failed-save frame-invalidation pending-invalidation metadata-failure; do
  "$test_binary" "$scenario"
done

c++ -std=c++17 -Wall -Wextra -Werror -Ifirmware/src firmware/src/schedule.cpp firmware/test/test_schedule/test_main.cpp -o "$test_binary"
"$test_binary"

c++ -std=c++17 -Wall -Wextra -Werror -Ifirmware/test/runtime -Ifirmware/src firmware/src/schedule.cpp firmware/test/runtime/test.cpp -o "$test_binary"
"$test_binary"

c++ -std=c++17 -Wall -Wextra -Werror -Ifirmware/test/runtime -Ifirmware/src firmware/test/runtime/test_net.cpp -o "$test_binary"
for scenario in success lowbat tls-invalid dns-deadline tls-deadline write-deadline read-deadline drip-deadline short oversize ntp-freshness; do
  "$test_binary" "$scenario"
done
