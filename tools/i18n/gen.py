# Builds src/js/l_tr.js from the translation sheets in this folder.
# Usage: python3 tools/i18n/gen.py   (en_content.json is refreshed with dump.js when quest/banter text changes)
import json,re,sys,os
T=os.path.dirname(os.path.abspath(__file__))+'/'
ROOT=os.path.abspath(T+'../..')+'/'
d=json.load(open(T+'en_content.json'))
pairs=[]
def add(en,tr,src):
    if en is None or tr is None: return
    en=en.strip(); tr=tr.strip()
    if not en or en==tr: return
    pairs.append((en,tr,src))
Q={q['id']:q for q in d['quests']}
for line in open(T+'quests.txt',encoding='utf8'):
    line=line.rstrip('\n')
    if not line: continue
    p=line.split('|'); q=Q[p[0]]
    add(q['name'],p[1],p[0]); add(q['text'],p[2],p[0])
    if q['done']!='end': add(q['done'],p[3],p[0])
    labs=p[4].split(';')
    if len(labs)!=len(q['labels']): print('LABEL COUNT',p[0],file=sys.stderr)
    for a,b in zip(q['labels'],labs): add(a,b,p[0])
for line in open(T+'banter.txt',encoding='utf8'):
    line=line.rstrip('\n')
    if not line: continue
    p=line.split('|'); k=p[0]; en=d['banter'][k]
    if len(en)!=len(p)-1: print('BANTER COUNT',k,len(en),len(p)-1,file=sys.stderr)
    for a,b in zip(en,p[1:]): add(a[1],b,'b:'+k)
for line in open(T+'talk.txt',encoding='utf8'):
    line=line.rstrip('\n')
    if not line: continue
    p=line.split('|'); k=p[0]; en=d['talk'][k]
    if len(en)!=len(p)-1: print('TALK COUNT',k,file=sys.stderr)
    for a,b in zip(en,p[1:]): add(a,b,'t:'+k)
for f in sorted(x for x in os.listdir(T) if x.endswith('.txt') and x not in ('quests.txt','banter.txt','talk.txt')):
    for line in open(T+f,encoding='utf8'):
        line=line.rstrip('\n')
        if not line.strip() or line.startswith('# ----'): continue
        if ' => ' not in line: print('BAD',f,line,file=sys.stderr); continue
        a,b=line.split(' => ',1); add(a,b,f)
NUM=re.compile(r'\d+(?:\.\d+)?')
D={}
for en,tr,src in pairs:
    k=NUM.sub('#',en)
    if k in D and D[k]!=tr: print('CONFLICT',repr(k),'|',D[k],'|',tr,file=sys.stderr)
    D[k]=tr
js='/* Turkish gameplay text, generated from the translation sheets (EN skeleton with # for numbers -> TR). */\nconst TR_DICT = '+json.dumps(D,ensure_ascii=False,separators=(',',':'))+';\n'
open(ROOT+'src/js/l_tr.js','w',encoding='utf8').write(js)
print(len(D),'entries',len(js),'bytes')
