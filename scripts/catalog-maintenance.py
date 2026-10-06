"""Repair old source metadata and assemble a manifest from successful local imports."""
import importlib.util, json, urllib.parse
from pathlib import Path
spec=importlib.util.spec_from_file_location('importer',Path(__file__).with_name('import-catalog.py'))
imp=importlib.util.module_from_spec(spec);spec.loader.exec_module(imp)
files=list(imp.DEST.glob('*.json'))
repair=[]
for file in files:
    if not imp.re.fullmatch(r'[a-z]+-[a-f0-9]{10}\.json',file.name):continue
    item=json.loads(file.read_text(encoding='utf-8'))
    if item.get('generated'):continue
    if item['category']=='countries':
        item['source']=item['downloadUrl'];file.write_text(json.dumps(item,ensure_ascii=False),encoding='utf-8')
    if item['category']!='countries' and not item.get('brandSlug'):
        path=urllib.parse.urlsplit(item['downloadUrl']).path
        title='File:'+urllib.parse.unquote(path.split('/')[-2] if '/thumb/' in path else path.rsplit('/',1)[-1])
        if item['source'].endswith(urllib.parse.quote(title)) and item.get('licenseUrl'):continue
        repair.append((file,item,title.replace('_',' ')))
for start in range(0,len(repair),20):
    batch=repair[start:start+20]
    query=urllib.parse.urlencode(dict(action='query',format='json',titles='|'.join(i[2] for i in batch),prop='imageinfo',iiprop='extmetadata|url'))
    data=imp.fetch('https://en.wikipedia.org/w/api.php?'+query)
    pages={p['title']:p for p in data['query']['pages'].values()}
    for file,item,title in batch:
        info=pages.get(title,{}).get('imageinfo',[{}])[0];ext=info.get('extmetadata',{})
        field=lambda key:imp.clean(ext.get(key,{}).get('value',''))
        item.update(source=info.get('descriptionurl','https://en.wikipedia.org/wiki/'+urllib.parse.quote(title)),credit=field('Artist') or field('Credit') or 'Source file page',license=field('LicenseShortName') or field('UsageTerms') or 'See source terms',licenseUrl=field('LicenseUrl'))
        file.write_text(json.dumps(item,ensure_ascii=False),encoding='utf-8')
        print('CREDIT',item['name'],item['license'],flush=True)
groups=json.loads((imp.ROOT/'scripts'/'catalog-seed.json').read_text(encoding='utf-8-sig'))
items=[]
for group in groups:
    for name,title in group['items']:
        ident=group['id']+'-'+imp.hashlib.sha1(title.encode()).hexdigest()[:10]
        file=imp.DEST/(ident+'.json')
        if file.exists():items.append(json.loads(file.read_text(encoding='utf-8')))
catalog=dict(categories=[dict(id=g['id'],name=g['name']) for g in groups],items=items)
(imp.DEST/'manifest.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
print('ASSEMBLED',len(items),flush=True)
