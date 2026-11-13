"""dist/ 를 Vercel 에 정적 사이트로 올린다 (팀 공유용 임시배포). 깃 연동 없이 빌드 결과물을 직접 올린다.
사용: node src/build.mjs && VERCEL_TOKEN=<토큰> python3 tools/deploy-vercel.py --name <프로젝트 이름> [--team <팀 id 또는 slug>] [--public] [--create]
  --public  프로젝트의 배포 보호(Vercel 로그인 요구)를 꺼서 주소를 아는 사람은 누구나 볼 수 있게 한다.
  --create  그 이름의 프로젝트가 없을 때 새로 만든다. 붙이지 않으면 멈춘다
            (Vercel 에서 프로젝트 이름을 바꾼 뒤 예전 이름으로 올리면 같은 이름의 프로젝트가 하나 더 생기기 때문이다).
토큰은 vercel.com 의 Account Settings > Tokens 에서 만든다. 환경 변수 VERCEL_TOKEN 이 없으면 인증 헤더 없이 보낸다
(프록시가 인증을 대신 붙여 주는 환경용). 첫 주소(/)는 랜딩으로 보내고, 검색 엔진에는 잡히지 않게 한다."""
import argparse, hashlib, json, os, sys, time, urllib.error, urllib.parse, urllib.request

API = 'https://api.vercel.com'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dist')
ap = argparse.ArgumentParser()
ap.add_argument('--name', required=True)
ap.add_argument('--team', default=os.environ.get('VERCEL_TEAM_ID', ''))
ap.add_argument('--public', action='store_true')
ap.add_argument('--create', action='store_true')
args = ap.parse_args()
TOKEN = os.environ.get('VERCEL_TOKEN', '')
Q = ('?' + urllib.parse.urlencode({'slug' if not args.team.startswith('team_') else 'teamId': args.team})) if args.team else ''

def call(method, path, body=None, headers=None, raw=False, missing_ok=False):
    h = dict(headers or {})
    if TOKEN:
        h['Authorization'] = 'Bearer ' + TOKEN
    data = body if raw else (json.dumps(body).encode() if body is not None else None)
    if body is not None and not raw:
        h['Content-Type'] = 'application/json'
    sep = '&' if '?' in path else '?'
    url = API + path + (sep + Q[1:] if Q else '')
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                t = r.read()
                return json.loads(t) if t else {}
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf-8', 'replace')[:400]
            if e.code == 404 and missing_ok:
                return None
            if e.code in (429, 500, 502, 503) and attempt < 3:
                time.sleep(3 * (attempt + 1)); continue
            raise SystemExit(f'{method} {path} → HTTP {e.code}: {msg}')
    raise SystemExit('gave up ' + path)

# 올릴 프로젝트를 먼저 확인한다. 이 도구는 빌드 없이 파일을 그대로 올리므로 빌드 설정이 있는 프로젝트에는 올리지 않는다
proj = call('GET', '/v9/projects/' + urllib.parse.quote(args.name, safe=''), missing_ok=True)
if proj is None and not args.create:
    raise SystemExit(f'"{args.name}" 프로젝트가 없다. Vercel 에서 이름이 바뀌지 않았는지 확인한다. 새로 만들려면 --create 를 붙인다.')
if proj and proj.get('framework'):
    raise SystemExit(f'"{args.name}" 프로젝트는 {proj["framework"]} 빌드로 설정되어 있다. 정적 파일을 올리면 빌드에 실패하므로 화면 설계용 프로젝트를 따로 쓴다.')
if proj and proj.get('link'):
    print(f'알림: "{args.name}" 은 깃 저장소({proj["link"].get("org")}/{proj["link"].get("repo")})와 연결된 프로젝트다. 깃 배포가 성공하면 그 배포가 이 배포를 대신한다.', flush=True)

# 올릴 파일: dist 전체 + vercel.json(첫 주소를 랜딩으로, 검색 엔진 차단)
VERCEL_JSON = json.dumps({
    'redirects': [{'source': '/', 'destination': '/screens/01-landing.html', 'permanent': False}],
    'headers': [{'source': '/(.*)', 'headers': [{'key': 'X-Robots-Tag', 'value': 'noindex, nofollow'}]}],
}, indent=1).encode()
files = [('vercel.json', VERCEL_JSON)]
for dp, _, fs in os.walk(ROOT):
    for f in sorted(fs):
        p = os.path.join(dp, f)
        files.append((os.path.relpath(p, ROOT).replace(os.sep, '/'), open(p, 'rb').read()))
if len(files) < 5:
    raise SystemExit('dist/ 가 비어 있다. 먼저 node src/build.mjs 를 실행한다.')
total = sum(len(b) for _, b in files)
print(f'{len(files)}개 파일 · {total / 1048576:.1f}MB 올리는 중…', flush=True)
manifest = []
for i, (name, data) in enumerate(files):
    sha = hashlib.sha1(data).hexdigest()
    call('POST', '/v2/files', body=data, raw=True, headers={'Content-Type': 'application/octet-stream', 'x-vercel-digest': sha, 'Content-Length': str(len(data))})
    manifest.append({'file': name, 'sha': sha, 'size': len(data)})
    if (i + 1) % 20 == 0:
        print(f'  {i + 1}/{len(files)}', flush=True)

body = {'name': args.name, 'files': manifest, 'target': 'production'}
if proj:
    body['project'] = proj['id']       # 있는 프로젝트의 설정은 건드리지 않는다
else:
    body['projectSettings'] = {'framework': None, 'buildCommand': None, 'installCommand': None, 'outputDirectory': None}
d = call('POST', '/v13/deployments?skipAutoDetectionConfirmation=1', body=body)
did, pid = d['id'], d.get('projectId')
print('배포 생성', did, flush=True)
state = d.get('readyState') or d.get('status')
for _ in range(90):
    if state in ('READY', 'ERROR', 'CANCELED'):
        break
    time.sleep(3)
    d = call('GET', f'/v13/deployments/{did}')
    state = d.get('readyState') or d.get('status')
print('상태', state, flush=True)
if state != 'READY':
    raise SystemExit('배포가 끝나지 않았다: ' + str(d.get('errorMessage') or state))
if args.public and pid:
    call('PATCH', f'/v9/projects/{pid}', body={'ssoProtection': None})
    print('배포 보호를 껐다 (주소를 아는 사람은 누구나 볼 수 있다)')
doms = []
if pid:
    doms = [x['name'] for x in call('GET', f'/v9/projects/{pid}/domains').get('domains', [])]
print(json.dumps({'deployment': 'https://' + d['url'], 'aliases': ['https://' + a for a in (d.get('alias') or [])], 'domains': ['https://' + x for x in doms], 'project': pid}, ensure_ascii=False, indent=1))
