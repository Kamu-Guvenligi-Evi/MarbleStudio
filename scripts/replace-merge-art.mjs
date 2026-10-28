// Download small, already transparent originals; never remove photo backgrounds heuristically.
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {MERGE_THEMES} from '../src/merge-themes.js';
import {MERGE_IMAGES} from '../src/merge-image-manifest.js';
const dir='public/merge-cutouts';await fs.mkdir(dir,{recursive:true});
const categories=JSON.parse(await fs.readFile('artifacts/png-categories.json','utf8'));
const category=new Map(categories.map(([url])=>[url.split('/').at(-1),url]));
const audit=JSON.parse(await fs.readFile('artifacts/merge-alpha-audit.json','utf8'));
const library=JSON.parse(await fs.readFile('artifacts/game-icons.json','utf8')).uncategorized;
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');
async function inspect(src){return page.evaluate(async src=>{let i=new Image();i.src=src;try{await i.decode();}catch{return null;}let c=document.createElement('canvas');c.width=c.height=96;let x=c.getContext('2d');x.drawImage(i,0,0,96,96);let d=x.getImageData(0,0,96,96).data,clear=0,edge=0,minX=96,minY=96,maxX=0,maxY=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++){let a=d[(y*96+x)*4+3];if(a<10)clear++;if((x===0||x===95||y===0||y===95)&&a>200)edge++;if(a>25){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}return {clear:clear/9216,edge:edge/380,bounds:[minX/96,minY/96,(maxX-minX+1)/96,(maxY-minY+1)/96]};},src);}
const png={
reference:'skull,,spider,batman,ironman,hulk,superman,',
avengers:',,captain_america,ironman,,hulk,,',justice:',,,, ,batman,wonder_woman,superman',gotham:',,,,,,joker,batman',
planets:',,earth,mars_planet,jupiter,,,',cosmos:'asteroid,moon,earth,sun,,,,',
'sun-life':',,sun,,,','massive-star':',,,,,',missions:'fireworks,rockets,,,,,,',moons:'moon,,,,,,,',
gems:',,,,,emerald,ruby,diamond',butterfly:',caterpillar,,butterfly',
reef:',,shrimps,crab,fish,turtle,shark,',ocean:'shrimps,crab,fish,octopus,turtle,dolphin,shark,whale',
garden:'sunflower_seeds,,green_leaves,tulip,camomile,apple,tree,forest',weather:'drops,smoke,cloud,rain,snowflakes,lightning,hurricane,rainbow',
fruit:'strawberry,cherry,plum,apricot,peach,pear,apple,melon',berries:'redcurrant,blueberries,raspberry,blackberry,strawberry,grape',orchard:'cherry,plum,apricot,peach,pear,apple',
harvest:'sunflower_seeds,,camomile,,apple,basket,wheat',strings:',,guitar,violin,,,,harp',winds:',flute,,,,,,',rhythm:',,,,drum,,,',orchestra:'flute,,violin,,,harp,piano,',
dragon:'fire,egg,lizard,,dragon,dragon,dragon,dragon',wizard:'fire,,, , , , ,',knight:',,combat_helmet,sword,,,,crown',fire:',fire,flame,,fire,volcano,,sun',ice:'drops,,snowflakes,ice,,mountain,dragon,crown',
forest:',mushroom,grass,,tree,,,tree',shadow:',ghost,bat,skull,,,,crown',treasure:',,,key,,treasure_chest,diamond,crown',robots:'screw,,circuit,battery,robotic_arm,robot,,ai',
city:',tent,,house,building,,,city',vehicles:'tire,skateboard,bicycle,motorcycle,ferrari,formula_1,trian,rockets',candy:'sugar,bonbon,lollipop,cookie,donut,muffin,cake,',
'sea-quest':'seashell,compass,,anchor,canoe,ship,,treasure_chest'
};
const icons={
reference:'skull,lantern-flame,spider-mask,bat-mask,iron-mask,punch,super-mushroom,gauntlet',
avengers:'spider-web,bow-arrow,round-shield,iron-mask,panther,punch,thor-hammer,star-prominences',
justice:'bow-arrow,cyborg-face,trident,lightning-mask,lantern-flame,bat-mask,tiara,cape',
gotham:'domino-mask,bat-mask,domino-mask,cat,question-mark,double-face-mask,jester-hat,bat-mask',
planets:'moon,planet-core,earth-africa-europe,moon,ringed-planet,ringed-planet,ringed-planet,planet-core',
cosmos:'asteroid,moon,earth-africa-europe,sun,stars-stack,galaxy,star-swirl,galaxy',
'sun-life':'cloud-ring,star-formation,sun,sun-radiations,star-swirl,round-star',
'massive-star':'cloud-ring,star-formation,sun-radiations,sun,star-explosion,black-hole-bolas',
missions:'firework-rocket,rocket,artificial-satellite,satellite-communication,rocket-flight,space-station,space-probe,rocket-thruster',
moons:'moon,asteroid,asteroid,moon,moon,moon,moon,moon',
gems:'crystal-cluster,crystal-bars,crystal-growth,cut-diamond,crystal-shine,emerald,cut-diamond,diamond-hard',
butterfly:'eggs,caterpillar,chrysalis,butterfly',reef:'sea-anemone,coral,shrimp,crab,tropical-fish,sea-turtle,shark-fin,coral',ocean:'shrimp,crab,fish-normal,octopus,sea-turtle,dolphin,shark-fin,whale-tail',
dinosaurs:'velociraptor,velociraptor,ankylosaurus,stegosaurus-scales,triceratops-head,dinosaur-rex,t-rex-head,diplodocus',
garden:'plant-seed,sprout,leaf,flower-pot,flower-twirl,shiny-apple,oak,forest',weather:'water-drop,fog,cloud,raining,snowflake-1,lightning-bolt,tornado,rainbow',
fruit:'strawberry,cherry,peach,peach,peach,pear,shiny-apple,melon',berries:'berries,berries,raspberry,blackberry,strawberry,grapes',orchard:'cherry,peach,peach,peach,pear,shiny-apple',
harvest:'plant-seed,sprout,flower-twirl,shiny-apple,shiny-apple,fruit-bowl,wheat',
strings:'guitar,guitar,guitar,violin,violin,violin,violin,harp',winds:'whistle,flute,clarinet,clarinet,bassoon,trumpet,saxophone,tuba',
rhythm:'cymbal,tambourine,bongo,drum,drum,xylophone,kettle,drum-kit',orchestra:'flute,clarinet,violin,violin,trumpet,harp,grand-piano,pipe-organ',
dragon:'sparkles,dragon-egg,gecko,wyvern,dragon-breath,ice-dragon,dragon-head,dragon-spiral',wizard:'sparkles,apprentice,spell-book,round-potion,crystal-ball,crystal-wand,wizard-face,magic-swirl',
knight:'wooden-sword,shield,visored-helm,broadsword,knight-helmet,rally-the-troops,king,imperial-crown',fire:'ember-shot,sparkles,flame,torch,fireball,lava,phoenix,solar-power',
ice:'water-drop,snowflake-1,snowflake-2,ice-cube,crystal-cluster,iceberg,ice-dragon,ice-crown',forest:'spotted-mushroom,mushroom,grass,sprout,oak,ent,flower-hat,tree-face',
shadow:'shadow-follower,ghost,bat,skull,dark-squad,evil-book,spiked-dragon-head,queen-crown',treasure:'coins,coins,coins,key,money-stack,treasure-map,diamond-hard,imperial-crown',
robots:'screw,gears,circuitry,battery-100,mechanical-arm,robot-golem,mecha-head,artificial-intelligence',city:'brick-wall,camping-tent,hut,house,modern-city,skyscraper,castle,modern-city',
vehicles:'car-wheel,skateboard,bicycle,motorcycle,race-car,f1-car,speed-boat,rocket',candy:'sugar-cane,wrapped-sweet,lollipop,cookie,donut,cupcake,cake-slice,castle',
'sea-quest':'sea-shell,compass,treasure-map,anchor,rowboat,sailboat,pirate-skull,open-treasure-chest'
};
const aliases={'panther':'panther-head','punch':'punch-blast','thor-hammer':'thor-hammer','artificial-satellite':'satellite-communication','space-probe':'satellite-communication','chrysalis':'caterpillar','sea-anemone':'coral','shark-fin':'shark-fin','velociraptor':'velociraptor','ankylosaurus':'stegosaurus-scales','diplodocus':'diplodocus','cymbal':'drum','bongo':'bongo','xylophone':'xylophone','apprentice':'wizard-face','ice-dragon':'spiked-dragon-head','ice-crown':'queen-crown','sparkles':'sparkles','ember-shot':'ember-shot','cyborg-face':'cyborg-face'};
let cache={};try{cache=JSON.parse(await fs.readFile('artifacts/merge-cutout-cache.json','utf8'));}catch{}
const report=[];
async function getPng(slug){if(!slug||!category.has(slug))return null;if(cache[slug])return cache[slug];
 for(let n=0;n<4;n++){const src=`/merge-cutouts/${slug}-${n}.png`;try{await fs.access('public'+src);}catch{continue;}const alpha=await inspect(src);if(alpha&&alpha.clear>.15&&alpha.clear<.92&&alpha.edge<.2){cache[slug]={src,source:'https://pngimg.com'+category.get(slug),file:'PNGimg — '+slug,cutout:true,bounds:alpha.bounds};await fs.writeFile('artifacts/merge-cutout-cache.json',JSON.stringify(cache,null,2));return cache[slug];}}
 if(slug in cache)return null;let result=null;try{
 const source='https://pngimg.com'+category.get(slug);const r=await fetch(source,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(r.status);const html=await r.text();
 const urls=[...new Set(html.match(/https:\/\/pngimg.com\/uploads\/[^"\s<>]+\/small\/[^"\s<>]+\.png/g)||[])];
 for(const [index,url] of urls.slice(0,4).entries()){const src=`/merge-cutouts/${slug}-${index}.png`;try{await fs.access('public'+src);}catch{let rr=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!rr.ok)continue;await fs.writeFile('public'+src,Buffer.from(await rr.arrayBuffer()));}const alpha=await inspect(src);if(alpha&&alpha.clear>.2&&alpha.clear<.92&&alpha.edge<.2){result={src,source,file:'PNGimg — '+slug,cutout:true,bounds:alpha.bounds};break;}}
 }catch(e){report.push({slug,error:String(e.message)});}cache[slug]=result;await fs.writeFile('artifacts/merge-cutout-cache.json',JSON.stringify(cache,null,2));return result;}
Object.assign(aliases,{'skull':'death-skull','panther':'cat','question-mark':'uncertainty','star-explosion':'bright-explosion','space-station':'satellite','eggs':'egg-clutch','fish-normal':'tropical-fish','t-rex-head':'dinosaur-rex','leaf':'solid-leaf','cloud':'fluffy-cloud','lightning-bolt':'power-lightning','rainbow':'rainbow-star','melon':'watermelon','berries':'berries-bowl','blackberry':'raspberry','bongo':'drum','kettle':'drum','dragon-egg':'dinosaur-egg','wooden-sword':'broadsword','knight-helmet':'black-knight-helm','phoenix':'flame-wing','ent':'ent-mouth','skyscraper':'modern-city','bicycle':'dutch-bike','motorcycle':'aero-bike','lollipop':'spiral-lollipop','sea-shell':'spiral-shell','rowboat':'wood-canoe'});
const missing=new Set();for(const row of Object.values(icons))for(const name of row.split(','))if(!library.includes(name)&&!library.includes(aliases[name]))missing.add(name);
aliases.phoenix='flaming-claw';
console.log('Unavailable icon names:',[...missing].join(','));
// Stop before mutation if a curated icon is missing: no arbitrary substitute.
if(process.argv.includes('--names')){await browser.close();process.exit(0);}
const iconNames=[...new Set(Object.values(icons).flatMap(x=>x.split(',')).map(x=>library.includes(x)?x:aliases[x]).filter(Boolean))];
let iconData={};for(let i=0;i<iconNames.length;i+=40){const subset=iconNames.slice(i,i+40);const key='artifacts/merge-icons-'+i+'.json';let data;try{data=JSON.parse(await fs.readFile(key,'utf8'));}catch{data=await(await fetch('https://api.iconify.design/game-icons.json?icons='+subset.join(','))).json();await fs.writeFile(key,JSON.stringify(data));}Object.assign(iconData,data.icons);}
const chemical=new Set(['first-elements','noble-gases','alkali','halogens','metals']);
let replaced=0,kept=0;
for(const theme of MERGE_THEMES){let entries=[];for(const [i,stage] of theme.stages.entries()){
 const old=MERGE_IMAGES[theme.id]?.[i],a=audit[theme.id]?.[i];
 if(old&&a&&a.clear>.18&&a.edge<.12&&theme.id!=='missions'){entries.push({...old,cutout:true});kept++;continue;}
 let asset=await getPng(png[theme.id]?.split(',')[i]?.trim());
 if(!asset&&chemical.has(theme.id)){let symbol=stage.icon;const src=`/merge-cutouts/${theme.id}-${i}.svg`;await fs.writeFile('public'+src,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><text x="96" y="130" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="112" fill="${stage.color}" stroke="#ffffff" stroke-width="1">${symbol}</text></svg>`);asset={src,source:'https://periodic-table.rsc.org/',file:'Elementin standart kimyasal simgesi',cutout:true,artwork:'chemical-symbol'};}
 if(!asset){let name=icons[theme.id]?.split(',')[i];name=library.includes(name)?name:aliases[name];let icon=iconData[name];if(!icon)throw Error(`No matching asset: ${theme.id}/${i} ${name}`);const src=`/merge-cutouts/${theme.id}-${i}.svg`;const body=icon.body.replaceAll('currentColor',stage.color);await fs.writeFile('public'+src,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${body}</svg>`);asset={src,source:'https://game-icons.net/',file:'Game-icons.net contributors — CC BY 3.0',cutout:true,artwork:'illustration',icon:name};}
 entries.push({...asset,subject:stage.name});replaced++;
 }MERGE_IMAGES[theme.id]=entries;console.log(theme.id,entries.length);}
await fs.writeFile('src/merge-image-manifest.js','// Local transparent artwork; attribution is available in the theme sources.\nexport const MERGE_IMAGES='+JSON.stringify(MERGE_IMAGES,null,2)+';\n');
await fs.writeFile('artifacts/merge-cutout-report.json',JSON.stringify({replaced,kept,report},null,2));await browser.close();console.log({replaced,kept});
