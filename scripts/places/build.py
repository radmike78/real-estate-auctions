import json,collections,re
states=[("NV","32","st32_nv","nv"),("CA","06","st06_ca","ca"),("AZ","04","st04_az","az"),("UT","49","st49_ut","ut"),("TX","48","st48_tx","tx")]
out=[];report={}
for ab,fp,f,lo in states:
    pop={};lsad={}
    for line in open(f"{lo}geo2020.pl",encoding="latin-1"):
        if line[7:12]!="|160|": continue
        c=line.rstrip("\n").split("|")
        if c[2]!="160" or c[3]!="00": continue
        pop[c[8][-7:]]=int(c[-7]); lsad[c[8][-7:]]=c[-3]
    places=collections.OrderedDict()
    rows=[l.rstrip("\n").split("|") for l in open(f"{f}_place_by_county2020.txt",encoding="utf-8")][1:]
    for r in rows:
        st,sfp,cfp,cname,pfp,pns,pname,typ,cls,fs=r
        g=sfp+pfp
        cn=re.sub(r" County$","",cname)
        if g not in places:
            m=re.match(r"^(.*?) (metro township|city and borough|city|town|village|CDP|borough|municipality)$",pname)
            name,t=(m.group(1),m.group(2)) if m else (pname,"city" if pname=="Carson City" else "other")
            places[g]={"state":ab,"name":name,"type":t,"counties":[],"geoid":g,"_inc":typ,"_cls":cls,"_fs":fs}
        places[g]["counties"].append(cn)
    for g,p in places.items():
        if g in pop: p["population"]=pop[g]
        else: print("NOPOP",ab,g,p["name"])
    missing=set(pop)-set(places)
    if missing: print("in PL not in relfile",ab,missing)
    out+=places.values()
for ab,*_ in states:
    ps=[p for p in out if p["state"]==ab]
    inc=sum(p["_inc"]=="INCORPORATED PLACE" for p in ps); cdp=sum(p["_inc"]!="INCORPORATED PLACE" for p in ps)
    multi=[(p["name"],p["counties"]) for p in ps if len(p["counties"])>1]
    nm=collections.Counter(p["name"] for p in ps); d=[n for n,c in nm.items() if c>1]
    types=collections.Counter(p["type"] for p in ps)
    print(ab,"total",len(ps),"inc",inc,"cdp",cdp,dict(types),"multi",len(multi),multi[:6],"dups",d, "inactive",[(p["name"],p["_fs"]) for p in ps if p["_inc"]=="INCORPORATED PLACE" and p["_fs"]!="A"][:5])
    print("  other:",[p for p in ps if p["type"]=="other"][:5])
for p in out:
    for k in ("_inc","_cls","_fs"): p.pop(k)
json.dump(out,open("places.json","w"),indent=1,ensure_ascii=False)
print(len(out))
