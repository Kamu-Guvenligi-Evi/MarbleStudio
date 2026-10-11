export function videoTiming(simulationSeconds, targetDuration, {exact=false, intro=0, outro=2, bounded=false}={}){
  if(!Number.isFinite(simulationSeconds)||simulationSeconds<=0)throw new Error('Geçersiz simülasyon süresi.');
  const duration=Math.ceil(simulationSeconds+intro+outro);
  if(bounded&&(duration<30||duration>180))return null;
  if(exact)return {duration,speed:1};
  // Keep the physics at its recorded pace. A target length guides candidate
  // selection, but stretching the simulation changes the visible ball speed.
  if(duration<30||duration>180)return null;
  return {duration,speed:1,durationDifference:Math.abs(duration-targetDuration)};
}
