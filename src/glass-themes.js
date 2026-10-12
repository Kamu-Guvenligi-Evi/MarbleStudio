export const GLASS_THEMES={
  spectrum:{name:'Spektrum',detail:'Renkli kristal',hue:null,saturation:88,accent:'#80e9c8',background:'#101214',halo:'#315849',wall:'#d2e2dc',swatch:'linear-gradient(125deg,#ed778d,#bd8bea,#77b8e6,#78cba6)',metal:false},
  gold:{name:'Gold',detail:'Sıcak altın',hue:42,saturation:64,accent:'#e5c47e',background:'#151310',halo:'#665022',wall:'#d5bc82',swatch:'linear-gradient(125deg,#705122,#d8b45e 35%,#fff0b9 47%,#9e7532 59%,#e5c47e)',metal:true},
  chrome:{name:'Krom',detail:'Gümüş yansımalar',hue:215,saturation:8,accent:'#c4d2e3',background:'#101318',halo:'#36495f',wall:'#c5d3e4',swatch:'linear-gradient(125deg,#445165,#bdc9d8 35%,#f3f6fc 47%,#69788e 59%,#c4d2e3)',metal:true},
  rose:{name:'Rose Gold',detail:'Bakır ve pembe',hue:17,saturation:43,accent:'#e4b3a4',background:'#171214',halo:'#674239',wall:'#d6afa0',swatch:'linear-gradient(125deg,#795047,#cd9483 35%,#ffe0cd 47%,#a46557 59%,#e4b3a4)',metal:true},
  emerald:{name:'Zümrüt',detail:'Derin yeşil',hue:157,saturation:49,accent:'#86d5b2',background:'#0e1715',halo:'#245d48',wall:'#a2cbbb',swatch:'linear-gradient(125deg,#174e43,#419d79 40%,#b8e7cb 49%,#286b57 62%,#65bc97)',metal:false},
  sapphire:{name:'Safir',detail:'Serin mavi',hue:215,saturation:59,accent:'#97bdea',background:'#10141c',halo:'#304d79',wall:'#a8c3df',swatch:'linear-gradient(125deg,#213e70,#477fb9 40%,#c1deef 49%,#365d95 62%,#78a5db)',metal:false}
};
// Closed palettes blend neighboring shades without a visible seam at 360°.
const palettes={
  gold:[[42,66],[54,56],[34,69],[22,53],[46,61]],
  chrome:[[212,20],[184,22],[230,19],[274,17],[38,16]],
  rose:[[17,47],[344,42],[323,32],[29,54],[8,46]],
  emerald:[[157,51],[181,48],[168,57],[126,40],[146,48]],
  sapphire:[[215,61],[193,57],[226,59],[253,44],[208,55]]
};
const themePalettes=new Map(Object.entries(palettes).map(([id,palette])=>[GLASS_THEMES[id],palette]));
export function themeColor(theme,hue,light=55,alpha=1){
  const palette=themePalettes.get(theme);
  let tint=hue,saturation=theme.saturation;
  if(palette){
    const phase=((hue%360+360)%360)/360*palette.length,index=Math.floor(phase);
    const a=palette[index],b=palette[(index+1)%palette.length],mix=(1-Math.cos((phase-index)*Math.PI))/2;
    const distance=((b[0]-a[0]+540)%360)-180;
    tint=a[0]+distance*mix;saturation=a[1]+(b[1]-a[1])*mix;
  }
  return `hsla(${tint} ${saturation}% ${light}% / ${alpha})`;
}
export function createGlassFill(context,theme,cell){
  const fill=context.createLinearGradient(cell.x-16,cell.y-18,cell.x+16,cell.y+18);
  fill.addColorStop(0,themeColor(theme,cell.hue-22,cell.light+6));
  fill.addColorStop(.48,themeColor(theme,cell.hue,cell.light+1));
  fill.addColorStop(1,themeColor(theme,cell.hue+25,cell.light-4));
  return fill;
}
export function createGlassShine(context,theme,cell){
  const shine=theme.metal?context.createLinearGradient(95,225,455,620):context.createLinearGradient(cell.x-12,cell.y-14,cell.x+12,cell.y+14);
  const stops=theme.metal?[[0,'#00000028'],[.22,'#ffffff0c'],[.4,'#ffffff6b'],[.48,'#ffffffa3'],[.54,'#00000045'],[.7,'#ffffff0c'],[.87,'#ffffff52'],[1,'#00000024']]:[[0,'#ffffff32'],[.48,'#ffffff02'],[.52,'#ffffff14'],[1,'#0000001a']];
  for(const [offset,color] of stops)shine.addColorStop(offset,color);
  return shine;
}
