// The ice is a destructible field, not a single moving finish line. A hit can
// leave a lip on either side of the channel for a later ball to break.
export const ICE_CELL=2,ICE_WIDTH=270,ICE_HEIGHT=480;
export const ICE_THICKNESS=36;
const TAU=Math.PI*2;
export class SpiralIce{
  constructor(){
    this.cells=new Uint8Array(ICE_WIDTH*ICE_HEIGHT);this.remaining=0;this.revision=0;this.cuts=[];this.fallen=[];
    this.visited=new Uint8Array(this.cells.length);this.queue=new Uint32Array(this.cells.length);
    for(let gy=120;gy<370;gy++)for(let gx=10;gx<267;gx++){
      const x=gx*2+1-270,y=gy*2+1-480,r=Math.hypot(x,y);
      const phi=(Math.atan2(y,x)+TAU)%TAU;
      const turn=Math.floor((260-41/TAU*phi-r)/41),angle=phi+turn*TAU;
      const outer=260-41/TAU*angle;
      if((turn>=0&&angle>=Math.PI/2&&angle<=12*Math.PI&&r<=outer-(41-ICE_THICKNESS)/2&&r>=outer-(41+ICE_THICKNESS)/2)||r<14){
        this.cells[gy*ICE_WIDTH+gx]=1;this.remaining++;
      }
    }
    this.initial=this.remaining;
  }
  contact(x,y,radius){
    const left=Math.max(0,Math.floor((x-radius-1)/2)),right=Math.min(ICE_WIDTH-1,Math.ceil((x+radius+1)/2));
    const top=Math.max(0,Math.floor((y-radius-1)/2)),bottom=Math.min(ICE_HEIGHT-1,Math.ceil((y+radius+1)/2));
    let nearest=null,best=(radius+1)*(radius+1);
    for(let gy=top;gy<=bottom;gy++)for(let gx=left;gx<=right;gx++){
      if(!this.cells[gy*ICE_WIDTH+gx])continue;
      const px=gx*2+1,py=gy*2+1,d=(px-x)**2+(py-y)**2;
      if(d<=best){best=d;nearest={x:px,y:py};}
    }
    return nearest;
  }
  chip(point,rng,spread=1){
    const radii=Array.from({length:16},()=>(spread===1?9.3:9)+rng()*6),reach=24;
    const normalLength=Math.hypot(point.x-270,point.y-480)||1,nx=(point.x-270)/normalLength,ny=(point.y-480)/normalLength;
    this.cuts.push(radii.map((radius,i)=>{
      const dx=Math.cos(i/16*TAU)*radius,dy=Math.sin(i/16*TAU)*radius*spread;
      return {x:point.x-dx*ny+dy*nx,y:point.y+dx*nx+dy*ny};
    }));
    const left=Math.max(0,Math.floor((point.x-reach)/2)),right=Math.min(ICE_WIDTH-1,Math.ceil((point.x+reach)/2));
    const top=Math.max(0,Math.floor((point.y-reach)/2)),bottom=Math.min(ICE_HEIGHT-1,Math.ceil((point.y+reach)/2));
    let removed=0;
    for(let gy=top;gy<=bottom;gy++)for(let gx=left;gx<=right;gx++){
      const index=gy*ICE_WIDTH+gx;if(!this.cells[index])continue;
      const worldX=gx*2+1-point.x,worldY=gy*2+1-point.y;
      const dx=-worldX*ny+worldY*nx,dy=(worldX*nx+worldY*ny)/spread;
      const angle=((Math.atan2(dy,dx)+TAU)%TAU)/TAU*16,part=Math.floor(angle),f=angle-part;
      const radius=radii[part]*(1-f)+radii[(part+1)%16]*f;
      if(dx*dx+dy*dy<=radius*radius){this.cells[index]=0;removed++;}
    }
    this.remaining-=removed;this.detachFragments();this.revision++;return removed;
  }
  detachFragments(){
    if(!this.remaining)return;
    let anchor=-1,best=Infinity;
    for(let i=0;i<this.cells.length;i++)if(this.cells[i]){
      const d=(i%ICE_WIDTH*2+1-270)**2+(Math.floor(i/ICE_WIDTH)*2+1-480)**2;
      if(d<best){best=d;anchor=i;}
    }
    const seen=this.visited,queue=this.queue;seen.fill(0);seen[anchor]=1;queue[0]=anchor;
    let head=0,tail=1;
    while(head<tail){
      const i=queue[head++];
      for(const next of [i-1,i+1,i-ICE_WIDTH,i+ICE_WIDTH])if(next>=0&&next<this.cells.length&&this.cells[next]&&!seen[next]){seen[next]=1;queue[tail++]=next;}
    }
    for(let i=0;i<this.cells.length;i++)if(this.cells[i]&&!seen[i]){
      this.cells[i]=0;this.remaining--;this.fallen.push({x:i%ICE_WIDTH*2,y:Math.floor(i/ICE_WIDTH)*2});
    }
  }
  clear(){this.cells.fill(0);this.remaining=0;this.revision++;}
}
