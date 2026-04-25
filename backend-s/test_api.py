import urllib.request, urllib.error, json

try:
    req = urllib.request.Request('http://localhost:8080/api/login', data=b'{"username":"isi.karim","password":"123456"}', headers={'Content-Type':'application/json'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    token = data.get('token')
    print('Token len:', len(token))

    req2 = urllib.request.Request('http://localhost:8080/api/demandes/stats', headers={'Authorization': 'Bearer ' + token})
    res2 = urllib.request.urlopen(req2)
    print('Stats Response:', res2.status, res2.read())
except urllib.error.HTTPError as e:
    print('Error:', e.code, e.read())
