export const VIDEO_CHANNELS=['LastBallStand','VortexBallSpiral'];

export function drawChannelWatermark(ctx,channel,width=540,height=960,color='#ffffff'){
  if(!VIDEO_CHANNELS.includes(channel))return;
  ctx.save();
  ctx.globalAlpha=.13;ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=color;ctx.shadowBlur=0;
  ctx.font=`700 ${width*.075}px "Segoe UI",sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(channel+'™',width/2,height*.52,width*.88);
  ctx.restore();
}

export function chooseVideoChannel(){
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');
    dialog.id='channel-choice';dialog.setAttribute('aria-labelledby','channel-choice-title');
    dialog.style='background:#111b2a;color:#eef6ff;border:1px solid #52657b;border-radius:18px;padding:28px;width:min(420px,90vw)';
    dialog.innerHTML=`<form method="dialog"><h2 id="channel-choice-title">Video hangi kanal için?</h2><p>Seçtiğin kanalın adı videonun arkasına saydam filigran olarak eklenir.</p><label>Kanal<select name="channel" required style="display:block;width:100%;margin:16px 0;padding:12px;background:#1d2b3d;color:#fff;border:1px solid #64758b;border-radius:8px"><option value="" selected disabled>Kanal seç…</option>${VIDEO_CHANNELS.map(name=>`<option>${name}</option>`).join('')}</select></label><button type="button" id="channel-choice-cancel" class="button secondary">İptal</button> <button type="submit" class="button primary">Devam et</button></form>`;
    let selected=null;
    dialog.querySelector('form').onsubmit=()=>{selected=dialog.querySelector('select').value;};
    dialog.querySelector('#channel-choice-cancel').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{dialog.remove();resolve(selected);},{once:true});
    document.body.append(dialog);dialog.showModal();
  });
}

export async function brandVideoOptions(options,getAccounts){
  const channel=await chooseVideoChannel();if(!channel)return null;
  const branded={...options,channel};
  if(options.youtube){
    const info=await getAccounts();
    const normalize=value=>String(value).toLowerCase().replace(/[^a-z0-9]/g,'');
    const account=info.accounts.find(a=>normalize(a.title)===normalize(channel));
    if(!account)throw new Error(channel+' YouTube hesabı bağlı değil. İçerik Atölyesi’nden bu kanalı bağla veya otomatik yüklemeyi kapat.');
    branded.youtube={...options.youtube,channelId:account.id};
  }
  return branded;
}
