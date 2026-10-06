const speed = { key:'speed', label:'Hareket hızı', min:.5, max:1.8, step:.1, value:1, unit:'×' };
const direction = { key:'direction', label:'Dönüş yönü', value:'auto', options:[['auto','Düzene göre'],['clockwise','Saat yönü'],['counterclockwise','Saat yönünün tersi']] };
export const SECTION_SETTINGS = {
  shortcut: [{key:'gap',label:'Kestirme giriş genişliği',min:64,max:110,step:2,value:80,unit:''},{key:'offset',label:'Kestirmenin konumu',min:-50,max:50,step:10,value:0,unit:''}],
  crossramps: [{key:'slope',label:'Rampa eğimi',min:.85,max:1.15,step:.05,value:1,unit:'×'},{key:'side',label:'İlk rampanın yönü',value:'right',options:[['right','Sağa'],['left','Sola']]}],
  funnel: [{key:'gap',label:'Geçit genişliği',min:90,max:160,step:2,value:112,unit:''},speed,direction],
  fork: [speed,direction],
  wheels: [speed,direction],
  slalom: [{key:'slope',label:'Rampa eğimi',min:.8,max:1.2,step:.1,value:1,unit:'×'},{key:'side',label:'İlk rampanın yönü',value:'auto',options:[['auto','Düzene göre'],['right','Sağa'],['left','Sola']]}],
  pulse: [{key:'openFor',label:'Açık kalma süresi',min:.8,max:2.8,step:.05,value:1.65,unit:' sn'},{key:'closedFor',label:'Kapalı kalma süresi',min:.8,max:3,step:.05,value:1.95,unit:' sn'}],
  drift: [speed,{key:'travel',label:'Hareket mesafesi',min:.6,max:1.15,step:.05,value:1,unit:'×'}],
  pegs: [{key:'size',label:'Engel büyüklüğü',min:.8,max:1.15,step:.05,value:1,unit:'×'},speed],
  pendulum: [speed,{key:'amplitude',label:'Salınım açısı',min:.6,max:1.1,step:.1,value:1,unit:'×'}],
};

export function normalizeSection(entry) {
  const type = typeof entry === 'string' ? entry : entry?.type;
  if (!Object.hasOwn(SECTION_SETTINGS,type)) throw new Error('Tanınmayan bölüm türü.');
  const raw = typeof entry === 'string' ? {} : entry.settings ?? {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Bölüm ayarları geçersiz.');
  const specs = SECTION_SETTINGS[type];
  if (Object.keys(raw).some(key => !specs.some(s => s.key === key))) throw new Error('Tanınmayan bölüm ayarı.');
  const settings = {};
  for (const spec of specs) {
    const value = raw[spec.key] ?? spec.value;
    if (spec.options ? !spec.options.some(([id]) => id === value) : typeof value !== 'number' || !Number.isFinite(value) || value < spec.min || value > spec.max) {
      throw new Error(`${spec.label} geçerli aralıkta değil.`);
    }
    settings[spec.key] = value;
  }
  return { type, settings };
}
export function normalizeSequence(sequence) {
  if (!Array.isArray(sequence) || sequence.length > 24) throw new Error('Parkur en fazla 24 bölüm içerebilir.');
  return sequence.map(normalizeSection);
}
