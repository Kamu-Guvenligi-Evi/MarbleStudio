// One bounded static layer per output context. Export gets its own full-size layer.
const layers=new WeakMap();
export function canvasLayer(context,key,width,height,paint){
  const pixelWidth=context.canvas.width,pixelHeight=Math.round(pixelWidth*height/width);
  let layer=layers.get(context);
  if(!layer||layer.key!==key||layer.canvas.width!==pixelWidth||layer.canvas.height!==pixelHeight){
    const canvas=document.createElement('canvas');canvas.width=pixelWidth;canvas.height=pixelHeight;
    const ctx=canvas.getContext('2d');ctx.scale(pixelWidth/width,pixelHeight/height);paint(ctx);
    layer={key,canvas};layers.set(context,layer);
  }
  return layer.canvas;
}
