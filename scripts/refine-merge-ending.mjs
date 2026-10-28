import fs from 'node:fs/promises';
const read=p=>fs.readFile(p,'utf8'),write=(p,s)=>fs.writeFile(p,s);
let s=await read('src/merge-evolution.js');
s=s.replace('MERGE_FINALE_SECONDS=3.2','MERGE_FINALE_SECONDS=1.9');
s=s.replace('level:a.level+1,x:', 'parents:[{...a},{...b}],level:a.level+1,x:');
s=s.replace("this.finalAt=this.time;this.outcome='final';this.event('final');", "this.finalAt=this.time;this.finalMerge={id:b.id,parents:birth.parents};this.outcome='final';this.event('final',{level:b.level});");
await write('src/merge-evolution.js',s);
s=await read('src/merge-evolution-renderer.js');
const start=s.indexOf('function finale('),end=s.indexOf('function emblem(',start);
s=s.slice(0,start)+`// Stay inside the arena: replay the final contact slowly, then hold the result.
function finalMerge(ctx,game,winner,age){
 const dissolve=unit(age/.55),ease=dissolve*dissolve*(3-2*dissolve);
 for(const parent of game.finalMerge?.parents??[]){
  const x=parent.x+(winner.x-parent.x)*ease,y=parent.y+(winner.y-parent.y)*ease;
  const radius=parent.r*(1-ease*.7);
  ctx.save();ctx.globalAlpha=1-ease;ctx.translate(x,y);ctx.rotate(parent.angle*(1-ease));
  ctx.drawImage(emblem(game.theme,parent.level),-radius,-radius,radius*2,radius*2);ctx.restore();
 }
 const appear=unit((age-.18)/.42),size=winner.r*(.55+.45*appear);
 ctx.save();ctx.globalAlpha=appear;ctx.translate(winner.x,winner.y);ctx.rotate(winner.angle);
 // The alpha silhouette supplies the light; there is no enclosing circle.
 ctx.shadowColor='#fff1bd';ctx.shadowBlur=28*Math.sin(appear*Math.PI);
 ctx.drawImage(emblem(game.theme,winner.level),-size,-size,size*2,size*2);ctx.restore();
}
`+s.slice(end);
s=s.replace("drawChannelTitle(ctx,channel,270,22,15);", `drawChannelTitle(ctx,channel,270,22,15);
 const age=game.finalAt===null?null:(game.time-game.finalAt)/game.settings.speed;
 const winner=age===null?null:game.balls.find(b=>b.id===game.finalMerge?.id);
 ctx.save();ctx.beginPath();ctx.rect(0,40,540,715);ctx.clip();
 if(winner){const zoom=1+.16*(1-(1-unit(age/.7))**3);ctx.translate(winner.x,winner.y);ctx.scale(zoom,zoom);ctx.translate(-winner.x,-winner.y);}`);
s=s.replace('for(const p of game.pulses){','for(const p of game.pulses){if(winner&&p.id===winner.id)continue;');
s=s.replace('for(const b of game.balls){ctx.save();', 'for(const b of game.balls){if(winner&&b.id===winner.id)continue;ctx.save();if(winner)ctx.globalAlpha=1-.25*unit(age/.5);');
s=s.replace("ctx.fillStyle='#fff';ctx.font='bold 23px Arial';", "if(winner)finalMerge(ctx,game,winner,age);ctx.restore();\n ctx.fillStyle='#fff';ctx.font='bold 23px Arial';");
s=s.replace(' if(game.finalAt!==null)finale(ctx,game);','');
await write('src/merge-evolution-renderer.js',s);
// Use the same short merge timbre with a stronger final accent.
for(const p of ['src/merge-evolution-app.js','src/merge-evolution-video.js']){
 s=await read(p);s=s.replace("new GameSoundPlayer('ball-multiplier')","new GameSoundPlayer('ball-multiplier','balanced',{win:'sparkle'})").replace("createGameSoundDirector('ball-multiplier')","createGameSoundDirector('ball-multiplier','balanced',{win:'sparkle'})");
 s=s.replace("['merge','final'].includes(e.type)","(e.type==='final'||(e.type==='merge'&&e.level<game.theme.stages.length-1))");
 await write(p,s);
}
console.log('In-arena ending applied.');
