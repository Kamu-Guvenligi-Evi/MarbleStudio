export const STATISTICS_KEY='marble-studio-statistics-v1';
export const DEMO_CSV=`Yıl,Atlas,Nova,Vega,Orion,Luna,İris,Aras,Mira,Pera,Ada
2000,90,62,78,45,32,57,25,38,20,12
2005,105,98,88,67,52,63,42,45,28,22
2010,122,145,103,95,85,75,69,58,40,34
2015,138,172,125,155,119,102,90,78,65,52
2020,159,205,160,194,236,144,117,106,95,79
2025,185,258,211,230,312,275,158,142,135,118`;

// CSV supports quoted names, escaped quotes, CRLF and semicolon-delimited spreadsheets.
function csvRows(text) {
  const first=text.split(/\r?\n/,1)[0];
  let delimiter=',',inQuotes=false;
  for(let i=0;i<first.length;i++){
    if(first[i]==='"'){if(inQuotes&&first[i+1]==='"'){i++;continue;}inQuotes=!inQuotes;}
    else if(!inQuotes&&[',',';'].includes(first[i])){delimiter=first[i];break;}
  }
  const rows=[];let row=[],field='',quoted=false,closed=false;
  const add=()=>{row.push(field.trim());field='';closed=false;};
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(quoted) {
      if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}
      else field+=c;
    }else if(c===delimiter){add();}
    else if(c==='\n'||c==='\r') {
      if(c==='\r'&&text[i+1]==='\n')i++;
      add();if(row.some(Boolean))rows.push(row);row=[];
    }else if(c==='"'&&!field&&!closed){quoted=true;}
    else if(closed&&!/\s/.test(c)){throw new Error('CSV tırnaklarını ve sütun ayraçlarını kontrol et.');}
    else if(!closed)field+=c;
  }
  if(quoted)throw new Error('CSV içinde kapanmamış tırnak var.');
  add();if(row.some(Boolean))rows.push(row);
  return {rows,delimiter};
}

export function parseStatistics(text) {
  if(typeof text!=='string'||text.length>300000)throw new Error('CSV en fazla 300 KB olabilir.');
  const {rows,delimiter}=csvRows(text.replace(/^\uFEFF/,''));
  if(rows.length<2||rows.length>302)throw new Error('Başlığın altında 1–301 farklı yıl satırı olmalı.');
  const [header,...body]=rows,names=header.slice(1);
  if(!['yıl','yil','year'].includes(header[0].toLocaleLowerCase('tr-TR')))throw new Error('İlk sütunun başlığı Yıl olmalı.');
  if(names.length<2||names.length>30)throw new Error('2–30 yarışmacı sütunu ekle.');
  if(names.some(name=>!name||name.length>32||/[\r\n]/.test(name)))throw new Error('Yarışmacı adları 1–32 karakter ve tek satır olmalı.');
  if(new Set(names.map(name=>name.toLocaleLowerCase('tr-TR'))).size!==names.length)throw new Error('Her yarışmacının adı farklı olmalı.');
  const years=new Set();
  const frames=body.map((row,index)=>{
    if(row.length!==header.length)throw new Error(`${index+2}. satırda sütun sayısı başlıkla aynı olmalı.`);
    if(!/^\d{1,4}$/.test(row[0]))throw new Error(`${index+2}. satırdaki yıl geçersiz.`);
    const year=Number(row[0]);
    if(year<1||years.has(year))throw new Error('Yıllar 1–9999 arasında ve birbirinden farklı olmalı.');
    years.add(year);
    const values=row.slice(1).map(value=>{
      const normalized=delimiter===';'?value.replace(',','.'):value;
      if(!/^\d+(\.\d+)?$/.test(normalized)||!Number.isFinite(Number(normalized))||Number(normalized)>1e15)throw new Error(`${year} yılında eksik veya geçersiz değer var. 0–1 katrilyon arasında sayı kullan; binlik ayıracı ekleme.`);
      return Number(normalized);
    });
    return {year,values};
  }).sort((a,b)=>a.year-b.year);
  return {names,frames};
}

export function statisticsAt(data,year,interpolation='linear') {
  const frames=data.frames;
  const bounded=Math.max(frames[0].year,Math.min(frames.at(-1).year,year));
  let right=frames.findIndex(frame=>frame.year>=bounded);
  if(right<0)right=frames.length-1;
  const to=frames[right],from=frames[Math.max(0,right-1)];
  if(interpolation==='step'){
    const frame=bounded===to.year?to:from;
    return data.names.map((name,id)=>({id,name,value:frame.values[id]})).sort((a,b)=>b.value-a.value||a.id-b.id);
  }
  const fraction=to.year===from.year?0:(bounded-from.year)/(to.year-from.year);
  return data.names.map((name,id)=>({id,name,value:from.values[id]+(to.values[id]-from.values[id])*fraction})).sort((a,b)=>b.value-a.value||a.id-b.id);
}
