export async function fetchMatches(league,date,signal){
  const origin=new URL(document.querySelector('.factory-link').href).origin;
  const response=await fetch(origin+'/api/matches?'+new URLSearchParams({league,date}),{signal});
  if(!response.ok){
    let message='Maç hizmetine ulaşılamadı. Marble Studio kısayolunu yeniden açıp tekrar dene.';
    try{message=(await response.json()).error||message;}catch{}
    throw new Error(message);
  }
  const result=await response.json();if(!Array.isArray(result.events))throw new Error('Maç verisi okunamadı.');
  return result;
}
