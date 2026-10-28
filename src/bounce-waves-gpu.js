// Batch all spheres into one GPU draw instead of issuing a canvas call per ball.
const renderers=new WeakMap();
function createRenderer(){
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false});
  if(!gl)return null;
  const shader=(type,source)=>{
    const result=gl.createShader(type);gl.shaderSource(result,source);gl.compileShader(result);
    if(!gl.getShaderParameter(result,gl.COMPILE_STATUS))throw new Error('Wave shader unavailable');
    return result;
  };
  const vertex=shader(gl.VERTEX_SHADER,`attribute vec2 position;attribute vec2 uv;varying vec2 texcoord;
    void main(){gl_Position=vec4(position.x/270.0-1.0,1.0-position.y/480.0,0.0,1.0);texcoord=uv;}`);
  const fragment=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 texcoord;uniform sampler2D atlas;
    void main(){gl_FragColor=texture2D(atlas,texcoord);}`);
  const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Wave program unavailable');
  gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,offset] of [['position',0],['uv',8]]){
    const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,16,offset);
  }
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  return {canvas,gl,data:new Float32Array(0),atlas:null};
}
export function drawWaveSpheres(ctx,order,atlas,diameter){
  if(!renderers.has(ctx)){
    try{renderers.set(ctx,createRenderer());}catch{renderers.set(ctx,null);}
  }
  const renderer=renderers.get(ctx);
  if(!renderer||renderer.gl.isContextLost())return false;
  const {gl,canvas}=renderer,{width,height}=ctx.canvas;
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
  if(renderer.atlas!==atlas){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);renderer.atlas=atlas;}
  const length=order.length*24;
  if(renderer.data.length!==length)renderer.data=new Float32Array(length);
  const data=renderer.data,half=diameter/2;let i=0;
  for(const b of order){
    const left=b.sx-half,right=b.sx+half,top=b.sy-half,bottom=b.sy+half,u=b.color/96,v=(b.color+1)/96;
    data[i++]=left;data[i++]=top;data[i++]=u;data[i++]=0;
    data[i++]=right;data[i++]=top;data[i++]=v;data[i++]=0;
    data[i++]=left;data[i++]=bottom;data[i++]=u;data[i++]=1;
    data[i++]=left;data[i++]=bottom;data[i++]=u;data[i++]=1;
    data[i++]=right;data[i++]=top;data[i++]=v;data[i++]=0;
    data[i++]=right;data[i++]=bottom;data[i++]=v;data[i++]=1;
  }
  gl.clear(gl.COLOR_BUFFER_BIT);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.drawArrays(gl.TRIANGLES,0,order.length*6);
  ctx.drawImage(canvas,0,0,540,960);
  return true;
}
