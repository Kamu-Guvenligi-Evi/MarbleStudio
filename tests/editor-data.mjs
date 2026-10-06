import assert from 'node:assert/strict';
import { Race } from '../src/physics.js';
import { SECTION_SETTINGS, normalizeSection } from '../src/section-settings.js';
import { updateCourse } from '../src/courses.js';
import { normalizeProject,serializeProject,parseProject,loadDraft,saveDraft,readProjects,writeProjects,DRAFT_KEY } from '../src/projects.js';

const types=Object.keys(SECTION_SETTINGS);
const full=new Race({seed:893,sequence:types});
for(let index=0;index<types.length;index++) {
  const test=new Race({seed:893,sequence:types,previewIndex:index,count:6});
  assert.equal(test.sections.length,1);
  const source=full.obstacles.filter(b=>b.plugin.section===index),copy=test.obstacles.filter(b=>b.plugin.section===0);
  assert.equal(source.length,copy.length);
  for(const time of [0,1.2,3.5]) {
    updateCourse(full.course,time);updateCourse(test.course,time);
    for(let i=0;i<source.length;i++) {
      assert.ok(Math.abs(source[i].position.x-copy[i].position.x)<1e-6);
      assert.ok(Math.abs(source[i].position.y-copy[i].position.y-index*650)<1e-6);
      assert.ok(Math.abs(source[i].angle-copy[i].angle)<1e-6);
      assert.equal(source[i].collisionFilter.mask,copy[i].collisionFilter.mask);
    }
  }
  test.dispose();
}
full.dispose();
console.log('PASS: every isolated section matches full-course geometry, moving obstacles and gates at three times.');

for(const edge of ['min','max'])for(const seed of [1,2048]) {
  const sequence=types.map(type=>({type,settings:Object.fromEntries(SECTION_SETTINGS[type].map(spec=>[spec.key,spec.options?spec.options[edge==='min'?1:spec.options.length-1][0]:spec[edge]]))}));
  const r=new Race({seed,sequence,count:20});r.start();
  for(let i=0;i<120*120&&r.state!=='finished';i++) {
    r.step();assert.ok(r.balls.every(b=>b.body.position.x>0&&b.body.position.x<540),'A ball escaped the course');
  }
  assert.equal(r.finished.length,20,`${edge}/${seed}: unfinished ${JSON.stringify(r.balls.filter(b=>!b.finishedAt).map(b=>({position:b.body.position,type:r.sectionAt(b.body.position.y)?.type})))}`);
  console.log(`${edge} settings / seed ${seed}: 20/20 finished in ${r.time.toFixed(2)}s`);r.dispose();
}
const left=new Race({sequence:[{type:'wheels',settings:{speed:1.8,direction:'counterclockwise'}}]});
assert.ok(left.course.movers[0].speed<0);assert.equal(left.sequence[0].settings.speed,1.8);left.dispose();
assert.throws(()=>normalizeSection({type:'wheels',settings:{speed:Infinity}}));
assert.throws(()=>normalizeSection({type:'pulse',settings:{openFor:0}}));
assert.throws(()=>normalizeSection({type:'funnel',settings:{unknown:2}}));

const project=normalizeProject({name:'Video 01',seed:8899,count:16,sound:true,trails:false,sequence:[{type:'funnel',settings:{gap:134,speed:1.6,direction:'clockwise'}},{type:'pulse',settings:{openFor:2.5,closedFor:1.1}}]});
assert.deepEqual(parseProject(serializeProject(project)),project);
assert.throws(()=>parseProject('{not json}'));
assert.throws(()=>parseProject(JSON.stringify({format:'marble-studio-course',version:99,project})));
assert.throws(()=>parseProject(serializeProject(project).replace('134','9999')));
assert.throws(()=>normalizeProject({...project,count:15}));
const map=new Map();const storage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};
map.set('marble-studio-course-v1',JSON.stringify(['funnel','pulse']));
assert.equal(loadDraft(storage).sequence[0].settings.gap,112);
assert.ok(saveDraft(project,storage));assert.deepEqual(loadDraft(storage),project);
map.set(DRAFT_KEY,'bad json');assert.equal(loadDraft(storage).sequence.length,2);
const entries=[{id:'test-id',updatedAt:new Date().toISOString(),project}];
writeProjects(entries,storage);assert.deepEqual(readProjects(storage),entries);
assert.throws(()=>writeProjects(entries,{setItem:()=>{throw new Error('Quota exceeded');}}));
console.log('PASS: project backup round trip, complete settings, legacy migration, invalid file rejection and storage failure handling.');
