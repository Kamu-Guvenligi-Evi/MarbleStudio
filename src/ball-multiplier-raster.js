import {BALL_COLORS} from './ball-multiplier.js';

const colors=BALL_COLORS.map(hex=>{
  const rgb=parseInt(hex.slice(1),16);
  return {r:rgb>>>16,g:rgb>>>8&255,b:rgb&255};
});
const white={r:255,g:255,b:255};

// Rasterise small circles in one pixel buffer. Thousands of individual canvas
// paths / texture draws cost more than these small covered pixel regions.
export function paintMultiplierBalls(layer,game,alpha){
  const {canvas}=layer,width=canvas.width,height=canvas.height;
  if(!layer.image||layer.image.width!==width||layer.image.height!==height){
    layer.image=new ImageData(width,height);layer.pixels=new Uint32Array(layer.image.data.buffer);
  }
  const pixels=layer.pixels,bytes=layer.image.data;
  pixels.fill(0);
  const scale=width/540,scaleY=height/960;
  function circle(x,y,r,color,opacity=1){
    x*=scale;y*=scaleY;r*=scale;
    const left=Math.max(0,Math.floor(x-r-.5)),right=Math.min(width-1,Math.ceil(x+r+.5));
    const top=Math.max(0,Math.floor(y-r-.5)),bottom=Math.min(height-1,Math.ceil(y+r+.5));
    const inner=Math.max(0,r-.5)**2,outer=(r+.5)**2;
    for(let py=top;py<=bottom;py++){
      const dy=py+.5-y,dy2=dy*dy;
      for(let px=left;px<=right;px++){
        const dx=px+.5-x,d2=dx*dx+dy2;
        if(d2>=outer)continue;
        const index=(py*width+px)*4;
        const coverage=opacity*(d2<=inner?1:r+.5-Math.sqrt(d2));
        if(coverage>=1){bytes[index]=color.r;bytes[index+1]=color.g;bytes[index+2]=color.b;bytes[index+3]=255;continue;}
        const previous=bytes[index+3]/255*(1-coverage),combined=coverage+previous;
        bytes[index]=(color.r*coverage+bytes[index]*previous)/combined;
        bytes[index+1]=(color.g*coverage+bytes[index+1]*previous)/combined;
        bytes[index+2]=(color.b*coverage+bytes[index+2]*previous)/combined;
        bytes[index+3]=combined*255;
      }
    }
  }
  for(let c=0;c<colors.length;c++)for(const b of game.balls){
    if(b.color!==BALL_COLORS[c])continue;
    const x=b.px+(b.x-b.px)*alpha,y=b.py+(b.y-b.py)*alpha,r=(b.pr??b.r)+(b.r-(b.pr??b.r))*alpha;
    circle(x,y,r,colors[c]);
  }
  if((game.finaleProgress??0)>.4)for(const b of game.balls){
    const x=b.px+(b.x-b.px)*alpha,y=b.py+(b.y-b.py)*alpha,r=(b.pr??b.r)+(b.r-(b.pr??b.r))*alpha;
    circle(x-r*.25,y-r*.3,r*(.16+(b.bloom??0)*.25),white,.23);
  }
  canvas.getContext('2d',{willReadFrequently:true}).putImageData(layer.image,0,0);
}
