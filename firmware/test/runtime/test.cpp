#include "fake.h"
#include "../../src/provisioning.h"
#include "../../src/net.h"
#include "../../src/board.h"
#include "../../src/schedule.h"
#include "../../src/frame_policy.h"
#include <atomic>
namespace provisioning {
Hook draw=nullptr, refresh=nullptr;
void initialize(Hook setup,Hook immediate){draw=setup;refresh=immediate;}
bool hasCredentials(){return fake::saved;}
bool reconnectSaved(){++fake::joins;delay(fake::joinFails?20000:100);fake::connected=!fake::joinFails;return fake::connected;}
void clearCredentials(){fake::saved=false;for(const char* k:{"lastFrameSha","everShown","framePending","joinFailures","lastLow"})fake::values.erase(k);}
void runPortalBlocking(){++fake::portals;clearCredentials();draw();fake::saved=true;fake::connected=true;}
void pollButton(){fake::onPoll();}
}
namespace net {
bool syncTime(){delay(fake::ntpFails?10000:100);return !fake::ntpFails;}
bool fetch(bool low,time_t,uint8_t* pixels){++fake::fetches;fake::fetchedFile=low?"lowbat":"normal";
 delay(100);if(pixels)memset(pixels,fake::incoming,15000);fake::afterFetch();return pixels&&!fake::fetchFails;}
}
time_t fakeTime(time_t* output){const time_t now=fake::epoch+fake::ms/1000;if(output)*output=now;return now;}
#define time fakeTime
#include "../../src/main.cpp"
#undef time
void reset() {
 fake::ms=0;fake::epoch=1784124000;fake::saved=true;fake::connected=false;fake::joinFails=false;
 fake::ntpFails=false;fake::fetchFails=false;fake::removeFails=false;fake::shaSaveFails=false;
 fake::panelFails=false;fake::everSaveFails=false;fake::pendingSaveFails=false;fake::buttonLow=false;fake::wake=0;
 fake::initCalls=fake::writes=fake::refreshes=fake::portals=fake::joins=fake::fetches=0;
 fake::panel=1;fake::incoming=2;fake::values.clear();fake::pins.clear();fake::afterFetch=[]{};fake::onPoll=[]{};
 chosenTarget=0;rtcWasSet=true;storageReady=true;displayReady=false;refreshRequested=false;
 suppressWakeRelease=false;setupGeneration=0;provisioning::initialize(drawSetup,immediateRefresh);
 setenv("TZ",config::timeZone,1);tzset();
}
std::string shaFor(int value){char byte[3];snprintf(byte,sizeof(byte),"%02x",value);std::string hash;for(int i=0;i<32;++i)hash+=byte;return hash;}
void weatherExists(int pixel=1){fake::values["lastFrameSha"]=shaFor(pixel);fake::values["everShown"]="1";fake::panel=pixel;}
void run(bool timer=false){try{cycle(timer);}catch(const fake::Slept&){} }
int main() {
 reset();weatherExists();fake::joinFails=true;run();
 assert(fake::portals==0&&fake::initCalls==0&&fake::refreshes==0&&fake::panel==1);
 assert(fake::values["joinFailures"]=="1" && fake::sleepUs>0);
 reset();fake::joinFails=true;
 for(unsigned wake=1;wake<20;++wake){fake::ms=0;run();assert(fake::portals==0);assert(fake::values["joinFailures"]==std::to_string(wake));}
 fake::ms=0;run();assert(fake::portals==1&&hasFrame()); // Counter persists across wakes.
 reset();weatherExists();fake::fetchFails=true;run();
 assert(fake::initCalls==0&&fake::panel==1&&fake::values["lastFrameSha"]==shaFor(1));
 reset();weatherExists();fake::ntpFails=true;rtcWasSet=false;run();
 assert(fake::fetches==0&&fake::initCalls==0&&fake::sleepUs==1800000000ULL);
 reset();weatherExists();fake::ntpFails=true;run();assert(fake::fetches==1&&fake::panel==2);
 reset();weatherExists();fake::incoming=1;run();
 assert(fake::initCalls==0&&fake::refreshes==0&&fake::panel==1); // Exact SHA skips driver.
 reset();weatherExists();fake::removeFails=true;run();
 assert(fake::initCalls==0&&fake::panel==1&&fake::values["lastFrameSha"]==shaFor(1));
 reset();weatherExists();fake::shaSaveFails=true;run();assert(fake::panel==2&&!fake::values.count("lastFrameSha"));
 fake::shaSaveFails=false;fake::incoming=1;fake::ms=0;run();
 assert(fake::panel==1&&fake::refreshes==2&&fake::values["lastFrameSha"]==shaFor(1)); // A/B/A defect prevented.
 reset();fake::everSaveFails=true;fake::shaSaveFails=true;run();
 assert(fake::panel==2&&fake::values["framePending"]=="1"&&!fake::values.count("lastFrameSha"));
 fake::joinFails=true;fake::connected=false;
 for(unsigned wake=0;wake<20;++wake){fake::ms=0;run();assert(fake::portals==0&&fake::panel==2);}
 reset();fake::values["framePending"]="1";fake::joinFails=true;
 for(unsigned wake=0;wake<20;++wake){fake::ms=0;run();assert(fake::portals==0&&fake::initCalls==0);}
 reset();fake::pendingSaveFails=true;run();assert(fake::initCalls==0&&fake::panel==1);
 reset();weatherExists();fake::panelFails=true;run();
 assert(!fake::values.count("lastFrameSha")&&fake::values["everShown"]=="1"); // No false success on BUSY timeout.
 reset();weatherExists();fake::afterFetch=[] {fake::onPoll=[] {fake::onPoll=[]{};
   provisioning::clearCredentials();provisioning::runPortalBlocking();};};run();
 assert(fake::portals==1&&fake::panel==setup_frame[0]&&!fake::values.count("lastFrameSha")); // Reset wins over fetched bytes.
 reset();suppressWakeRelease=true;provisioning::clearCredentials();provisioning::runPortalBlocking();
 assert(!suppressWakeRelease);refreshRequested=false;immediateRefresh();assert(refreshRequested); // First later short press survives reset.
 reset();suppressWakeRelease=true;immediateRefresh();assert(!suppressWakeRelease&&!refreshRequested); // Debounced wake release is coalesced.
 reset();weatherExists();chosenTarget=fake::epoch+20;run(true);
 assert(fakeTime(nullptr)>=fake::epoch+20 && fake::fetches==1 && chosenTarget>fake::epoch+20);
 for(int pin:{board::adcEnable,board::amplifierEnable,board::codecEnable,board::loraEnable,board::temperatureEnable,board::loraReset})assert(fake::pins[pin]==LOW);
 assert(fake::fetchedFile=="lowbat"); // ADC0 follows specified provisional policy.
 puts("PASS deployed-main join20/retention/NTP/RTC/SHA-A-B-A/reset/BOOT/target/power orchestration");
}
