export const SPIRAL_VARIANTS={
  classic:{name:'Klasik',chip:1,gap:.06,speed:760},
  avalanche:{name:'Çığ',chip:1.15,gap:.04,speed:800},
  precision:{name:'İnce çatlak',chip:.88,gap:.085,speed:720},
  burst:{name:'Seri dalga',chip:1.05,gap:.035,speed:830},
};
export const spiralVariant=value=>Object.hasOwn(SPIRAL_VARIANTS,value)?value:'classic';
