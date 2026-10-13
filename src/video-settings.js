export const DEFAULT_VIDEO_FPS=144;
export const VIDEO_FPS_DEFAULT_VERSION=4;

export function preferredVideoFps(saved={}){
  const fps=Number(saved.fps);
  if(!Number.isSafeInteger(fps)||fps<1)return DEFAULT_VIDEO_FPS;
  if(saved.fpsDefaultVersion===VIDEO_FPS_DEFAULT_VERSION)return fps;
  // Preserve explicit choices from the previous settings, migrating its default.
  if(saved.fpsDefaultVersion===3&&fps!==240)return fps;
  return DEFAULT_VIDEO_FPS;
}
