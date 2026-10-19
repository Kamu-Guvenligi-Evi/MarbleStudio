import { weaponMotion } from './crown-battle-weapon-motion.js';
// Native animated drawing, using Weta's Azog-on-Warg statue as a shape reference.
// Kept separate from the user-approved Isengard/hyena design.
export function drawAzogWarg(g,walk,hit,pens,action='idle',frame=0){
 const {path,line,oval}=pens(g,.65);
 const fur='#dddcd0',shade='#999e94',light='#ece9da',skin='#d2cdbb',scar='#92756a';
 const bob=Math.abs(walk)*.65;
 g.save();g.translate(0,-bob);
 // Thick tail and digitigrade rear legs; far paws remain visible in a still pose.
 path('M-16,-27Q-24,-29 -28,-20L-30,-16 -27,-17 -27,-14Q-19,-15 -16,-23Z',shade);
 line('M-25,-20L-28,-17M-23,-22L-26,-19',fur,.65);
 function leg(rear,far){
  const step=walk*(rear?-1:1)*(far?-1:1),x=rear?-14:13;
  g.save();g.translate(x+(far?4:0),far?-1:0);g.rotate(step*.16);
  if(rear){
   path('M-4,-22Q-8,-17 -3,-11L1,-9 -3,-5 -3,-1 -1,0 5,0Q7,-1 4,-3L1,-3 5,-10Q6,-12 2,-16L4,-21Z',far?shade:fur);
   line('M-2,-17Q-4,-14 1,-11L3,-10M-1,-3L1,-2',far?'#7f887f':shade,.7);
  }else{
   path('M-4,-25Q-7,-20 -3,-14L-2,-8 -1,-3Q-3,-1 -1,0L6,0Q8,-1 5,-3L2,-4 3,-13Q6,-20 3,-26Z',far?shade:fur);
   line('M-2,-20L0,-16 .3,-8',far?'#7f887f':shade,.7);
  }
  line('M1,-1V-.2M3,-1.2L4,-.2M5,-1L6,-.2','#525a53',.55);
  if(!far)line('M-2,-8L-1,-6M0,-12L.6,-10',light,.6);
  g.restore();
 }
 leg(true,true);leg(false,true);
 // Deep chest, tucked belly and rounded haunch, without horse saddle cloth.
 path('M-21,-23Q-22,-29 -16,-31Q-9,-33 -2,-30L6,-32Q13,-36 19,-29L22,-20Q20,-12 13,-11L7,-13Q1,-17 -6,-15Q-15,-11 -19,-17Z',fur);
 path('M-18,-19Q-10,-16 -4,-19Q4,-20 10,-15L17,-14Q13,-9 7,-14Q1,-17 -6,-15Q-15,-11 -19,-17Z',shade,null);
 path('M-17,-29Q-10,-31 -3,-28L4,-29 7,-31 11,-30Q4,-23 -3,-25L-11,-26Z',light,null);
 leg(true,false);leg(false,false);
 // Dense shoulder ruff and a broad predatory head, lowered towards the target.
 path('M5,-30L6,-34 9,-33 11,-37 14,-35 18,-38 20,-34 24,-34 23,-30 26,-27 24,-23 25,-20 22,-21 22,-17 19,-18 18,-14 15,-17 12,-15 12,-19 8,-18 9,-22 5,-23 7,-26 4,-27Z',fur);
 path('M14,-34Q19,-37 24,-33L29,-28 34,-27Q37,-25 35,-22L29,-19 24,-19Q20,-21 18,-25L14,-27Z',fur);
 path('M15,-34L15,-41Q19,-40 21,-35Z',fur);
 path('M23,-33L27,-40 28,-31Z',shade);
 path('M16,-37L16,-40 19,-36Z','#b59f94',null);
 path('M24,-34L26,-38 26,-33Z','#b59f94',null);
 path('M21,-30Q24,-33 28,-29L30,-26 35,-25 34,-22 29,-22 25,-24 22,-24Z','#b1b4a8',null);
 path('M24,-25Q28,-22 35,-23L34,-19Q29,-16 24,-20L22,-23Z','#493e3b');
 path('M25,-19Q29,-17 34,-20L33,-17 28,-16 25,-17Z',fur);
 path('M33,-27Q36,-27 36,-24L33,-23 31,-25Z','#333a35');
 oval(24.8,-28.7,1.15,.65,'#cba459',null);oval(25.2,-28.7,.3,.65,'#242d29',null);
 line('M22.8,-29.7L26.1,-29.5','#6d766e',.85);
 for(const [x,y,s] of [[25,-23,2.8],[28,-22.7,1.3],[30,-23,1.1],[33,-23,2.4]])path(`M${x},${y}l.65,${s} .9,-${s}Z`,'#f0e7cc',null);
 path('M27,-18L27.5,-20.5 28.5,-18M31,-18L32,-20 32.5,-18Z','#e4ddc4',null);
 // Short fur strokes follow neck, chest and flank volume rather than a flat fill.
 for(const [x,y] of [[6,-30],[9,-32],[12,-33],[13,-29],[10,-27],[9,-24],[13,-25],[15,-23],[16,-20],[18,-27],[-17,-26],[-15,-23],[-13,-27],[-9,-26],[-6,-24],[-4,-27],[0,-25],[3,-27]]){
  line(`M${x},${y}q-1,2 -2.8,3`,shade,.45);
  line(`M${x+.8},${y+.5}l-1,1.5`,light,.4);
 }
 // Small rough riding pad and leather girth, not a rectangular horse blanket.
 path('M-9,-30Q-3,-33 4,-30L7,-27 3,-25 -5,-26 -10,-28Z','#625446');
 line('M-5,-28Q-4,-20 -2,-16','#625446',1.1);
 // Azog: muscular bare torso, bald head, scar patterns and an iron claw prosthesis.
 g.save();g.translate(0,-Math.abs(walk)*.35);
 path('M-6,-47Q-9,-46 -9,-40L-7,-31 0,-28 6,-30 7,-39Q8,-46 3,-48Z',skin);
 path('M-7,-45Q-8,-40 -5,-38L-4,-32 1,-30 -6,-31 -8,-36Z','#a5aa9c',null);
 path('M-5,-44Q-1,-46 3,-44L5,-41Q1,-39 -4,-41Z','#e2ddc9',null);
 line('M-5,-40Q-1,-38 4,-40M-1,-38L-1,-34M1,-36H4',shade,.6);
 line('M-5,-45L-3,-43 0,-44 3,-42M-6,-39L-4,-37 -5,-34M1,-37L3,-36 2,-33',scar,.55);
 // Leather strips, knee and plated shin.
 path('M-7,-32L5,-31 7,-26 3,-22 1,-25 -2,-23 -4,-26 -8,-25Z','#665649');
 line('M-5,-31L-4,-26M-2,-30L-1,-25M2,-30L3,-25','#9d8d70',.7);
 path('M1,-28Q5,-29 8,-25L8,-20 5,-16 2,-17 3,-23 -1,-25Z',skin);
 line('M5,-25L6,-23 5,-21',scar,.6);
 path('M3,-19L7,-18 7,-13 10,-11Q10,-10 6,-10L2,-12Z','#4d5652');
 line('M3,-17L6,-16M3,-14L6,-13','#a7afa1',.6);
 // Thick neck and a three-quarter face with heavy brow, blunt jaw and ears.
 path('M-3,-50L3,-50 4,-45 -4,-45Z',skin);
 path('M-5,-55Q-4,-60 1,-59Q5,-58 5,-54L6,-51 5,-47 2,-45 -2,-46 -5,-50Z',skin);
 path('M-5,-54L-8,-55 -6,-50 -4,-50Z',skin);
 path('M-4,-54Q-2,-56 0,-54L0,-49 -2,-47 -4,-49Z','#a5aa9c',null);
 line('M-2,-54L.2,-53.5M2,-53.7L4.5,-53','#686f65',.9);
 oval(-.4,-53,.35,.3,'#d9e5d9',null);oval(3.6,-52.8,.4,.3,'#d9e5d9',null);
 path('M1,-53L.4,-50 2.5,-50 2.7,-51Z','#a3a497',null);
 line('M-.4,-48.3Q2,-49 4,-48.5','#504d44',.8);
 line('M-2,-57L-1,-55M1,-57L2,-54M-3,-52L-1.5,-50 -2,-48M3.5,-51L4.5,-49',scar,.55);
 // Left forearm stump carries the characteristic branching iron claw.
 path('M-7,-45Q-11,-45 -10,-40L-7,-36 0,-35 1,-38 -5,-40 -5,-43Z',skin);
 line('M-8,-43L-7,-41 -6,-41',scar,.55);
 path('M-2,-39L1,-39 2,-35 -1,-34Z','#424a47');
 line('M0,-37L10,-36Q13,-36 14,-40','#4e5956',1.2);
 line('M1,-36L11,-34Q14,-34 15,-38','#77827b',.85);
 // Right arm swings a heavy flanged mace; the hand shares the skin tone.
 g.save();g.translate(5,-44);g.rotate(weaponMotion('mace',action,frame/8,-.3).angle);
 path('M-1,-1Q3,-3 5,0L8,-5 11,-5 11,-1 6,5Q3,6 0,3Z',skin);
 line('M2,0L3,2 5,1',scar,.6);
 path('M7,-5L10,-6 12,-2 9,0Z','#59625a');
 line('M8,-4L10,-2','#c2c3ad',.7);
 line('M10,-5L16,-19','#4e4940',1.5);
 for(let n=0;n<4;n++)line(`M${11+n*.7},${-8-n*1.7}l1,.4`,'#aa9475',.55);
 path('M13,-16L11,-19 14,-21 14,-24 18,-23 20,-21 18,-19 18,-16 16,-17Z','#626b67');
 line('M14,-21L17,-21 16,-18','#b7beb0',.8);
 oval(10,-5,1.5,1.3,skin);
 g.restore();g.restore();g.restore();
}
