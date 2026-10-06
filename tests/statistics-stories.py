"""Audit generated series against independently read raw source snapshots."""
import csv
import json
import math
from collections import Counter,defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'scripts'/'statistics-cache'
items={item['id']:item for item in json.loads((ROOT/'public/statistics/manifest.json').read_text(encoding='utf-8'))['items']}
def read(item):
    rows=list(csv.reader((ROOT/'public'/item['csv'].lstrip('/')).open(encoding='utf-8')))
    return rows[0][1:],{int(row[0]):list(map(float,row[1:])) for row in rows[1:]}

for id in ['super-lig','f1-wins','space-race','electric-cars','tourism-shock']:
    item=items[id];names,frames=read(item);proof=item['provenance']
    assert len(names)==item['entities']<=30 and len(frames)==item['rows']
    assert sorted(frames)==list(range(item['start'],item['end']+1))
    assert len({tuple(values) for values in frames.values()})>5, 'A race needs changing data'
    if proof['kind']=='season-winners':
        for year,values in frames.items():
            assert sum(values)==year-1958
            expected=Counter(winner for season,winner in proof['seasons'].items() if int(season)<=year)
            assert values==[expected[name] for name in names]
        final=dict(zip(names,frames[2026]))
        assert final=={'Fenerbahçe':19,'Beşiktaş':14,'Galatasaray':26,'Trabzonspor':7,'Bursaspor':1,'Başakşehir':1}
    elif proof['kind']=='f1-winners':
        results=set();wins=defaultdict(Counter);races=set()
        for path in CACHE.glob('f1-winners-*.json'):
            if '.source.' in path.name:continue
            for race in json.loads(path.read_text())['MRData']['RaceTable']['Races']:
                year=int(race['season']);round=int(race['round'])
                for result in race['Results']:
                    driver=result['Driver']['driverId'];key=(year,round,driver)
                    assert key not in results;results.add(key)
                    if year<=2025:wins[year][driver]+=1;races.add((year,round))
        assert len(races)==1149
        total=Counter()
        for year,values in frames.items():
            total.update(wins[year]);assert values==[total[key] for key in proof['driverIds']]
            assert max(values)==max(total.values()),'Historical leaders must remain in roster'
        final=dict(zip(names,frames[2025]))
        assert final['Lewis Hamilton']==105 and final['Michael Schumacher']==91 and final['Max Verstappen']==71
    else:
        source=defaultdict(dict)
        for row in csv.DictReader((CACHE/(proof['slug']+'.csv')).open(encoding='utf-8')):
            if row[proof['column']]:source[row['Code']][int(row['Year'])]=float(row[proof['column']])
        for year,values in frames.items():
            for index,code in enumerate(proof['codes']):
                expected=sum(source[code].get(y,0) for y in range(item['start'],year+1)) if proof['cumulative'] else source[code][year]
                assert math.isclose(values[index],expected/proof['scale'],rel_tol=1e-9,abs_tol=1e-7),(id,year,code)
        if id=='tourism-shock':
            assert sum(frames[2020])<sum(frames[2019])*.5,'Pandemic break must be present in source data'
        if id=='electric-cars':assert 'TUR' in proof['codes']
    print(f'PASS: {id}, {len(frames)} years, {len(names)} competitors; every value checked.')
