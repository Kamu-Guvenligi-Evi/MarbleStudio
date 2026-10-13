export function videoTiming(simulationSeconds, _targetDuration, {intro=0, outro=2}={}){
  if(!Number.isFinite(simulationSeconds)||simulationSeconds<=0)throw new Error('Geçersiz simülasyon süresi.');
  const duration=Math.ceil(simulationSeconds+intro+outro);
  // Export the actual game, including short and long races, at its original pace.
  return {duration,speed:1};
}
