"""Reproducible race datasets assembled from event records and source series."""
import csv
import datetime as dt
import html
import json
import re
import subprocess
import urllib.request
from collections import Counter


def build_stories(cache, write_dataset, refresh=False):
    def raw(name, url):
        path=cache/name
        if refresh or not path.exists():
            request=urllib.request.Request(url,headers={'User-Agent':'MarbleStudio/0.2'})
            with urllib.request.urlopen(request,timeout=45) as response: data=response.read()
            path.write_bytes(data)
            (cache/(name+'.source.json')).write_text(json.dumps({'url':url,'retrievedAt':dt.datetime.now(dt.timezone.utc).isoformat()}),encoding='utf-8')
        return path.read_bytes()

    def item(id,title,category,unit,source,url,story,note,entity_label='ülke',**extra):
        return {'id':id,'title':title,'category':category,'unit':unit,'source':source,
                'sources':[{'title':source,'url':url}],
                'retrievedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
                'license':'Kaynak sağlayıcının kullanım koşulları; kaynak bağlantısına bakın.',
                'interpolation':'step','story':story,'note':note,'entityLabel':entity_label,
                'featured':True,**extra}

    # Count actual season winners instead of entering a final trophy table.
    tff_url='https://www.tff.org/default.aspx?pageID=545'
    page=raw('tff-champions.html',tff_url).decode('windows-1254')
    text=re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',page)))
    block=text.split('Süper Lig Şampiyonlukları',1)[1].split('Süper Lig Şampiyonluk Sayıları',1)[0]
    clubs={'FENERBAHÇE':'Fenerbahçe','BEŞİKTAŞ':'Beşiktaş','GALATASARAY':'Galatasaray','TRABZONSPOR':'Trabzonspor','BURSASPOR':'Bursaspor','MEDİPOL BAŞAKŞEHİR':'Başakşehir'}
    seasons={int(end or start):clubs[club] for start,end,club in re.findall(r'(\d{4})(?:\s*-\s*(\d{4}))?\s*('+'|'.join(clubs)+r')',block)}
    assert sorted(seasons)==list(range(1959,max(seasons)+1))
    names=list(clubs.values())
    frames=[(year,[sum(winner==name for season,winner in seasons.items() if season<=year) for name in names]) for year in sorted(seasons)]
    league=write_dataset(item('super-lig','Süper Lig: kupa yarışı','Futbol','şampiyonluk','TFF · Süper Lig sezon şampiyonları',tff_url,
        'Fenerbahçe’nin başlangıcı, Trabzonspor’un çıkışı, Galatasaray’ın yükselişi.',
        '1959’dan başlayan lig sezonlarının birikimli şampiyonlukları. Yıl, sezonun bittiği yıldır. Beşiktaş’ın yıldız hesabına eklenen 1957 ve 1958 Federasyon Kupaları bu dönem dışında; burada ligde kazanılan 14 kupa gösterilir. Her sezon bir kupa eklenir.',
        'kulüp',provenance={'kind':'season-winners','cache':'tff-champions.html','seasons':seasons}),names,frames)
    league['retrievedAt']=json.loads((cache/'tff-champions.html.source.json').read_text())['retrievedAt']

    # Driver victories: include shared wins for each credited driver, never sprint wins.
    base='https://api.jolpi.ca/ergast/f1/results/1.json?limit=100&offset='
    first=json.loads(raw('f1-winners-0.json',base+'0'))['MRData']
    races={}; result_keys=set()
    for offset in range(0,int(first['total']),100):
        payload=first if offset==0 else json.loads(raw(f'f1-winners-{offset}.json',base+str(offset)))['MRData']
        assert int(payload['offset'])==offset
        for race in payload['RaceTable']['Races']:
            season,round=int(race['season']),int(race['round'])
            for result in race['Results']:
                driver=result['Driver'];key=(season,round,driver['driverId'])
                assert key not in result_keys,'Duplicate race result across API pages'
                result_keys.add(key)
                if season<=2025:races.setdefault(season,[]).append(driver)
    assert len(result_keys)==int(first['total'])
    assert sorted(races)==list(range(1950,2026))
    counts=Counter();driver_names={};history={};leaders=set()
    for year in sorted(races):
        for driver in races[year]:
            key=driver['driverId'];counts[key]+=1
            driver_names[key]=driver['givenName']+' '+driver['familyName']
        history[year]=dict(counts)
        leaders.update(key for key,value in counts.items() if value==max(counts.values()))
    selected=list(leaders)
    for key,_ in counts.most_common():
        if key not in selected and len(selected)<30:selected.append(key)
    selected.sort(key=lambda key:(-counts[key],driver_names[key]))
    f1=write_dataset(item('f1-wins','Formula 1: galibiyet rekoru','Motor sporları','galibiyet','Jolpica / Ergast · F1 yarış sonuçları','https://api.jolpi.ca/ergast/f1/',
        'Fangio’dan Schumacher’e, Hamilton’a uzanan rekor yarışı.',
        '1950–2025 sezon sonu birikimli Dünya Şampiyonası yarış galibiyetleri. Sprintler hariç; takvime dahil Indianapolis 500 yarışları ve ortak galibiyetlerde her kazanan pilotun tam galibiyeti dahildir. Bütün tarihsel liderler ve toplamı en yüksek pilotlardan 30 kişilik sabit kadro seçildi. Sadece tamamlanan 2025 sezonuna kadar hesaplandı.',
        'pilot',provenance={'kind':'f1-winners','totalResults':len(result_keys),'driverIds':selected,'cutoff':2025}),
        [driver_names[key] for key in selected],[(year,[history[year].get(key,0) for key in selected]) for year in history])
    f1['sources'].append({'title':'Formula 1 · 2026 öncesi Hamilton 105 galibiyet doğrulaması','url':'https://www.formula1.com/en/latest/article/drivers-%20teams-cars-circuits-and-more-everything-you-need-to-%20know-about.7iQfL3Rivf1comzdqV5jwc'})
    f1['retrievedAt']=json.loads((cache/'f1-winners-0.json.source.json').read_text())['retrievedAt']

    country_data=json.loads((cache/'countries.json').read_text(encoding='utf-8'))['data'][1]
    codes={country['id']:country['iso2Code'] for country in country_data if country['region']['id']!='NA'}
    code="let s='';for await(const c of process.stdin)s+=c;const d=new Intl.DisplayNames(['tr'],{type:'region'});console.log(JSON.stringify(Object.fromEntries(JSON.parse(s).map(([id,iso])=>[id,d.of(iso)]))))"
    labels=json.loads(subprocess.run(['node','--input-type=module','-e',code],input=json.dumps(list(codes.items())),capture_output=True,text=True,encoding='utf-8',check=True).stdout)

    def owid(slug,id,title,category,unit,source,story,note,start,end,scale=1,cumulative=False):
        url='https://ourworldindata.org/grapher/'+slug
        rows=list(csv.DictReader(raw(slug+'.csv',url+'.csv').decode('utf-8').splitlines()))
        metadata=json.loads(raw(slug+'.metadata.json',url+'.metadata.json'))
        column=list(rows[0])[3];series={}
        for row in rows:
            country=row['Code'];year=int(row['Year'])
            if country in labels and row[column] and start<=year<=end:
                value=float(row[column]);assert value>=0
                assert year not in series.setdefault(country,{})
                series[country][year]=value
        if cumulative:
            # UNOOSA is an event register. No row means no registered object in that year,
            # not proof that no object existed. Preserve this distinction in the UI.
            for country,values in series.items():
                total=0
                for year in range(start,end+1):total+=values.get(year,0);values[year]=total
        else:
            series={key:values for key,values in series.items() if all(year in values for year in range(start,end+1))}
        assert len(series)>=10
        # Preserve historical leaders; avoid selecting only today's successful countries.
        chosen=set()
        for year in range(start,end+1):
            chosen.update(sorted(series,key=lambda key:(-series[key][year],key))[:3])
        chosen.update(sorted(series,key=lambda key:(-series[key][end],key))[:15])
        if 'TUR' in series:chosen.add('TUR')
        assert len(chosen)<=30
        chosen=sorted(chosen,key=lambda key:(-series[key][end],key))
        names=[('SSCB / Rusya' if cumulative and key=='RUS' else labels[key]) for key in chosen]
        details=' Seçim: dönem içindeki her yılın ilk üçü, son yılın ilk 15’i ve uygun verisi varsa Türkiye. Sabit kadro içindeki karşılaştırmadır; bütün ülkeleri kapsamaz.'
        if not cumulative:details+=' Yalnızca bütün yılları mevcut ülkeler seçildi; eksik değerler doldurulmadı.'
        record=item(id,title,category,unit,source,url,story,note+details,provenance={'kind':'owid','slug':slug,'column':column,'codes':chosen,'scale':scale,'cumulative':cumulative},countryCodes=chosen)
        record['retrievedAt']=json.loads((cache/(slug+'.csv.source.json')).read_text())['retrievedAt']
        record['updated']=metadata['columns'][column].get('lastUpdated')
        record['sources'].append({'title':'İndirilen kaynak CSV','url':url+'.csv'})
        return write_dataset(record,names,[(year,[series[key][year]/scale for key in chosen]) for year in range(start,end+1)])

    space=owid('yearly-number-of-objects-launched-into-outer-space','space-race','Uzay yarışı: yörüngeye çıkanlar','Uzay','kayıtlı nesne',
        'UNOOSA · Our World in Data','Soğuk Savaş rekabetinden uydu patlamasına.',
        '1957–2025 boyunca uzaya gönderilen kayıtlı nesnelerin birikimli sayısıdır; roket fırlatma veya halen çalışan uydu sayısı değildir. Kaynak olay dökümünde satırı olmayan yılda yeni kayıt yok kabul edildi. BM kaydı bütün nesneleri kapsamaz (yaklaşık %88). Atıf sipariş veren ülkeyedir; ortak görevler birden fazla ülkede sayılabilir. Kaynağın Rusya serisi Sovyet dönemini de içerir; SSCB / Rusya adıyla gösterilir.',1957,2025,cumulative=True)
    ev=owid('electric-car-sales','electric-cars','Elektrikli otomobil yarışı','Otomotiv','bin otomobil',
        'IEA Global EV Outlook · Our World in Data','Çin’in yükselişi ve Türkiye’nin pazara girişi.',
        '2015–2025 yıllık yeni elektrikli otomobil satışları; tam bataryalı ve fişli hibrit araçlar dahildir. Normal hibritler, üretim ve trafikteki toplam araç sayısı değildir. IEA kaynak değerleri yuvarlatılmış olabilir.',2015,2025,1000)
    tourism=owid('international-tourist-trips','tourism-shock','Turizm: pandemi kırılması','Seyahat','milyon ziyaret',
        'UN Tourism · Our World in Data','Turizmde yükseliş, ardından 2020’de sert düşüş.',
        '1995–2020 tarihsel penceresi: turizm yarışı ve pandeminin ilk yılındaki kırılma. Güncel turizm sıralaması değildir. Uluslararası ziyaret varışlarıdır; aynı kişinin farklı seyahatleri ayrı sayılır. Ülkelerin sayım yöntemleri farklı olabilir; ABD serisinde 2006 öncesi/sonrası günlük ziyaret kapsamı değişir.',1995,2020,1e6)
    return [league,f1,space,ev,tourism]
