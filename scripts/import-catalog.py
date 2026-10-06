"""Download the curated image library and retain per-image source/credit metadata.
Run from the project root: python scripts/import-catalog.py
Existing downloads are reused; failed entries are reported and never published.
"""
import concurrent.futures, hashlib, html, json, re, time, urllib.parse, urllib.request, threading, sys, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public' / 'catalog'
DEST.mkdir(parents=True, exist_ok=True)
HEADERS = {'User-Agent': 'MarbleStudio/0.3 (local curated image library)'}
FILE_OVERRIDES={'Seljuk Empire':'Map of the Seljuk Empire (1092).png','Minecraft':'Minecraft game logo 2023.png','Fortnite':'FortniteLogo.svg','Dark Souls':'Dark Souls logo black.svg','Fall Guys':'Fall Guys cover.jpg'}
FILE_OVERRIDES.update(json.loads((ROOT/'scripts'/'catalog-files.json').read_text(encoding='utf-8')))
BRAND_OVERRIDES={'Porsche':'porsche','Turkish Airlines':'turkishairlines'}
sys.stdout.reconfigure(encoding='utf-8')
request_lock=threading.Lock()
last_request=0

def fetch(url, binary=False):
    global last_request
    for attempt in range(3):
        try:
            with request_lock:
                time.sleep(max(0,1.1-(time.monotonic()-last_request)))
                last_request=time.monotonic()
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=25) as r:
                data = r.read()
                return (data, r.headers.get('Content-Type', '')) if binary else json.loads(data)
        except Exception as error:
            if attempt == 2: raise
            time.sleep(30 if getattr(error,'code',0)==429 else 2 + attempt * 2)

def clean(value):
    return html.unescape(re.sub('<[^>]+>', '', value or '')).strip()

def download(spec):
    category, name, title = spec
    ident = category + '-' + hashlib.sha1(title.encode()).hexdigest()[:10]
    cached = DEST / (ident + '.json')
    if cached.exists():
        item = json.loads(cached.read_text(encoding='utf-8'))
        if (ROOT / 'public' / item['src'].lstrip('/')).exists() and item.get('fileOverride')==FILE_OVERRIDES.get(title) and item.get('brandSlug')==BRAND_OVERRIDES.get(title): return item
    try:
        item = dict(id=ident, category=category, name=name)
        if category == 'countries':
            url = 'https://flagcdn.com/w160/' + title + '.png'
            item.update(source='https://flagpedia.net/' + title, credit='Flagpedia / Flagcdn', license='Ülke bayrağı', licenseUrl='https://flagcdn.com/', fit='contain')
        elif title in BRAND_OVERRIDES:
            slug=BRAND_OVERRIDES[title];url='https://cdn.simpleicons.org/'+slug
            item.update(source='https://github.com/simple-icons/simple-icons/blob/develop/icons/'+slug+'.svg',credit='Simple Icons contributors',license='CC0-1.0 (icon file)',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',fit='contain',brandSlug=slug)
        else:
            if title in FILE_OVERRIDES:
                query=urllib.parse.urlencode(dict(action='query',format='json',titles='File:'+FILE_OVERRIDES[title],prop='imageinfo',iiprop='url',iiurlwidth=330))
                result=fetch('https://en.wikipedia.org/w/api.php?'+query)
                info=next(iter(result['query']['pages'].values()))['imageinfo'][0]
                asset=info['url'] if FILE_OVERRIDES[title].endswith('.svg') else info.get('thumburl',info['url'])
                summary={'thumbnail':{'source':asset},'originalimage':{'source':info['url']}}
            else:
                summary = fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + urllib.parse.quote(title.replace(' ', '_')))
            url = summary.get('thumbnail', {}).get('source')
            if not url: raise ValueError('No thumbnail')
            original = summary.get('originalimage', {}).get('source', url)
            image_path = urllib.parse.urlsplit(url).path
            filename = urllib.parse.unquote(image_path.split('/')[-2] if '/thumb/' in image_path else urllib.parse.urlsplit(original).path.rsplit('/', 1)[-1])
            host='commons.wikimedia.org' if '/commons/' in image_path else 'en.wikipedia.org'
            item.update(source='https://'+host+'/wiki/File:'+urllib.parse.quote(filename),
                        credit='Kaynak dosya sayfası',license='Kaynak koşullarına tabi',licenseUrl='',
                        fit='cover' if category in ['celebrities','politicians','athletes','history'] else 'contain')
        data, mime = fetch(url, True)
        if not mime.startswith('image/') or len(data) < 100: raise ValueError('Invalid image response: ' + mime)
        suffix = {'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/svg+xml':'.svg','image/gif':'.gif'}.get(mime.split(';')[0])
        if not suffix: raise ValueError('Unsupported image: ' + mime)
        path = DEST / (ident + suffix)
        path.write_bytes(data)
        item['src'] = '/catalog/' + path.name
        item['downloadUrl'] = url
        if title in FILE_OVERRIDES:item['fileOverride']=FILE_OVERRIDES[title]
        cached.write_text(json.dumps(item, ensure_ascii=False), encoding='utf-8')
        print('OK', category, title, flush=True)
        return item
    except Exception as error:
        print('FAILED', category, title, str(error), flush=True)
        return None

if __name__ == '__main__':
    groups = json.loads((ROOT / 'scripts' / 'catalog-seed.json').read_text(encoding='utf-8-sig'))
    specs = [(g['id'], row[0], row[1]) for g in groups for row in g['items']]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        items = [item for item in pool.map(download, specs) if item]
    catalog = dict(categories=[dict(id=g['id'], name=g['name']) for g in groups], items=items)
    (DEST / 'manifest.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
    print('PUBLISHED', len(items), '/', len(specs), flush=True)
    subprocess.run([sys.executable,str(ROOT/'scripts'/'catalog-maintenance.py')],check=True)
