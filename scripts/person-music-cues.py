"""Find hook timestamps; print times only, never store lyrics in the app."""
import concurrent.futures,json,urllib.request,urllib.parse,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
queries=[
 ('swift','Taylor Swift','Shake It Off','players gonna'),
 ('rihanna','Rihanna','Umbrella','under my umbrella'),
 ('grande','Ariana Grande','7 rings','want it, I got'),
 ('eilish','Billie Eilish','bad guy','tough guy'),
 ('dua','Dua Lipa','Levitating','you want me'),
 ('tarkan','Tarkan','Şımarık','takmış koluna'),
 ('ajda','Ajda Pekkan','Yakar Geçerim','yakar geçerim'),
 ('sezen','Sezen Aksu','Hadi Bakalım','hadi bakalım'),
 ('trump','Village People','Y.M.C.A.','fun to stay'),
 ('napoleon','Videoclub','Amour plastique','dans mon esprit'),
 ('verstappen','Pitstop Boys','Super Max!','super max'),
 ('neymar','Michel Teló','Ai Se Eu Te Pego','nossa'),
]
def find(q):
 key,artist,title,phrase=q
 url='https://lrclib.net/api/search?'+urllib.parse.urlencode({'artist_name':artist,'track_name':title})
 try:
  data=json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'MarbleStudio/0.2'}),timeout=20))
  result=[]
  for row in data:
   for line in (row.get('syncedLyrics') or '').splitlines():
    if phrase.casefold() in line.casefold():
     m=re.match(r'\[(\d+):(\d+(?:\.\d+)?)\]',line)
     if m:result.append({'id':row['id'],'duration':row.get('duration'),'start':int(m[1])*60+float(m[2])})
     break
  return key,result[:8]
 except Exception as e:return key,str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 result=dict(pool.map(find,queries))
 print(json.dumps(result,indent=2))
 (ROOT/'scripts/person-music-cues.json').write_text(json.dumps(result,indent=2)+'\n')
