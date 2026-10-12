"""Import NFL/NBA rosters and curated football clubs, retaining local logos and credits.
Run from the project root: python scripts/expand-team-catalog.py
Existing catalog categories, IDs, and downloaded artwork are preserved.
"""
import concurrent.futures
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding='utf-8')
sys.dont_write_bytecode=True
SOURCES=ROOT/'scripts/catalog-team-sources.json'
SEED=ROOT/'scripts/catalog-seed.json'
MANIFEST=ROOT/'public/catalog/manifest.json'
LEGACY_NBA=['Los Angeles Lakers','Chicago Bulls','Boston Celtics','Golden State Warriors']
FOOTBALL={
    'tur.1': [('789','Göztepe'),('11429','Samsunspor'),('7648','Konyaspor'),('7656','Çaykur Rizespor'),('6870','Kasımpaşa'),('20070','Gaziantep FK')],
    'eng.1': [('367','Tottenham Hotspur'),('361','Newcastle United'),('362','Aston Villa')],
    'esp.1': [('243','Sevilla'),('94','Valencia')],
    'ita.1': [('104','Roma'),('112','Lazio')],
    'ger.1': [('131','Bayer Leverkusen'),('11420','RB Leipzig')],
    'fra.1': [('176','Marseille'),('167','Lyon')],
    'por.1': [('2250','Sporting CP')],
    'bra.1': [('819','Flamengo'),('2029','Palmeiras'),('874','Corinthians'),('2674','Santos')],
    'arg.1': [('5','Boca Juniors'),('16','River Plate')],
}

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write(path,data):
    temporary=path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temporary.replace(path)

def teams(league):
    url='https://site.api.espn.com/apis/site/v2/sports/'+league+'/teams?limit=100'
    request=urllib.request.Request(url,headers={'User-Agent':'MarbleStudio/0.3'})
    with urllib.request.urlopen(request,timeout=30) as response:
        data=json.load(response)
    return [row['team'] for row in data['sports'][0]['leagues'][0]['teams']]

def main():
    sources=read(SOURCES)
    seed=read(SEED)
    football=next(g for g in seed if g['id']=='teams')
    groups=[dict(id='teams',name='Futbol Takımları',items=[row for row in football['items'] if row[1] not in LEGACY_NBA]),
            dict(id='nba',name='Basketbol · NBA',items=[]),dict(id='nfl',name='Amerikan Futbolu · NFL',items=[])]

    def add(group,team,name=None):
        title=team['displayName']
        if title in LEGACY_NBA:
            # Preserve the IDs referenced by old workspaces and legacy-image migration.
            sources[title]={'id':'teams-'+hashlib.sha1(title.encode()).hexdigest()[:10]}
            name='LA Lakers' if title=='Los Angeles Lakers' else title
        else:
            logo=next(logo for logo in team['logos'] if 'default' in logo['rel'])
            source=next(link['href'] for link in team['links'] if 'clubhouse' in link['rel'])
            sources[title]=dict(provider='espn',downloadUrl=logo['href'],source=source,
                credit='Team / league logo via ESPN',license='Takım ve lig marka haklarına / kaynak koşullarına tabi',
                licenseUrl='https://disneytermsofuse.com/english/',fit='contain')
        if not any(row[1]==title for row in group['items']):group['items'].append([name or title,title])

    for group,league,expected in [(groups[1],'basketball/nba',30),(groups[2],'football/nfl',32)]:
        roster=teams(league)
        if len(roster)!=expected:raise ValueError(f'{league}: expected {expected} teams, received {len(roster)}')
        for team in roster:add(group,team)
    for league,selection in FOOTBALL.items():
        roster={team['id']:team for team in teams('soccer/'+league)}
        for ident,name in selection:add(groups[0],roster[ident],name)
    write(SOURCES,sources)

    spec=importlib.util.spec_from_file_location('catalog_import',ROOT/'scripts/import-catalog.py')
    importer=importlib.util.module_from_spec(spec);spec.loader.exec_module(importer)
    jobs=[(group['id'],name,title) for group in groups for name,title in group['items']]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        items=list(pool.map(importer.download,jobs))
    if any(item is None for item in items):raise RuntimeError('Some logos failed; catalog publication cancelled. Run again to retry.')
    # Merge into the latest files so unrelated library additions are retained.
    seed=read(SEED);catalog=read(MANIFEST);ids={g['id'] for g in groups}
    index=next(i for i,g in enumerate(seed) if g['id']=='teams')
    seed=[g for g in seed if g['id'] not in ids];seed[index:index]=groups
    write(SEED,seed)
    index=next(i for i,g in enumerate(catalog['categories']) if g['id']=='teams')
    catalog['categories']=[g for g in catalog['categories'] if g['id'] not in ids]
    catalog['categories'][index:index]=[dict(id=g['id'],name=g['name']) for g in groups]
    catalog['items']=[item for item in catalog['items'] if item['category'] not in ids]+items
    order={group['id']:i for i,group in enumerate(catalog['categories'])}
    catalog['items'].sort(key=lambda item:order[item['category']])
    write(MANIFEST,catalog)
    print('PUBLISHED',', '.join(f"{g['name']}: {len(g['items'])}" for g in groups))

if __name__=='__main__':main()
