# Lista recursivamente una carpeta pública de Drive → drive_videos.json. Uso: python3 drive_tree.py <folderId>
import re, sys, json, html, subprocess
def ls(fid):
    h = subprocess.run(["curl", "-sL", "-A", "Mozilla/5.0", f"https://drive.google.com/embeddedfolderview?id={fid}#list"], capture_output=True, text=True).stdout
    return [{"id": m[0], "title": html.unescape(m[2]).strip(), "folder": "/folders/" in m[1]}
            for m in re.findall(r'<div class="flip-entry" id="entry-([^"]+)"[^>]*>.*?<a href="([^"]+)".*?<div class="flip-entry-title">(.*?)</div>', h, re.S)]
def walk(fid):
    out = []
    for e in ls(fid):
        node = {"id": e["id"], "title": e["title"], "folder": e["folder"]}
        if e["folder"]: node["children"] = walk(e["id"])
        out.append(node)
    return out
tree = walk(sys.argv[1])
json.dump(tree, open("drive_videos.json", "w"), ensure_ascii=False, indent=1)
for f in tree:
    print("📁", f["title"])
    for c in f.get("children", []): print("   🎬", c["title"], c["id"])
