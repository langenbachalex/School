import json, urllib.request, sys, os
os.makedirs("audio", exist_ok=True)
# Hoerprobe: erzeugt audio/<satz>_<stimme>.mp3 ueber die ElevenLabs-API
V = {"de_a":"onwK4e9ZLuTAKqWW03F9","de_b":"pFZP5JQG7iQjIQuC4Bku","de_c":"EXAVITQu4vr4xnSDxMaL","en_m":"JBFqnCBsd6RMkjVDRZzb","en_f":"Xb7hH8MSUJpSbSDYk0k2","en_y1":"5sxKKBj5y1Bji6769iwE","en_y2":"Tm9992pPSMwoGKWpt28p"}
S = [
 ("s1","Harry Kane goes to training by car.","Harry Kane fährt mit dem Auto zum Training."),
 ("s2","Mia goes to school by train.","Mia fährt mit dem Zug zur Schule."),
 ("s3","Mia meets Ben at three twenty p.m.","Mia trifft Ben um fünfzehn Uhr zwanzig."),
]
NUR = sys.argv[1:]  # optional: nur diese Stimmen erzeugen, z.B. en_y1 en_y2
for sid,en,de in S:
  for key,txt,lang in [("en_m",en,"en"),("en_f",en,"en"),("en_y1",en,"en"),("en_y2",en,"en"),("de_a",de,"de"),("de_b",de,"de"),("de_c",de,"de")]:
    if NUR and key not in NUR: continue
    body=json.dumps({"text":txt,"model_id":"eleven_multilingual_v2","language_code":lang,
      "voice_settings":{"stability":0.6,"similarity_boost":0.75,"speed":0.9}}).encode()
    req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{V[key]}?output_format=mp3_44100_128",data=body,headers={"Content-Type":"application/json"})
    try:
      data=urllib.request.urlopen(req).read()
      open(f"audio/{sid}_{key}.mp3","wb").write(data); print(sid,key,len(data))
    except urllib.error.HTTPError as e: print(sid,key,"ERR",e.code,e.read()[:300])
