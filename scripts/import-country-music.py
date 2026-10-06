"""Resolve/import curated country music. Requires yt-dlp, imageio-ffmpeg, mutagen.

python scripts/import-country-music.py --tools-directory C:/tmp/marble-media-tools --resolve
Review country-music-seed.json, then run with --import-audio. Existing files are reused.
"""
import argparse, concurrent.futures, hashlib, json, subprocess, sys, urllib.parse
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SEED=ROOT/'scripts/country-music-seed.json'

def read(path):return json.loads(path.read_text(encoding='utf-8'))
def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--tools-directory');parser.add_argument('--resolve',action='store_true')
    parser.add_argument('--import-audio',action='store_true');parser.add_argument('--codes',default='')
    parser.add_argument('--workers',type=int,default=3)
    parser.add_argument('--seed',default=str(SEED));parser.add_argument('--prefix',default='country-')
    args=parser.parse_args()
    if args.tools_directory:sys.path.insert(0,args.tools_directory)
    import yt_dlp,imageio_ffmpeg
    from mutagen.mp3 import MP3
    sys.stdout.reconfigure(encoding='utf-8')
    seed=Path(args.seed)
    rows=read(seed);selected=[r for r in rows if not args.codes or r['code'] in args.codes.split(',')]
    cache=Path.home()/'AppData/Local/Temp/MarbleStudio-Music-Import';cache.mkdir(parents=True,exist_ok=True)
    class Logger:
        def debug(self,message):pass
        def warning(self,message):pass
        def error(self,message):print('SOURCE ERROR',message,flush=True)
    base={'quiet':True,'noprogress':True,'noplaylist':True,'logger':Logger(),'socket_timeout':25,'retries':2,'js_runtimes':{'node':{}}}
    def resolve(row):
        if row.get('source'):return row
        with yt_dlp.YoutubeDL({**base,'extract_flat':True}) as ydl:
            entries=ydl.extract_info('ytsearch3:'+row['query'],download=False)['entries']
        choices=[e for e in entries if e.get('duration') and 2<=e['duration']<=600 and not e.get('is_live')]
        if not choices:raise ValueError('No suitable result: '+row['code'])
        choice=choices[0]
        return {**row,'source':'https://www.youtube.com/watch?v='+choice['id'],'sourceTitle':choice['title'],'sourceDuration':choice['duration'],'uploader':choice.get('uploader'),'candidates':[{'title':e['title'],'id':e['id'],'duration':e.get('duration')} for e in choices]}
    if args.resolve:
        updated={}
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            tasks={pool.submit(resolve,row):row for row in selected}
            for task in concurrent.futures.as_completed(tasks):
                row=tasks[task]
                try:
                    result=task.result();updated[row['code']]=result
                    print('FOUND',row['code'],result['sourceTitle'],result['source'],flush=True)
                except Exception as error:print('FAILED',row['code'],str(error),flush=True)
        rows=[updated.get(row['code'],row) for row in rows];write(seed,rows)
    if not args.import_audio:return
    selected=[r for r in rows if (not args.codes or r['code'] in args.codes.split(',')) and r.get('source')]
    dest=ROOT/'public/music';ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    known_sources={t['source']:t for t in read(dest/'manifest.json')}
    def download(row):
        ident=args.prefix+row['code'];metadata=cache/(ident+'.json')
        start=row.get('clipStartSeconds',0);end=row.get('clipEndSeconds')
        version='-'+hashlib.sha1(json.dumps([row['source'],start,end]).encode()).hexdigest()[:8] if start or end is not None else ''
        output=dest/(ident+version+'.mp3')
        if output.exists() and metadata.exists():
            previous=read(metadata)
            if previous.get('source')==row['source'] and previous.get('trimStartSeconds',0)==start and previous.get('clipEndSeconds')==end:
                return {**previous,'title':row['title'],'countryName':row['country']}
        opts={**base,'format':'bestaudio/best','outtmpl':str(cache/'%(id)s.%(ext)s')}
        video_id=urllib.parse.parse_qs(urllib.parse.urlsplit(row['source']).query).get('v',[''])[0]
        originals=[cache/(video_id+ext) for ext in ['.webm','.m4a','.mp4'] if video_id and (cache/(video_id+ext)).exists()]
        known=known_sources.get(row['source'],{})
        if originals and (known or row.get('sourceDuration')):
            original=str(originals[0]);info={'title':known.get('sourceTitle',row.get('sourceTitle',row['title'])),'uploader':known.get('uploader',row.get('uploader')),'duration':known.get('sourceDurationSeconds') or row.get('sourceDuration')}
        else:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info=ydl.extract_info(row['source'],download=True);original=ydl.prepare_filename(info)
        command=[ffmpeg,'-v','error','-y','-i',original,'-vn']
        if start or end is not None:
            if end is not None and (end<=start or end>(info.get('duration') or end)+1):raise ValueError('Invalid excerpt bounds: '+row['code'])
            command+=['-af',f'atrim=start={start}'+(f':end={end}' if end is not None else '')+',asetpts=PTS-STARTPTS']
        command+=['-c:a','libmp3lame','-b:a','160k','-map_metadata','-1',str(output)]
        subprocess.run(command,check=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        length=MP3(output).info.length;seconds=round(length)
        result={'id':ident,'title':row['title'],'artist':'Yükleyen: '+(info.get('uploader') or ''),'src':'/music/'+output.name,'duration':f'{seconds//3600:02}:{seconds//60%60:02}:{seconds%60:02}','durationSeconds':length,'source':row['source'],'youtube':row['source'],'sourceTitle':info['title'],'uploader':info.get('uploader'),'license':'Lisans bilgisi belirtilmemiş','licenseUrl':'','trimStartSeconds':0,'selectionType':row['kind'],'countryCode':row['code']}
        result['countryName']=row['country']
        result.update(trimStartSeconds=start,clipEndSeconds=end,sourceDurationSeconds=info.get('duration'),excerptLabel=row.get('excerptLabel',''))
        write(metadata,result);return result
    added={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        tasks={pool.submit(download,row):row for row in selected}
        for task in concurrent.futures.as_completed(tasks):
            row=tasks[task]
            try:
                track=task.result();added[row['code']]=track
                print('IMPORTED',row['code'],track['title'],round(track['durationSeconds']),flush=True)
            except Exception as error:print('FAILED',row['code'],str(error),flush=True)
    manifest=read(dest/'manifest.json');mapping=read(dest/'countries.json')
    new_ids={t['id'] for t in added.values()}
    manifest=[t for t in manifest if t['id'] not in new_ids]+[added[r['code']] for r in rows if r['code'] in added]
    for row in rows:
        if row['code'] in added:
            target=row.get('entityId') or 'countries-'+hashlib.sha1(row['code'].encode()).hexdigest()[:10]
            mapping[target]=added[row['code']]['id']
    write(dest/'manifest.json',manifest);write(dest/'countries.json',mapping)
    (dest/'LICENSES.txt').write_text('\n\n'.join('\n'.join([t['title'],t.get('artist',''),'Source: '+t['source'],'License: '+t.get('license','Not specified'),t.get('licenseUrl',''),'Leading trim: '+str(t.get('trimStartSeconds',0))+' seconds.']) for t in manifest)+'\n',encoding='utf-8')
    countries=[c for c in read(ROOT/'public/catalog/manifest.json')['items'] if c['category']=='countries']
    missing=[c['name'] for c in countries if c['id'] not in mapping]
    print('COVERAGE',len(countries)-len(missing),'/',len(countries),'MISSING',json.dumps(missing,ensure_ascii=False),flush=True)

if __name__=='__main__':main()
