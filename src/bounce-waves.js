export const WAVES_KEY='marble-studio-bounce-waves-v1';
export const WAVE_MODES={ripple:'Ripple bowl',spiral:'Spiral bloom',cross:'Cross waves',petals:'Flower pulse',twins:'Twin ripples',pinwheel:'Pinwheel',diamond:'Diamond waves',braid:'Silk braid',rings:'Nested rings',star:'Star blossom'};
export const WAVE_PALETTES={
  aurora:{name:'Aurora',colors:['#20dfff','#435fff','#bb20ff','#ff2458']},
  sunset:{name:'Sunset',colors:['#ffe440','#ff793d','#ff2458','#bb20ff']},
  candy:{name:'Candy',colors:['#35ed91','#20dfff','#ad79ff','#ff62c8']},
  spectrum:{name:'Spectrum',colors:['#ff2458','#ff793d','#ffe440','#47ff42','#20dfff','#435fff','#bb20ff']},
  ember:{name:'Reference ember',colors:['#fff085','#ffcb24','#ff793d','#f82738']},
  lagoon:{name:'Lagoon',colors:['#092f70','#087eaa','#23dcca','#c3fff0']},
  pearl:{name:'Pearl',colors:['#b9cffa','#f9e5ff','#fff5e0','#b1eddc']},
  cherry:{name:'Cherry blossom',colors:['#64345c','#d66f9b','#ffb9d1','#fff0e4']},
  mint:{name:'Mint chocolate',colors:['#402c31','#93675b','#7dd2ab','#d9ffe2']},
  electric:{name:'Electric',colors:['#261a79','#8147ff','#fa52ec','#7affdc']},
  glacier:{name:'Glacier',colors:['#183d81','#639edc','#b9eeff','#ffffff']},
  copper:{name:'Copper',colors:['#522d38','#b6654c','#f2ba7c','#fff0ba']},
  meadow:{name:'Meadow',colors:['#174d52','#4d9e77','#b5db6d','#fff3a6']},
};
const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
export const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
export function normalizeWaves(raw={}){
  raw=raw&&typeof raw==='object'?raw:{};
  const hex=(v,f)=>/^#[a-f\d]{6}$/i.test(v)?v:f;
  return {variant:Object.hasOwn(WAVE_MODES,raw.variant)?raw.variant:'ripple',
    palette:raw.palette==='custom'||Object.hasOwn(WAVE_PALETTES,raw.palette)?raw.palette:'aurora',
    colorA:hex(raw.colorA,'#20dfff'),colorB:hex(raw.colorB,'#ff2458'),
    count:Math.round(clamp(raw.count,500,8000,4200)),height:clamp(raw.height,120,300,240),
    duration:clamp(raw.duration,15,90,30),speed:clamp(raw.speed,.5,2,1),sound:raw.sound!==false,
    music:{mode:'fixed',track:typeof raw.music?.track==='string'?raw.music.track:'',volume:clamp(raw.music?.volume,0,100,35),roster:[]}};
}
// Independent vertical bouncers on a spaced hexagonal bed: spheres never
// overlap horizontally. The wave is encoded in the release heights. All balls
// start at rest and bounce elastically under the same constant gravity.
const MAX_DROP_TIME=.825,MAX_FLIGHT=MAX_DROP_TIME*2;
function waveProfile(ball,variant){
  const {r,x,z,angle}=ball;
  if(variant==='spiral')return r*(.65+.35*Math.sin(2*angle-r*4));
  if(variant==='cross')return .5+.25*Math.sin(x*3)+.25*Math.cos(z*3);
  if(variant==='petals')return r*(.65+.35*Math.cos(angle*5));
  if(variant==='twins')return (1+Math.cos(Math.min(Math.hypot(x-.42,z),Math.hypot(x+.42,z))*9))*.5;
  if(variant==='pinwheel')return .5+.5*r*Math.sin(angle*3-r*7);
  if(variant==='diamond')return (1+Math.cos((Math.abs(x)+Math.abs(z))*7))*.5;
  if(variant==='braid')return .5+.5*Math.sin(x*7+Math.sin(z*5)*1.8);
  if(variant==='rings')return (1+Math.cos(r*13))*.5;
  if(variant==='star')return r*(.55+.45*Math.cos(angle*8));
  return r;
}
export class BounceWaves{
  constructor(raw){
    this.settings=normalizeWaves(raw);this.time=0;this.state='running';this.balls=[];
    this.gravity=2*this.settings.height/(MAX_DROP_TIME*MAX_DROP_TIME);
    const gap=Math.sqrt(2*Math.PI/(Math.sqrt(3)*this.settings.count)),row=gap*Math.sqrt(3)/2;
    for(let iz=-Math.ceil(1/row);iz<=Math.ceil(1/row);iz++)for(let ix=-Math.ceil(1/gap);ix<=Math.ceil(1/gap);ix++){
      const x=(ix+(iz&1)*.5)*gap,z=iz*row,r=Math.hypot(x,z);
      if(r<=.98){
        const ball={x,z,r,angle:Math.atan2(z,x),height:0,velocity:0,sx:0,sy:0,depth:0,color:0};
        ball.period=MAX_FLIGHT*(1-.28*waveProfile(ball,this.settings.variant));
        ball.dropTime=ball.period*.5;
        ball.releaseHeight=.5*this.gravity*ball.dropTime*ball.dropTime;
        this.balls.push(ball);
      }
    }
    this.radius=gap*238*.43;this.seek(0);
  }
  seek(seconds){
    this.time=Math.max(0,Math.min(this.settings.duration,Number.isFinite(seconds)?seconds:0));
    this.state=this.time>=this.settings.duration?'finished':'running';
    const t=this.time,s=this.settings,g=this.gravity;
    for(const b of this.balls){
      if(this.state==='finished'){
        b.height=0;b.velocity=0;
      }else if(t<b.dropTime){
        b.height=b.releaseHeight-.5*g*t*t;b.velocity=-g*t;
      }else{
        // Exact ballistic arcs make arbitrary seeking and all render frame rates
        // equivalent. Shorten only the LAST launch at the floor so it lands at
        // the finish; never squash an airborne trajectory to end the animation.
        const cycle=Math.floor((t-b.dropTime)/b.period);
        const launch=b.dropTime+cycle*b.period;
        const flight=Math.min(b.period,s.duration-launch),age=Math.max(0,t-launch);
        b.height=Math.max(0,.5*g*age*(flight-age));
        b.velocity=g*(flight*.5-age);
      }
      b.color=Math.max(0,Math.min(95,Math.round((b.r*.72+b.height/s.height*.28)*95)));
    }
    return this;
  }
}
export const normalizeWavesSnapshot=raw=>({mode:'bounce-waves',project:normalizeWaves(raw.project)});
export function probeWaves(recipe){
  const s=normalizeWaves(recipe),seconds=s.duration/s.speed;
  return {complete:true,finite:true,simulationSeconds:seconds,winner:null,hits:0,rescues:0,score:100,coverTime:seconds*.4,firstEventSeconds:0,longestQuietSeconds:0};
}
