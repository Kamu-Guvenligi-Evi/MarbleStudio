export function videoTiming(simulationSeconds, targetDuration, {exact=false, intro=0, outro=2}={}){
  if(!Number.isFinite(simulationSeconds)||simulationSeconds<=0)throw new Error('Geçersiz simülasyon süresi.');
  const duration=Math.ceil(simulationSeconds+intro+outro);
  if(exact)return {duration,speed:1};
  // Keep the physics at its recorded pace. A target length guides candidate
  // selection, but stretching the simulation changes the visible ball speed.
  if(duration<25||duration>180)return null;
  return {duration,speed:1,durationDifference:Math.abs(duration-targetDuration)};
}
