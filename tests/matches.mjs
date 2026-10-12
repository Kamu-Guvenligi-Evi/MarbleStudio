import assert from 'node:assert/strict';
import {createMatchService} from '../scripts/match-service.mjs';
import {MATCH_LEAGUES,matchDay,validMatchDate,shiftMatchDay,normalizeMatch,espnURL} from '../src/match-data.js';

const league=MATCH_LEAGUES[0];
function event(id,date,state='pre',name='STATUS_SCHEDULED'){
  return {id,date,status:{type:{state,name,completed:state==='post'},period:2,displayClock:'04:32'},competitions:[{date,venue:{fullName:'Test Stadium'},competitors:[
    {homeAway:'home',team:{id:'1',displayName:'Home',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png'},score:'7'},
    {homeAway:'away',team:{id:'2',displayName:'Away'},score:'0'}]}],links:[{href:'javascript:alert(1)'}]};
}
assert.equal(matchDay('2026-10-12T21:00:00Z'),'2026-10-13');
assert.equal(matchDay('2026-10-13T20:59:59Z'),'2026-10-13');
assert.equal(shiftMatchDay('2026-01-01',-1),'2025-12-31');
assert.ok(validMatchDate('2028-02-29'));
for(const date of ['2026-02-29','2026-02-30','invalid','2026-13-01','2026-1-1'])assert.equal(validMatchDate(date),false);
assert.equal(normalizeMatch(event('1','2026-10-13T00:15:00Z'),league).home.score,null);
assert.equal(normalizeMatch(event('1','2026-10-13T00:15:00Z','in'),league).home.score,'7');
assert.equal(normalizeMatch(event('1','2026-10-13T00:15:00Z','post','STATUS_POSTPONED'),league).state,'postponed');
assert.equal(normalizeMatch(event('1','2026-10-13T00:15:00Z','post','STATUS_CANCELED'),league).state,'cancelled');
assert.equal(normalizeMatch(event('1','2026-10-13T00:15:00Z','post','STATUS_FINAL'),league).state,'final');
assert.equal(normalizeMatch({id:'bad'},league),null);
const soccer=MATCH_LEAGUES.find(l=>l.id==='tur.1'),football=event('soccer','2026-10-12T17:00:00Z','in');
football.status.displayClock="67'";
assert.equal(normalizeMatch(football,soccer).label,"67'");
football.status.type.name='STATUS_HALFTIME';assert.equal(normalizeMatch(football,soccer).label,'Devre arası');
assert.equal(normalizeMatch(event('1','2026-10-13T00:15:00Z'),league).sourceUrl,null);
assert.equal(espnURL('https://www.espn.com.evil.test/'),null);
assert.equal(espnURL('https://example.com/logo.png',true),null);
let time=Date.parse('2026-10-13T12:00:00Z'),calls=[],fail=false;
const games=[event('early','2026-10-13T00:15:00Z','post','STATUS_FINAL'),event('late','2026-10-13T19:00:00Z'),event('yesterday','2026-10-12T20:59:59Z'),event('tomorrow','2026-10-13T21:00:00Z')];
const service=createMatchService({now:()=>time,fetcher:async url=>{
  calls.push(url);await new Promise(resolve=>setTimeout(resolve,5));if(fail)throw Error('offline');
  return {ok:true,json:async()=>({events:games})};
}});
const [first,second]=await Promise.all([service('nfl','2026-10-13'),service('nfl','2026-10-13')]);
assert.deepEqual(first,second);assert.equal(calls.length,2,'Concurrent requests must share upstream fetches');
assert.ok(calls.some(url=>url.includes('dates=20261012')));assert.ok(calls.some(url=>url.includes('dates=20261013')));
assert.deepEqual(first.events.map(e=>e.id),['early','late'],'Deduplicate and retain only Istanbul-day matches');
await service('nfl','2026-10-13');assert.equal(calls.length,2);
time+=60001;fail=true;const stale=await service('nfl','2026-10-13');assert.ok(stale.stale);assert.equal(stale.updatedAt,first.updatedAt);assert.deepEqual(stale.events,first.events);
await assert.rejects(service('nba','2026-10-13'),e=>e.status===502);
await assert.rejects(service('http://localhost','2026-10-13'));
await assert.rejects(service('nfl','2026-02-30'));
const malformed=createMatchService({fetcher:async()=>({ok:true,json:async()=>({message:'upstream failure'})})});
await assert.rejects(malformed('nfl','2026-10-13'),e=>e.status===502);
console.log('PASS: Istanbul dates, midnight boundaries, score/status normalization, safe URLs, deduplication, cache/coalescing, stale fallback and network failure.');
