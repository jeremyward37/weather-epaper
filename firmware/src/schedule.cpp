#include "schedule.h"
namespace schedule {
bool isSlot(time_t instant) {
  tm local{}; localtime_r(&instant, &local);
  return local.tm_sec == 0 && local.tm_min % 30 == 0;
}
time_t nextSlot(time_t now) {
  // Real half-hour instants continue through midnight and both DST transitions.
  return (now / 1800 + 1) * 1800;
}
SleepPlan nextWake(time_t now, time_t completedTarget, uint32_t lead,
                   uint32_t debugInterval) {
  if (debugInterval) return {now + debugInterval, debugInterval > lead ? debugInterval - lead : 1};
  const time_t after = now > completedTarget ? now : completedTarget;
  const time_t target = nextSlot(after);
  if (!target) return {0, 1800};
  // A fresh boot just before a slot wakes at the slot if its lead already passed;
  // retain that target and never recalculate it on the following timer wake.
  const time_t early = target - lead;
  const time_t wake = early > now ? early : target;
  return {target, static_cast<uint32_t>(wake > now ? wake - now : 1)};
}
bool pendingTarget(time_t now, time_t target, uint32_t lead) {
  // A long portal stay/large clock correction must not revive an obsolete slot.
  return target > 0 && now >= target - static_cast<time_t>(lead + 60) &&
         now <= target + 120;
}
}
