// Preview pixels follow the displayed image, including fullscreen letterboxing.
// Capture callers explicitly pin the original video resolution before captureStream.
export function createPreviewCanvas(canvas,{onResize}={}){
  const fullWidth=canvas.width,fullHeight=canvas.height,aspect=fullWidth/fullHeight;
  const step=fullWidth/60;
  let previewWidth=fullWidth;
  function measure(notify=true){
    const bounds=canvas.getBoundingClientRect();
    const displayedWidth=Math.min(bounds.width,bounds.height*aspect);
    if(displayedWidth<=0)return;
    const next=Math.min(fullWidth,Math.max(aspect>1?960:540,Math.ceil(displayedWidth*(window.devicePixelRatio||1)*1.25/step)*step));
    if(next===previewWidth)return;
    previewWidth=next;if(notify)onResize?.();
  }
  // The observer never resizes directly: recording remains pinned on every draw.
  const observer=new ResizeObserver(measure);observer.observe(canvas);
  window.addEventListener('resize',measure);
  measure(false);
  return {
    apply(fullResolution=false){
      const width=Math.round(fullResolution?fullWidth:previewWidth),height=Math.round(width/aspect);
      if(canvas.width===width&&canvas.height===height)return false;
      canvas.width=width;canvas.height=height;return true;
    },
    dispose(){observer.disconnect();window.removeEventListener('resize',measure);}
  };
}
