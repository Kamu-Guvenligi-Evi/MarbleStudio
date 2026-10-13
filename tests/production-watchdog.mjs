import assert from 'node:assert/strict';
import {mock} from 'node:test';
import {createProductionWatchdog} from '../scripts/production-watchdog.mjs';

mock.timers.enable({apis:['setTimeout','Date'],now:0});
try{
  const errors=[],watchdog=createProductionWatchdog(error=>errors.push(error));
  // Simulate an hour of continuous frame production: the old absolute limit
  // would have terminated the job after the first 20 minutes.
  for(let minute=0;minute<60;minute++){mock.timers.tick(60_000);watchdog.progress();}
  assert.equal(errors.length,0);
  mock.timers.tick(20*60_000-1);
  assert.equal(errors.length,0);
  mock.timers.tick(1);
  assert.equal(errors.length,1);
  assert.equal(watchdog.error.code,'PRODUCTION_STALLED');
  assert.equal(watchdog.error.nonRetryable,true);
  watchdog.progress();mock.timers.tick(20*60_000);
  assert.equal(errors.length,1);
  watchdog.close();
  const finished=createProductionWatchdog(()=>assert.fail('Finished exports must not time out'));
  finished.close();mock.timers.tick(20*60_000);
  console.log('PASS (simulated clock): advancing exports survive one hour, stalls fail once without retry, completed exports clear watchdog.');
}finally{mock.timers.reset();}
