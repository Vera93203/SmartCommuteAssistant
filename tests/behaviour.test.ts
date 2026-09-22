import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { decodePolyline } from '../src/components/RouteMapVisualizer';
import { fetchGoogleMapsRoute, computeAccurateRouteOptions } from '../src/services/accurateRoutingEngine';

assert.deepEqual(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@'), [[38.5,-120.2],[40.7,-120.95],[43.252,-126.453]]);
assert.deepEqual(decodePolyline('_'), []);
process.env.GOOGLE_MAPS_PLATFORM_KEY = 'test-only';
const original = globalThis.fetch;
globalThis.fetch = async (url, options) => {
 if (String(url).includes('routes.googleapis.com')) {
   const body=JSON.parse(String(options?.body));
   assert.ok(['DRIVE','TRANSIT','BICYCLE','WALK'].includes(body.travelMode));
   return new Response(JSON.stringify({routes:[{distanceMeters:1000,duration:'600s',staticDuration:'540s',polyline:{encodedPolyline:'_p~iF~ps|U_ulLnnqC_mqNvxq`@'},travelAdvisory:{transitFare:{currencyCode:'GBP',units:'4',nanos:850000000}},legs:[]}]}));
 }
 return new Response(JSON.stringify({features:[]}));
};
const route = await fetchGoogleMapsRoute('London','London','transit');
assert.equal(route?.fare,'£4.85');
assert.ok(route?.encodedPolyline);
const start = new Date(Date.now()+3600000).toISOString();
const options = await computeAccurateRouteOptions('London',{id:'test',title:'Test',location:'London',parsedDestination:'London',startTime:start,endTime:start,category:'work'},{driving:10,transit:8,bicycling:5,walking:0});
for (const route of Object.values(options)) {
 assert.equal(Date.parse(route.etaTime)-Date.parse(route.leaveByTime),route.durationMinutes*60000);
 assert.equal(Date.parse(start)-Date.parse(route.etaTime),route.bufferMinutes*60000);
}
assert.equal(options.transit.trafficStatus,'unknown');
assert.equal(options.walking.bufferMinutes,0);
globalThis.fetch=original;

// Exercise the server's actual reminder function with a deterministic clock and storage.
const server = fs.readFileSync('server.ts','utf8');
const fn = server.slice(server.indexOf('function checkReminders('),server.indexOf('setInterval(checkReminders,'));
const now=new Date(2026,8,7,12,0);
const state:any={preferencesStore:{quietHours:{enabled:false,start:'22:00',end:'07:00'},notificationThresholds:{headsUpMinutes:60}},eventsStore:[{id:'e',title:'Test',startTime:new Date(+now+7200000).toISOString(),selectedMode:'transit',routeOptions:{transit:{leaveByTime:new Date(+now+1800000).toISOString()}}}],notificationsStore:[],saveState:()=>{},Date};
vm.createContext(state);vm.runInContext(ts.transpile(fn),state);
state.checkReminders(now);state.checkReminders(now);assert.equal(state.notificationsStore.length,1);
assert.equal(state.notificationsStore[0].type,'heads_up');
state.checkReminders(new Date(+now+1800000));assert.equal(state.notificationsStore[0].type,'leave_now');
state.notificationsStore=[];state.preferencesStore.quietHours={enabled:true,start:'11:00',end:'13:00'};state.checkReminders(now);assert.equal(state.notificationsStore.length,0);
state.preferencesStore.quietHours={enabled:true,start:'22:00',end:'07:00'};
const night=new Date(2026,8,7,23,0);state.eventsStore[0].startTime=new Date(+night+7200000).toISOString();state.eventsStore[0].routeOptions.transit.leaveByTime=new Date(+night+1800000).toISOString();state.checkReminders(night);assert.equal(state.notificationsStore.length,0);
console.log('Passed: geometry, fare conversion, ETA/buffers, unknown traffic, reminder timing, deduplication and daytime/overnight quiet hours.');
