import json,sys,re
W=json.load(open("words.json"))
norm=lambda s:re.sub(r"[^a-z0-9']","",s.lower())
ws=[norm(w["w"]) for w in W]
for q in sys.argv[1:]:
    qs=[norm(x) for x in q.split()]
    hits=[i for i in range(len(ws)) if ws[i:i+len(qs)]==qs]
    print(f"{q!r}: "+", ".join(f"{W[i]['s']:.2f}" for i in hits))
