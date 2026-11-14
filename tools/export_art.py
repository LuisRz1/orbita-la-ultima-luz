"""Exporta el pixel art original del kit. Python 3 y Pillow; ejecución desde cualquier carpeta."""
from pathlib import Path
from random import Random
from PIL import Image, ImageDraw
import json

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'art'
ROOT.mkdir(parents=True, exist_ok=True)
MANIFEST = {}
S = {
    'ink':'#101521', 'slate':'#293547', 'dark':'#46576b', 'mid':'#7491a6',
    'light':'#b4c9d0', 'white':'#edebe0', 'cream':'#d9d1b3', 'orange':'#ffaf68',
    'teal':'#91e4d7', 'blue':'#426f8b', 'gold':'#f0d884',
}
WORLDS = {
    'orbit': ('#313b52','#485a78','#222b42','#657894'),
    'moon': ('#5e617c','#777a93','#46495f','#969ab1'),
    'mars': ('#8d4c45','#b16551','#61333a','#cb8867'),
    'bennu': ('#494550','#615968','#332e3b','#84717c'),
}
LUMA = {
    'orbit': ('#ffeaa7','#e5a45d','#a26450','#fff8d4'),
    'moon': ('#f1a246','#c87043','#773c4c','#ffe09a'),
    'mars': ('#c45a43','#9c3c4c','#592c46','#f3a47e'),
    'bennu': ('#d9eeff','#8aadc9','#566688','#f3faff'),
}


def canvas(size):
    i=Image.new('RGBA',size); return i,ImageDraw.Draw(i)


def box(d,x,y,w,h,color):
    d.rectangle((x,y,x+w-1,y+h-1),fill=S.get(color,color))


def poly(d,pts,c):
    d.polygon(pts,fill=S.get(c,c))


def emit(name,img, frame=None, anchor=(.5,1), usage='prop'):
    img.save(ROOT/(name+'.png'),optimize=True)
    MANIFEST[name]={'file':name+'.png','size':list(img.size),'frame':list(frame or img.size),
                    'origin':list(anchor),'usage':usage,'license':'CC-BY-4.0'}


def astronaut(direction, frame):
    im,d=canvas((32,40))
    if direction=='nw':
        return astronaut('ne',frame).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if direction=='sw':
        return astronaut('se',frame).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    bob=[0,-1,0,-1][frame]; y=6+bob
    back=direction=='ne'
    # Mochila y antena, botas y juntas con apoyos alternos.
    box(d,5,y+13,8,13,'ink');box(d,6,y+14,6,11,'blue')
    box(d,6,y+10,2,5,'mid');box(d,5,y+9,3,2,'orange')
    for xx,yy in [(10,[30,29,31,30][frame]),(18,[30,31,29,30][frame])]:
        box(d,xx,yy-5,6,9,'ink');box(d,xx+1,yy-4,4,6,'light')
        box(d,xx-1,yy+2,8,3,'ink');box(d,xx,yy+2,6,1,'mid')
    poly(d,[(10,y+11),(21,y+11),(25,y+15),(25,y+24),(20,y+28),(11,y+25),(8,y+21)],'ink')
    poly(d,[(11,y+13),(21,y+13),(23,y+16),(22,y+24),(19,y+26),(11,y+23)],'white')
    poly(d,[(15,y+14),(22,y+15),(21,y+23),(16,y+25)],'light')
    box(d,10,y+22,12,2,'blue');box(d,19,y+19,4,2,'orange')
    yy=y+16+[0,1,0,-1][frame]
    box(d,22,yy,6,10,'ink');box(d,23,yy+1,4,5,'cream');box(d,24,yy+6,4,3,'mid')
    poly(d,[(12,y),(21,y),(25,y+4),(25,y+11),(22,y+15),(12,y+15),(9,y+12),(8,y+5)],'ink')
    poly(d,[(12,y+1),(21,y+1),(24,y+4),(23,y+10),(21,y+13),(12,y+13),(10,y+10),(9,y+5)],'white')
    if back:
        box(d,12,y+4,4,6,'mid');box(d,13,y+4,2,2,'teal')
        box(d,22,y+6,3,4,'blue')
    else:
        poly(d,[(14,y+4),(24,y+4),(25,y+6),(24,y+11),(21,y+13),(15,y+11),(12,y+8)],'ink')
        poly(d,[(15,y+5),(23,y+5),(24,y+7),(22,y+10),(17,y+10),(14,y+8)],'blue')
        box(d,15,y+6,6,1,'teal');box(d,21,y+6,2,2,'light')
    return im


def luma(direction, frame, palette):
    if direction in ('nw','sw'):
        return luma('ne' if direction=='nw' else 'se',frame,palette).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    a,b,c,e=palette
    im,d=canvas((24,24));dy=[0,-1,0,-1][frame]
    for x,y in ((4,16),(8,18),(15,17),(19,15)):
        box(d,x,y+([0,1,0,-1][(frame+x)%4]),4,4,'ink');box(d,x+1,y+1,2,2,c)
    poly(d,[(2,8+dy),(12,4+dy),(21,8+dy),(22,15+dy),(13,19+dy),(3,15+dy)],'ink')
    poly(d,[(3,8+dy),(12,5+dy),(20,8+dy),(13,12+dy)],a)
    poly(d,[(3,9+dy),(13,12+dy),(13,18+dy),(4,15+dy)],b)
    poly(d,[(14,12+dy),(21,9+dy),(21,15+dy),(14,18+dy)],c)
    box(d,5,5+dy,4,5,a);box(d,5,4+dy,2,3,e)
    box(d,15,4+dy,3,4,b);box(d,16,3+dy,2,3,e)
    box(d,9,8+dy,4,1,e);box(d,10,7+dy,2,1,e)
    if direction=='se':
        box(d,6,12+dy,2,2,'ink');box(d,10,14+dy,2,2,'ink');box(d,7,12+dy,1,1,e)
        box(d,17,12+dy,2,1,b)
    else:
        box(d,17,12+dy,2,2,'ink');box(d,18,12+dy,1,1,e)
    return im


def sheet(name,size,paint):
    w,h=size
    out=Image.new('RGBA',(4*w,4*h))
    for row,d in enumerate(('se','sw','nw','ne')):
        for f in range(4):
            out.paste(paint(d,f),(f*w,row*h))
    emit(name,out,size,(.5,.875),'actor')


sheet('astronaut',(32,40),astronaut)
for key,palette in LUMA.items():
    sheet('luma-'+key,(24,24),lambda direction,frame: luma(direction,frame,palette))

# Diamantes de 48 x 24 con margen inferior para borden terreno/transición.
for world, (base,lit,shade,accent) in WORLDS.items():
    tiles=Image.new('RGBA',(48*4,28))
    for variant in range(4):
        im,d=canvas((48,28))
        poly(d,[(0,11),(24,22),(47,11),(47,14),(24,26),(0,14)],shade)
        poly(d,[(0,11),(24,0),(47,11),(24,23)],base)
        d.line(((2,11),(24,1),(45,11)),fill=lit)
        rng=Random(1471+variant*233)
        for _ in range(92):
            x,y=rng.randint(2,45),rng.randint(2,21)
            if abs(x-24)/24+abs(y-11)/11<.88:
                box(d,x,y,rng.choice([1,1,2,3]),1,rng.choice([lit,shade,base,base,accent]))
        if world=='orbit':
            d.line(((9,11),(24,4),(39,11),(24,18),(9,11)),fill=shade)
            box(d,22,10,4,2,'mid')
        if variant==3:
            poly(d,[(13,12),(23,7),(34,12),(24,17)],shade)
            d.line(((15,14),(24,18),(32,14)),fill=lit)
        tiles.paste(im,(variant*48,0))
    emit('floor-'+world,tiles,(48,28),(.5,11/28),'terrain')

# Módulos del mismo programa: paneles crema, estructura azul y lámparas ámbar.
im,d=canvas((80,68))
poly(d,[(3,47),(43,30),(76,45),(74,53),(42,66),(7,55)],'ink')
poly(d,[(10,38),(41,23),(71,37),(71,50),(41,64),(10,48)],'slate')
poly(d,[(9,23),(38,8),(70,23),(42,38)],'white')
poly(d,[(9,23),(42,38),(42,58),(9,44)],'cream')
poly(d,[(42,38),(70,23),(70,43),(42,58)],'blue')
poly(d,[(13,27),(38,39),(38,46),(13,34)],'ink')
poly(d,[(16,30),(35,39),(35,43),(16,34)],'mid')
poly(d,[(48,39),(62,32),(62,46),(48,53)],'ink')
poly(d,[(50,40),(60,35),(60,45),(50,50)],'dark')
box(d,45,44,2,5,'orange');box(d,60,12,2,12,'mid');box(d,58,11,5,2,'teal')
d.line(((13,45),(40,57),(67,43)),fill=S['mid'],width=1)
emit('habitat',im,anchor=(.5,.85))

im,d=canvas((40,48))
poly(d,[(5,34),(21,25),(35,33),(20,44)],'ink')
poly(d,[(8,33),(21,27),(32,33),(20,40)],'cream')
box(d,19,11,4,23,'ink');box(d,20,12,2,21,'mid')
poly(d,[(9,12),(27,4),(33,9),(31,18),(16,24),(9,20)],'ink')
poly(d,[(10,12),(27,5),(31,9),(29,17),(16,22),(10,19)],'white')
poly(d,[(13,12),(26,7),(28,11),(24,16),(17,19)],'blue')
d.line(((18,16),(29,25)),fill=S['mid'],width=2);box(d,27,23,4,4,'orange')
emit('relay',im,anchor=(.5,.875))

im,d=canvas((32,28))
poly(d,[(3,13),(16,6),(29,12),(29,21),(16,27),(3,21)],'ink')
poly(d,[(5,12),(16,7),(27,12),(16,18)],'cream')
poly(d,[(5,13),(15,18),(15,24),(5,19)],'dark')
poly(d,[(17,18),(27,13),(27,19),(17,24)],'blue')
d.line(((10,9),(22,15)),fill=S['orange'],width=3)
box(d,12,17,4,3,'orange');box(d,5,16,2,2,'light')
emit('cache',im,anchor=(.5,.88))

im,d=canvas((28,36))
poly(d,[(1,29),(14,24),(26,29),(14,35)],'ink')
poly(d,[(3,28),(14,24),(23,28),(13,33)],'dark')
box(d,11,17,5,13,'mid')
poly(d,[(4,7),(21,2),(26,11),(22,23),(6,24),(3,17)],'ink')
poly(d,[(5,8),(20,4),(24,11),(21,20),(7,22),(5,17)],'cream')
poly(d,[(7,9),(19,6),(22,11),(19,17),(8,19)],'blue')
d.line(((9,11),(17,9)),fill=S['teal'],width=2)
box(d,9,15,7,1,'light')
emit('console',im,anchor=(.5,.88))

im,d=canvas((28,36))
poly(d,[(3,28),(14,23),(24,28),(14,34)],'ink')
poly(d,[(5,27),(13,23),(21,28),(13,31)],'dark')
box(d,12,9,4,19,'mid');box(d,13,9,1,19,'light')
box(d,9,7,10,6,'ink');box(d,10,8,8,4,'orange');box(d,12,8,4,2,'cream')
emit('beacon',im,anchor=(.5,.88))

for name, (_,light,shade,accent) in WORLDS.items():
    im,d=canvas((35,28))
    poly(d,[(1,21),(6,12),(11,7),(24,5),(29,11),(33,21),(25,26),(10,26)],'ink')
    poly(d,[(3,20),(7,13),(12,8),(23,6),(27,12),(23,19),(10,22)],light)
    poly(d,[(11,18),(25,15),(31,21),(23,25),(10,25)],shade)
    poly(d,[(10,13),(15,9),(22,8),(19,12),(15,13)],accent)
    box(d,8,17,4,2,shade);box(d,19,18,3,1,accent)
    emit('rock-'+name,im,anchor=(.5,.89))

im,d=canvas((76,62))
poly(d,[(4,48),(15,31),(45,12),(57,15),(71,30),(58,48),(31,59)],'ink')
poly(d,[(7,46),(21,30),(45,15),(56,17),(68,30),(56,45),(31,56)],'blue')
poly(d,[(10,43),(24,29),(45,17),(55,18),(63,28),(48,35),(28,51)],'white')
poly(d,[(22,37),(36,24),(48,19),(57,24),(48,31),(35,37)],'ink')
poly(d,[(28,32),(45,22),(53,24),(46,29),(35,33)],'teal')
poly(d,[(35,42),(55,31),(64,30),(56,43),(33,54)],'mid')
box(d,15,46,7,3,'orange');box(d,23,49,6,3,'light')
emit('shuttle',im,anchor=(.5,.88))

im,d=canvas((22*5,22))
for i,symbol in enumerate(('scan','salvage','service','upload','done')):
    tile,td=canvas((22,22));td.ellipse((1,1,20,20),fill=S['ink'],outline=S['teal'],width=1)
    if symbol=='scan':
        td.ellipse((6,6,13,13),outline=S['teal'],width=2);td.line(((12,12),(16,16)),fill=S['teal'],width=2)
    if symbol=='salvage':
        td.line(((6,9),(16,9),(16,15),(6,15),(6,9),(8,6),(14,6),(16,9)),fill=S['orange'],width=1)
    if symbol=='service':
        td.line(((7,15),(15,7)),fill=S['orange'],width=3);td.line(((10,6),(15,6),(15,11)),fill=S['orange'],width=2)
    if symbol=='upload':
        td.line(((11,15),(11,6),(7,10)),fill=S['teal'],width=2);td.line(((11,6),(15,10)),fill=S['teal'],width=2)
    if symbol=='done':
        td.line(((6,11),(10,15),(16,7)),fill=S['teal'],width=2)
    im.paste(tile,(i*22,0))
emit('markers',im,(22,22),(.5,.5),'ui')

manifest = ROOT.parents[1] / 'src' / 'art-manifest.json'
manifest.write_bytes((json.dumps(MANIFEST,indent=2,sort_keys=True)+'\n').encode('utf-8'))
print(f'{len(MANIFEST)} PNG; {sum(p.stat().st_size for p in ROOT.glob("*.png")):,} bytes')
