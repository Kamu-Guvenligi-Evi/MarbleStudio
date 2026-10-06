"""Build local, sourced statistics datasets. Cached responses make reruns reproducible.
Use --refresh to fetch updated source snapshots. No dependencies beyond Python and Node.
"""
import csv
import datetime as dt
import io
import json
import math
from pathlib import Path
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from statistics_stories import build_stories

sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'scripts'/'statistics-cache'
OUT=ROOT/'public'/'statistics'
CACHE.mkdir(exist_ok=True);OUT.mkdir(exist_ok=True)
REFRESH='--refresh' in sys.argv

def fetch(name,url):
    path=CACHE/(name+'.json')
    if path.exists() and not REFRESH:
        saved=json.loads(path.read_text(encoding='utf-8'))
        if saved['url']==url:return saved
    for attempt in range(3):
        try:
            request=urllib.request.Request(url,headers={'User-Agent':'MarbleStudio/0.2 (educational statistics visualizer)'})
            with urllib.request.urlopen(request,timeout=45) as response:data=json.load(response)
            saved={'url':url,'retrievedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'data':data}
            path.write_text(json.dumps(saved,ensure_ascii=False),encoding='utf-8')
            return saved
        except Exception:
            if attempt==2:raise
            time.sleep(1+attempt)

def csv_text(names,frames):
    output=io.StringIO();writer=csv.writer(output,lineterminator='\n')
    writer.writerow(['Yıl',*names])
    for year,values in frames:writer.writerow([year,*[format(value,'.10f').rstrip('0').rstrip('.') if isinstance(value,float) else value for value in values]])
    return output.getvalue()

def write_dataset(item,names,frames):
    assert 2<=len(names)<=30 and 2<=len(frames)<=301
    assert all(len(values)==len(names) and all(math.isfinite(v) and v>=0 for v in values) for _,values in frames)
    path=OUT/(item['id']+'.csv');path.write_text(csv_text(names,frames),encoding='utf-8')
    item.update({'csv':'/statistics/'+path.name,'start':frames[0][0],'end':frames[-1][0],'entities':len(names),'rows':len(frames)})
    return item

# title, metric, beginning, display scale, unit, category, interpretation
SPECS=[
 ('population','Nüfus yarışı','SP.POP.TOTL',1960,1e6,'milyon kişi','Nüfus','Yıl ortası nüfus tahminleri.'),
 ('gdp','Ekonomilerin büyüklüğü','NY.GDP.MKTP.CD',1990,1e9,'milyar ABD doları','Ekonomi','Cari ABD dolarıyla nominal GSYİH. Enflasyon ve döviz kuru değişimlerini de içerir.'),
 ('gdp-per-capita','Kişi başına GSYİH','NY.GDP.PCAP.CD',1990,1,'ABD doları / kişi','Ekonomi','Cari ABD doları; kişi başına GSYİH, maaş veya hane geliri değildir.'),
 ('exports','Mal ve hizmet ihracatı','NE.EXP.GNFS.CD',1990,1e9,'milyar ABD doları','Ekonomi','Mal ve hizmet ihracatı, cari ABD doları.'),
 ('internet','İnternet kullanım oranı','IT.NET.USER.ZS',2000,1,'% nüfus','Teknoloji','İnternet kullanan bireylerin nüfusa oranı.'),
]

def world_bank():
    country_snapshot=fetch('countries','https://api.worldbank.org/v2/country?format=json&per_page=400')
    countries={item['id']:item for item in country_snapshot['data'][1] if item['region']['id']!='NA'}
    # Use the runtime's CLDR country names rather than translating API labels by hand.
    code="let s='';for await(const c of process.stdin)s+=c;const d=new Intl.DisplayNames(['tr'],{type:'region'});console.log(JSON.stringify(Object.fromEntries(JSON.parse(s).map(([id,iso])=>[id,d.of(iso)]))))"
    result=subprocess.run(['node','--input-type=module','-e',code],input=json.dumps([[key,v['iso2Code']] for key,v in countries.items()]),capture_output=True,text=True,encoding='utf-8',check=True)
    names=json.loads(result.stdout)
    def build(spec):
        id,title,indicator,start,scale,unit,category,definition=spec
        url=f'https://api.worldbank.org/v2/country/all/indicator/{indicator}?date={start}:2025&format=json&per_page=20000'
        snapshot=fetch(indicator,url);response=snapshot['data']
        if not isinstance(response,list) or len(response)!=2 or response[0].get('pages')!=1:raise ValueError(f'Incomplete API response: {indicator}')
        series={}
        for row in response[1]:
            country=row['countryiso3code'];value=row['value']
            if country not in countries or not isinstance(value,(float,int)) or not math.isfinite(value) or value<0:continue
            series.setdefault(country,{})[int(row['date'])]=value
        # Do not silently use very sparse latest-year data as a worldwide ranking.
        end=max(year for year in range(2020,2026) if sum(year in values for values in series.values())>=80)
        eligible=[country for country,values in series.items() if all(year in values for year in range(start,end+1))]
        if len(eligible)<15:raise ValueError(f'Too few complete series: {indicator}: {len(eligible)}')
        selected=sorted(eligible,key=lambda country:(-series[country][end],country))[:30]
        turkey='TUR' in eligible
        if turkey and 'TUR' not in selected:selected[-1]='TUR'
        frames=[(year,[series[country][year]/scale for country in selected]) for year in range(start,end+1)]
        note=f'{definition} {start}–{end} boyunca her yıl verisi bulunan {len(eligible)} ülke/ekonomi içinden son yıl değeri yüksek 30 ülke/ekonomi seçildi.'
        if turkey:note+=' Türkiye kadroya dahil edildi.'
        note+=' Sabit kadro içindeki sıralamadır; tüm dünyanın eksiksiz sıralaması değildir. Eksik yıllar doldurulmadı. Çubukların ara yıl hareketi görsel interpolasyondur.'
        item=write_dataset({'id':id,'title':title,'category':category,'unit':unit,'source':'Dünya Bankası · Seçili 30 ülke/ekonomi · '+indicator,'sources':[{'title':'Dünya Bankası: gösterge ve kaynakları','url':'https://data.worldbank.org/indicator/'+indicator},{'title':'İndirilen veri API adresi','url':url}],'license':'CC BY 4.0','retrievedAt':snapshot['retrievedAt'],'updated':response[0].get('lastupdated'),'note':note,'interpolation':'linear','countryCodes':selected,'indicator':indicator,'scale':scale},[names[country] for country in selected],frames)
        print(f'{id}: {start}-{end}, {len(selected)} entities',flush=True)
        return item
    with ThreadPoolExecutor(max_workers=3) as pool:return list(pool.map(build,SPECS))

def football():
    seed=json.loads((ROOT/'scripts'/'statistics-football.json').read_text(encoding='utf-8'))
    clubs=list(seed['winners'])
    seasons={year:club for club,years in seed['winners'].items() for year in years}
    assert len(seasons)==sum(len(years) for years in seed['winners'].values())
    assert sorted(seasons)==list(range(1956,2027))
    result=[]
    for id,title,start in [('european-cup','Avrupa Kupası / Şampiyonlar Ligi',1956)]:
        selected=[club for club in clubs if any(year>=start for year in seed['winners'][club])]
        frames=[(year,[sum(start<=won<=year for won in seed['winners'][club]) for club in selected]) for year in range(start,2027)]
        result.append(write_dataset({'id':id,'title':title,'category':'Futbol','unit':'şampiyonluk','source':'UEFA · sezon sonu toplam şampiyonluk','sources':seed['sources'],'retrievedAt':seed['verifiedAt'],'license':'UEFA kaynaklı olgusal sonuçlardan türetilmiş tablo','interpolation':'step','note':f'{start}–2026 sezon bitiş yıllarına göre birikimli kupa sayısı. '+('1955/56 Avrupa Şampiyon Kulüpler Kupası dahil.' if start==1956 else 'Yalnızca 1992/93 sezonundan başlayan Şampiyonlar Ligi dönemi; önceki kupalar sayılmaz.')+' Değerler yıl geçişinde tam sayı olarak güncellenir.'},selected,frames))
    return result

if __name__=='__main__':
    base_items=football()+world_bank()
    items=build_stories(CACHE,write_dataset,REFRESH)+base_items
    manifest={'version':1,'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'items':items}
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Built {len(items)} local datasets.')
