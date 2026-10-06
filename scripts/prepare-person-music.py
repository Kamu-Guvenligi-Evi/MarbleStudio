"""Curated person associations. Historical fallback codes are musical/geographic
associations, not claims about modern citizenship. Existing country assignments stay intact.
"""
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8'))
def write(p,v):(ROOT/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
catalog=read('public/catalog/manifest.json')['items']
fallbacks={
 'athletes':'ar pt br fr no tr tr tr us us us us us us jm us ch es rs gb nl de'.split(),
 'celebrities':'us us bb us us gb co us us gb us us us ca tr tr tr tr tr tr tr us us ca us us us us us us'.split(),
 'politicians':'tr tr tr tr tr tr tr us us us ru ua fr de cn in br ar it kp tr tr cn'.split(),
 'history':'tr tr tr fr it gr mn eg gb us de rs gb pl it ir'.split(),
}
# Titles deliberately use a recognizable chant, meme, signature song or film theme.
choices={
 'Cristiano Ronaldo':('ronaldo','Cristiano Ronaldo — SIUU','Cristiano Ronaldo SIUU original sound effect',0,None),
 'Lionel Messi':('messi','Messi — Qué mirás, bobo','Messi que miras bobo anda pa alla original',0,None),
 'Neymar':('neymar','Michel Teló — Ai Se Eu Te Pego','Michel Telo Ai Se Eu Te Pego official audio',18,48),
 'Erling Haaland':('haaland','Haaland, Haaland — tezahürat','Haaland Haaland song DJ 11 official',0,32),
 'LeBron James':('lebron','LeBron — You Are My Sunshine','lebron james you are my sunshine meme song',0,30),
 'Michael Jordan':('jordan','Chicago Bulls — Sirius','The Alan Parsons Project Sirius official audio',30,65),
 'Max Verstappen':('verstappen','Super Max!','Pitstop Boys Super Max official audio',40,70),
 'Taylor Swift':('swift','Taylor Swift — Shake It Off','Taylor Swift Shake It Off official audio',38,68),
 'Beyoncé':('beyonce','Beyoncé — Single Ladies','Beyonce Single Ladies official audio',0,32),
 'Rihanna':('rihanna','Rihanna — Umbrella','Rihanna Umbrella official audio',59,89),
 'Ariana Grande':('grande','Ariana Grande — 7 rings','Ariana Grande 7 rings official audio',45,75),
 'Billie Eilish':('eilish','Billie Eilish — bad guy','Billie Eilish bad guy official audio',70,101),
 'Dua Lipa':('dua','Dua Lipa — Levitating','Dua Lipa Levitating official audio',30,60),
 'Lady Gaga':('gaga','Lady Gaga — Bad Romance','Lady Gaga Bad Romance official audio',0,32),
 'Michael Jackson':('jackson','Michael Jackson — Billie Jean','Michael Jackson Billie Jean official audio',0,34),
 'Freddie Mercury':('mercury','Queen — We Will Rock You','Queen We Will Rock You official audio',0,32),
 'Elvis Presley':('elvis','Elvis Presley — Jailhouse Rock','Elvis Presley Jailhouse Rock official audio',0,30),
 'Eminem':('eminem','Eminem — Without Me','Eminem Without Me official audio',0,32),
 'Snoop Dogg':('snoop','Dr. Dre & Snoop Dogg — The Next Episode','Dr Dre The Next Episode official audio',0,32),
 'The Weeknd':('weeknd','The Weeknd — Blinding Lights','The Weeknd Blinding Lights official audio',0,32),
 'Tarkan':('tarkan','Tarkan — Şımarık','Tarkan Simarik official audio',45,78),
 'Barış Manço':('manco','Barış Manço — Dönence','Baris Manco Donence official audio',0,32),
 'Ajda Pekkan':('ajda','Ajda Pekkan — Yakar Geçerim','Ajda Pekkan Yakar Gecerim official audio',60,92),
 'Sezen Aksu':('sezen','Sezen Aksu — Hadi Bakalım','Sezen Aksu Hadi Bakalim official audio',30,62),
 'Kemal Sunal':('sunal','Hababam Sınıfı — tema','Hababam Sinifi jenerik muzik Melih Kibar',0,32),
 'Tom Cruise':('cruise','Mission: Impossible — tema','Mission Impossible theme Lalo Schifrin original',0,32),
 'Johnny Depp':('depp',"Pirates of the Caribbean — He's a Pirate","Klaus Badelt Hes a Pirate soundtrack official",0,32),
 'Donald Trump':('trump','Village People — Y.M.C.A.','Village People YMCA official audio',45,77),
 'Vladimir Putin':('putin','Wide Putin — Song for Denise','Wide Putin walking song for denise meme',0,32),
 'Recep Tayyip Erdoğan':('erdogan','Dombra — Recep Tayyip Erdoğan','Ugur Isilak Dombra Recep Tayyip Erdogan official',40,72),
 'Kemal Kılıçdaroğlu':('kilicdaroglu','Kılıçdaroğlu — Geliyor Kılıçdar Kemal','Geliyor Kilicdar Kemal secim sarkisi',0,32),
 'Ekrem İmamoğlu':('imamoglu','İmamoğlu — Her Şey Çok Güzel Olacak','Her Sey Cok Guzel Olacak Imamoglu sarkisi',0,32),
 'Mustafa Kemal Atatürk':('ataturk','İzmir Marşı','Izmir Marsi Haluk Levent official',45,77),
 'Napolyon Bonapart':('napoleon','Napolyon — Amour plastique','Videoclub Amour plastique official audio',45,77),
 'Kim Jong Un':('kim','Kim Jong Un — Friendly Father','Friendly Father Kim Jong Un song',0,32),
 'Usain Bolt':('bolt','Jamaika Milli Marşı','Jamaica national anthem instrumental',0,None),
}
previous={r['code']:r for r in read('scripts/person-music-seed.json')} if (ROOT/'scripts/person-music-seed.json').exists() else {}
people=[];rows=[]
for category,codes in fallbacks.items():
 items=[i for i in catalog if i['category']==category]
 assert len(items)==len(codes),(category,len(items),len(codes))
 for item,code in zip(items,codes):
  entry={'entityId':item['id'],'name':item['name'],'category':category,'fallbackCountryCode':code,'fallbackCountryId':'countries-'+hashlib.sha1(code.encode()).hexdigest()[:10]}
  if item['name'] in choices:
   key,title,query,start,end=choices[item['name']]
   row={'code':key,'entityId':item['id'],'country':item['name'],'title':title,'query':query,'kind':'person','clipStartSeconds':start}
   if end is not None:row['clipEndSeconds']=end
   rows.append(previous.get(key,row));entry['trackId']='person-'+key
  elif item['name']=='Shakira':entry['trackId']='country-co'
  elif item['name']=='Mao Zedong':entry['trackId']='red-sun-in-the-sky'
  elif item['name']=='Cengiz Han':entry['trackId']='country-mn'
  people.append(entry)
write('scripts/person-music-seed.json',rows)
write('public/music/people.json',people)
