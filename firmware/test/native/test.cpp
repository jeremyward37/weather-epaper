#include "fake.h"
#include "../../src/provisioning.h"
#include "../../src/button.h"
using namespace provisioning;
void setupFrame(){++draws;}void refresh(){++refreshes;}
int main(int argc,char**argv){
 assert(argc==2);std::string scenario=argv[1];
 initialize(setupFrame,refresh);
 if(scenario=="button"){
   BootButton b;assert(b.sample(true,100)==ButtonEvent::None);
   assert(b.sample(false,110)==ButtonEvent::None); // bounce is not a press
   assert(b.sample(false,140)==ButtonEvent::None);
   b.sample(true,200);b.sample(true,230);
   assert(b.sample(true,5199)==ButtonEvent::None);
   assert(b.sample(true,5200)==ButtonEvent::Reset);
   assert(b.sample(true,12000)==ButtonEvent::None);
   b.sample(false,12001);assert(b.sample(false,12031)==ButtonEvent::None);
   b.sample(true,13000);b.sample(true,13030);b.sample(false,13100);
   assert(b.sample(false,13130)==ButtonEvent::Refresh);
   BootButton wrap;uint32_t start=UINT32_MAX-100;
   wrap.sample(true,start);wrap.sample(true,start+30);
   assert(wrap.sample(true,start+5000)==ButtonEvent::Reset);
 } else if(scenario=="saved"){
   saved=true;connected=true;metadata["lastFrameSha"]="accepted-sha";
   assert(hasCredentials());assert(reconnectSaved());assert(draws==0);
   assert(metadata["lastFrameSha"]=="accepted-sha");assert(metadata["provisioned"]=="1");
 } else if(scenario=="timeout"){
   saved=true;metadata["lastFrameSha"]="accepted-sha";
   assert(!reconnectSaved());assert(clockMs==20000);assert(saved);
   assert(metadata["lastFrameSha"]=="accepted-sha");
 } else if(scenario=="reset"){
   saved=true;eraseFails=true;metadata["lastFrameSha"]="accepted-sha";
   clearCredentials();assert(metadata["resetPending"]=="1");assert(!hasCredentials());
   assert(!metadata.count("lastFrameSha")); // failed erase cannot resurrect credentials
 } else if(scenario=="held-wake"){
   saved=true;held=[](uint32_t){return true;};
   assert(!reconnectSaved());assert(clockMs==5000);assert(!saved);
 } else if(scenario=="portal"){
   // No submission for a full minute: portal stays open; bad save then retry.
   onProcess=[] {if(clockMs==60000)intent=true;if(clockMs==90000)intent=true;
     if(clockMs>=90005)connected=true;};
   runPortalBlocking();assert(clockMs>=90005);assert(draws==1);assert(apStarts==1);
   assert(begins==2);assert(metadata["provisioned"]=="1");assert(metadata.count("lastFrameSha"));
 } else if(scenario=="portal-reset"){
   saved=true;held=[](uint32_t n){return n>=100&&n<6100;};
   onProcess=[] {if(clockMs==10000)intent=true;if(clockMs>=10005)connected=true;};
   runPortalBlocking();assert(apStarts==2);assert(draws==1);assert(!metadata.count("resetPending"));
 } else if(scenario=="failed-save"){
   saved=true;connected=true;staleNative=true;nativeSaveFails=true;
   metadata["resetPending"]="1";
   onProcess=[] {if(clockMs==100)intent=true;
     if(clockMs==2000){assert(metadata["resetPending"]=="1");assert(begins==0);}
     if(clockMs==3000){nativeSaveFails=false;intent=true;}
     if(clockMs>=3005)connected=true;};
   runPortalBlocking();assert(clockMs>=3005);assert(begins==1);
   assert(!metadata.count("resetPending"));
 } else if(scenario=="frame-invalidation"){
   saved=true;metadata["lastFrameSha"]="accepted-sha";removeFails=true;
   held=[](uint32_t n){return n<5500;};
   onDelay=[] {if(clockMs<6000){assert(draws==0);assert(metadata.count("lastFrameSha"));}
     if(clockMs>=6000)removeFails=false;};
   onProcess=[] {if(clockMs==6000)intent=true;if(clockMs>=6005)connected=true;};
   runPortalBlocking();assert(clockMs>=6005);assert(draws==1);
   assert(metadata["lastFrameSha"].empty());assert(!metadata.count("resetPending"));
 } else if(scenario=="metadata-failure"){
   saved=true;connected=true;prefsFail=true;assert(!reconnectSaved());assert(draws==0);
 } else return 2;
 puts(("PASS "+scenario).c_str());
}
