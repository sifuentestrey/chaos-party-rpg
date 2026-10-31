"""Remove disposable room credentials from browser trace archives before sharing."""
import json, os, pathlib, sys, zipfile
room=json.loads(pathlib.Path(os.environ['CHAOS_TEST_ROOM_FILE']).read_text())
secrets=[]
def collect(value):
    if isinstance(value,dict):
        for key,item in value.items():
            if key in ('host','join','token','password') and isinstance(item,str) and item:
                secrets.append(item.encode())
            else: collect(item)
    elif isinstance(value,list):
        for item in value: collect(item)
collect(room)
root=pathlib.Path(sys.argv[1]);count=0
for archive in root.rglob('trace.zip'):
    temporary=archive.with_suffix('.redacted')
    with zipfile.ZipFile(archive) as source, zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED) as target:
        for info in source.infolist():
            data=source.read(info.filename)
            for secret in secrets:data=data.replace(secret,b'<private-room-value>')
            target.writestr(info,data)
    temporary.replace(archive);count+=1
for file in root.rglob('*'):
    if file.suffix in ('.json','.txt','.md','.log','.html'):
        data=file.read_bytes()
        for secret in secrets:data=data.replace(secret,b'<private-room-value>')
        file.write_bytes(data)
print(json.dumps({'sanitizedTraceArchives':count,'privateValuesExcluded':True}))
