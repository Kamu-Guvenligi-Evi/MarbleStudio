export const SPIRAL_THEMES = {
  ice: {name:'Buz Kıran',description:'Buz beyazı spiral, renkli toplar ve kristal parçaları.',surface:['#fcfeff','#e0f1f7','#9bbdcd'],background:['#101d2a','#03070d'],edge:'#64899b',rail:'#395566',chip:['#effaff','#8bb5ca'],hues:null,effect:'shard'},
  lava: {name:'Lav Çekirdeği',description:'Kömür siyahı spiral, kor çatlakları ve sıcak kıvılcımlar.',surface:['#654537','#352725','#19191e'],background:['#32140e','#080507'],edge:'#ff783e',rail:'#743d29',chip:['#ffe1a0','#ff6b2c'],hues:[38,48,18,5],effect:'ember'},
  aurora: {name:'Kutup Işıkları',description:'Mint kristaller, mor toplar ve kuzey ışıklarının renkleri.',surface:['#d9fff2','#7fddca','#438ba1'],background:['#162644','#050b19'],edge:'#8ce8d5',rail:'#38576e',chip:['#d4fff4','#79dec9'],hues:[280,310,255,335],effect:'shard'},
  gold: {name:'Altın Kasa',description:'Saten altın spiral, safir toplar ve altın pul yağmuru.',surface:['#fff0b4','#d5ad55','#8c5c25'],background:['#252017','#08090d'],edge:'#b98a3c',rail:'#645336',chip:['#ffec9e','#dca943'],hues:[205,225,185,245],effect:'flake'},
  candy: {name:'Şeker Sarmalı',description:'Pembe şeker katmanları, meyve renkleri ve yuvarlak şeker parçaları.',surface:['#ffe3f0','#efa4c9','#b968a5'],background:['#30223f','#100b1b'],edge:'#d996c6',rail:'#765378',chip:['#fff2b4','#ffacd7'],hues:[170,45,200,335,100],effect:'bubble'},
  cosmic: {name:'Kozmik Kristal',description:'Yıldızlı boşlukta mor kristal ve elektrik mavisi toplar.',surface:['#e5d8ff','#a495de','#5c5698'],background:['#211941','#060812'],edge:'#a997e4',rail:'#504675',chip:['#e4dbff','#a496ec'],hues:[185,205,165,220],effect:'star'},
};
export function normalizeSpiralTheme(value){return Object.hasOwn(SPIRAL_THEMES,value)?value:'ice';}
