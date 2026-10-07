#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
test_binary=$(mktemp "${TMPDIR:-/tmp}/weather-epaper-t15-native.XXXXXX")
trap 'rm -f "$test_binary"' EXIT
c++ -std=c++17 -Wall -Wextra -Werror -Ifirmware/test/native firmware/src/provisioning.cpp firmware/test/native/test.cpp -o "$test_binary"
for scenario in button saved timeout reset held-wake portal portal-reset failed-save frame-invalidation metadata-failure; do
  "$test_binary" "$scenario"
done
