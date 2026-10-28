// Keep the glass in an offscreen canvas; impacts repaint only changed regions.
import {GLASS_THEMES,themeColor,createGlassShine,createGlassFill,drawGlassPattern} from './glass-themes.js';
export class GlassPaneRenderer {
  constructor(context){
    this.context=context;
    const buffer=document.createElement('canvas');buffer.width=context.canvas.width;buffer.height=context.canvas.height;
    this.buffer=buffer.getContext('2d');
    const transform=context.getTransform();this.scaleX=transform.a;this.scaleY=transform.d;
    this.buffer.setTransform(transform);this.theme=GLASS_THEMES.spectrum;this.reset();
  }
  setTheme(theme){if(this.theme!==theme){this.theme=theme;this.reset();}}
  reset(){this.revision=-1;this.facets=new Map();}
  facet(cell){
    let facet=this.facets.get(cell.id);
    if(!facet){
      const path=new Path2D();cell.poly.forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();
      const xs=cell.poly.map(p=>p.x),ys=cell.poly.map(p=>p.y);
      const shine=createGlassShine(this.context,this.theme,cell);
      facet={path,shine,fill:createGlassFill(this.context,this.theme,cell),left:Math.floor(Math.min(...xs))-8,top:Math.floor(Math.min(...ys))-8,right:Math.ceil(Math.max(...xs))+8,bottom:Math.ceil(Math.max(...ys))+8,state:undefined};
      this.facets.set(cell.id,facet);
    }
    return facet;
  }
  update(cells,revision){
    if(this.revision===revision)return;
    const glass=this.buffer,full=this.revision<0,dirty=[];
    for(const cell of cells){
      const facet=this.facet(cell),state=cell.broken?-1:cell.stress;
      if(facet.state!==state){dirty.push(facet);facet.state=state;}
    }
    this.revision=revision;
    if(!full&&!dirty.length)return;
    const region={left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity};
    for(const d of dirty){region.left=Math.min(region.left,d.left);region.top=Math.min(region.top,d.top);region.right=Math.max(region.right,d.right);region.bottom=Math.max(region.bottom,d.bottom);}
    const affected=full?cells:cells.filter(cell=>{
      const f=this.facets.get(cell.id);
      return f.left<=region.right&&f.right>=region.left&&f.top<=region.bottom&&f.bottom>=region.top;
    });
    glass.save();
    glass.clearRect(0,0,glass.canvas.width/this.scaleX,glass.canvas.height/this.scaleY);
    for(const c of affected){
      if(c.broken)continue;
      const {path,shine,fill}=this.facets.get(c.id);
      glass.fillStyle=fill;glass.fill(path);
      glass.lineWidth=.65;glass.strokeStyle=themeColor(this.theme,c.hue,80,.25);glass.stroke(path);
      glass.save();glass.clip(path);glass.fillStyle=shine;glass.fill(path);
      drawGlassPattern(glass,this.theme,c);
      if(c.stress){
        glass.strokeStyle=`rgba(240,255,255,${c.stress*.45})`;glass.lineWidth=.65;
        for(let i=0;i<3;i++){const p=c.poly[(i*2+c.id)%c.poly.length];glass.beginPath();glass.moveTo(p.x,p.y);glass.lineTo((p.x+c.x)/2+Math.sin(c.id+i)*3,(p.y+c.y)/2);glass.lineTo(c.x,c.y);glass.stroke();}
      }
      glass.restore();
    }
    glass.globalCompositeOperation='source-atop';glass.strokeStyle='#e1ffff55';glass.lineWidth=1.3;
    for(const c of affected)if(c.broken)glass.stroke(this.facets.get(c.id).path);
    glass.restore();
    // Render complete polygons before copying the changed rectangle. Clipping
    // paths during drawing changes edge antialiasing and can leave visible seams.
    const x=full?0:Math.max(0,Math.floor(region.left*this.scaleX)),y=full?0:Math.max(0,Math.floor(region.top*this.scaleY));
    const w=(full?glass.canvas.width:Math.min(glass.canvas.width,Math.ceil(region.right*this.scaleX)))-x;
    const h=(full?glass.canvas.height:Math.min(glass.canvas.height,Math.ceil(region.bottom*this.scaleY)))-y;
    this.context.save();this.context.resetTransform();
    this.context.clearRect(x,y,w,h);this.context.drawImage(glass.canvas,x,y,w,h,x,y,w,h);
    this.context.restore();
  }
}
