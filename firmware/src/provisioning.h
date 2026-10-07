#pragma once
namespace provisioning {
using Hook = void (*)();
// Call early after configuring GPIO0 INPUT: a held wake button starts timing.
void initialize(Hook drawSetup, Hook immediateRefresh);
bool hasCredentials();
// Draw approved setup once on entry; return only on connected + saved metadata.
void runPortalBlocking();
void clearCredentials();
bool reconnectSaved();
// Call frequently while awake. Short release invokes refresh hook; long press resets.
void pollButton();
}
