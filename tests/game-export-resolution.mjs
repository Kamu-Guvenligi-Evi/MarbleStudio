import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  // Keep pixel comparisons on one raster backend; readback otherwise switches it.
  await page.addInitScript(()=>{
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,options){return getContext.call(this,type,type==='2d'?{...options,willReadFrequently:true}:options);};
  });
  await page.goto(origin+'/factory-render.html');
  for(const width of [540,720,1080]){
    const size=await page.evaluate(async width=>{
      const {beginBreaker,breakerFrame}=await import('/src/breaker-video-render.js');
      await beginBreaker({width,height:width*960/540,speed:1,intro:0,analysis:{simulationSeconds:30},recipe:{mode:'spiral-breaker',mapId:'spiral',playbackSpeed:1}});
      const canvas=breakerFrame(0);return [canvas.width,canvas.height];
    },width);
    assert.deepEqual(size,[width,width*960/540]);
    const frame=page.frames().find(frame=>frame.url().includes('/spiral-breaker.html'));
    const result=await frame.evaluate(async()=>{
      const {SpiralBreaker,CELL,COLS,ROWS}=await import('/src/spiral-breaker.js');
      let game,field;
      const step=SpiralBreaker.prototype.step;
      SpiralBreaker.prototype.step=function(dt){game=this;return step.call(this,dt);};
      window.breakerVideo.step(1/120);
      SpiralBreaker.prototype.step=step;
      const draw=CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
        if(source instanceof HTMLCanvasElement&&source.height===Math.ceil(ROWS*CELL*this.canvas.height/960))field=source;
        return draw.call(this,source,...args);
      };
      const canvas=window.breakerVideo.draw();
      CanvasRenderingContext2D.prototype.drawImage=draw;
      if(!field)throw new Error('Missing block field');
      const ctx=field.getContext('2d'),initial=ctx.getImageData(0,0,field.width,field.height).data;
      const expected=new Uint8ClampedArray(initial),sx=canvas.width/540,sy=canvas.height/960;
      // Remove actual occupied blocks, including adjacent blocks at fractional scale.
      let broken=0;
      for(let index=0;index<game.cells.length&&broken<60;index++){
        if(!game.cells[index])continue;
        game.breakCell(index);broken++;
        const col=index%COLS,row=Math.floor(index/COLS);
        for(let y=Math.round(row*CELL*sy);y<Math.round((row+1)*CELL*sy);y++){
          for(let x=Math.round(col*CELL*sx);x<Math.round((col+1)*CELL*sx);x++)expected.fill(0,(y*field.width+x)*4,(y*field.width+x+1)*4);
        }
      }
      const actual=ctx.getImageData(0,0,field.width,field.height).data;
      let differences=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differences++;
      window.breakerVideo.reset({mapId:'spiral'},()=>{});
      const reset=ctx.getImageData(0,0,field.width,field.height).data;
      let resetDifferences=0;for(let i=0;i<reset.length;i++)if(reset[i]!==initial[i])resetDifferences++;
      return {width:field.width,height:field.height,expectedHeight:Math.ceil(ROWS*CELL*sy),broken,differences,resetDifferences};
    });
    assert.equal(result.width,width);assert.equal(result.height,result.expectedHeight);
    assert.equal(result.broken,60);assert.equal(result.differences,0);assert.equal(result.resetDifferences,0);
    console.log(`PASS Spiral ${width}: native field, clean block removal, exact reset`);
  }
  const rps=await page.evaluate(async()=>{
    const {RockPaperScissors}=await import('/src/rock-paper-scissors.js');
    const {renderRps}=await import('/src/rock-paper-scissors-renderer.js');
    const game=new RockPaperScissors(),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    let calls=[];
    const draw=ctx.drawImage.bind(ctx);
    ctx.drawImage=function(source,...args){calls.push({source,requiredWidth:args[2]*this.getTransform().a});return draw(source,...args);};
    const results=[];let previous;
    for(const width of [540,720,1080]){
      canvas.width=width;canvas.height=width*960/540;
      game.state='finished';game.winner='rock';
      calls=[];renderRps(ctx,game,game.settings);
      const background=calls[0].source;
      const undersized=calls.filter(call=>call.source.width+0.001<call.requiredWidth).length;
      calls=[];renderRps(ctx,game,game.settings);
      results.push({width:background.width,height:background.height,cached:background===calls[0].source,resized:background!==previous,undersized});
      previous=background;
    }
    return results;
  });
  for(const [index,width] of [540,720,1080].entries()){
    assert.deepEqual(rps[index],{width,height:width*960/540,cached:true,resized:true,undersized:0});
    console.log(`PASS RPS ${width}: native background and icons, cached layers reused`);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
