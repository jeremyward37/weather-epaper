#pragma once
#include <time.h>
#include <stdint.h>
namespace schedule {
// Caller configures the Mountain POSIX TZ before calling these pure functions.
bool isSlot(time_t instant);
time_t nextSlot(time_t now); // Strictly future, every half hour, 24 hours a day.
struct SleepPlan { time_t target; uint32_t seconds; };
SleepPlan nextWake(time_t now, time_t completedTarget, uint32_t lead = 20,
                   uint32_t debugInterval = 0);
// Keep the chosen target after an early timer wake, even if joining crosses a nominal slot.
bool pendingTarget(time_t now, time_t target, uint32_t lead = 20);
}
