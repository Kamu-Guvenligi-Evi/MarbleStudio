import assert from 'node:assert/strict';

// Exercise the packaged queue and its bundled browser/FFmpeg, not a mock.
const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5173';
const api=async(route,body)=>{
  const response=await fetch(origin+'/api/'+route,{...(body?{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  assert.ok(response.ok,await response.clone().text());return response.json();
};
for(const [name,sections,maxSpeed] of [['short',1,18],['long',16,1]]){
  const channel='Natural duration test '+name+' '+Date.now();
  const source={mode:'track',project:{name,seed:2048,count:2,maxSpeed,sequence:Array(sections).fill('shortcut'),ballNames:['One','Two'],presentation:{countdown:0,outro:2,camera:'smart'}},music:{mode:'fixed',track:'',volume:0}};
  await api('queue',{channel,source,strategy:'exact',duration:55,resolution:720,fps:2,audio:'none'});
  let job;const deadline=Date.now()+300000;
  while(Date.now()<deadline){
    job=(await api('factory?limit=50')).jobs.find(j=>j.options.channel===channel);
    if(job?.state==='done')break;
    assert.ok(!['failed','cancelled'].includes(job?.state),job?.error);
    if(job?.error)throw Error(job.error);
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  assert.equal(job?.state,'done');
  const meta=await (await fetch(origin+'/output/'+job.id+'/metadata.json')).json();
  assert.equal(meta.recipe.sequence.length,sections);assert.equal(meta.recipe.maxSpeed,maxSpeed);
  assert.equal(meta.video.speed,1);assert.equal(meta.video.duration,Math.ceil(meta.analysis.simulationSeconds+2));
  assert.ok(name==='short'?meta.video.duration<30:meta.video.duration>180);
  const video=await fetch(origin+'/output/'+job.id+'/video.mp4?preview=1',{headers:{Range:'bytes=0-1023'}});
  assert.equal(video.status,206);assert.equal((await video.arrayBuffer()).byteLength,1024);
  console.log(`PASS: ${name} MP4 (${meta.video.duration}s), original ${sections} sections and speed preserved, legacy target ignored, download works.`);
}
