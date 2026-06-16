#!/usr/bin/env python3
# KINETIC STILLNESS — a plate from an imaginary discipline of motion.
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from matplotlib.patches import Rectangle, FancyArrowPatch
from matplotlib.lines import Line2D
import matplotlib.patheffects as pe

F = "canvas-fonts/"
def reg(p):
    fm.fontManager.addfont(p)
    return fm.FontProperties(fname=p)
serif   = reg(F+"Cormorant.ttf")        # thin high-contrast display serif
garam   = reg(F+"EBGaramond.ttf")
mono    = reg(F+"SpaceMono-Regular.ttf") # clinical labels
sans    = reg(F+"Jost.ttf")             # light geometric sans

# ---- palette: warm stone + cool ink + one earthen accent ----
PAPER = "#E9E2D4"   # bone
PAPER2= "#E4DCCB"
INK   = "#211E18"   # graphite
INK2  = "#6E665A"   # warm gray
FAINT = "#C9C0AE"   # hairline
CLAY  = "#B0563B"   # the single held note
CLAYS = "#C98E78"   # soft clay

W,H = 9.0, 12.0
fig = plt.figure(figsize=(W,H), dpi=300)
ax = fig.add_axes([0,0,1,1]); ax.set_xlim(0,1); ax.set_ylim(0,1); ax.axis("off")
AR = W/H  # aspect for circles

# paper ground with faint top-down warmth
ax.add_patch(Rectangle((0,0),1,1,fc=PAPER,ec="none",zorder=0))
grad = np.linspace(0,1,400).reshape(-1,1)
ax.imshow(grad, extent=[0,1,0,1], cmap=matplotlib.colors.LinearSegmentedColormap.from_list(
    "p",[PAPER2,PAPER]), aspect="auto", alpha=0.5, zorder=0.1, origin="lower")

def txt(x,y,s,fp,size,color=INK,ha="left",va="baseline",ls=0.0,alpha=1,rot=0,weight=None,style=None):
    t=ax.text(x,y,s,fontproperties=fp,fontsize=size,color=color,ha=ha,va=va,
              alpha=alpha,rotation=rot,zorder=6)
    if ls: t.set_fontproperties(fp);
    if ls:
        from matplotlib import textpath
        t.set_text(s)
    return t

def spaced(x,y,s,fp,size,color=INK,ha="left",va="center",ls=0.32,alpha=1,rot=0):
    # manual letterspacing for refined caps
    s=str(s)
    # estimate width
    widths=[size*(0.30 if c==" " else 0.58)+ls*size for c in s]
    total=sum(widths)/ (72*W)  # to axis units approx
    if ha=="center": cx=x-total/2
    elif ha=="right": cx=x-total
    else: cx=x
    for c,wd in zip(s,widths):
        ax.text(cx,y,c,fontproperties=fp,fontsize=size,color=color,ha="left",va=va,alpha=alpha,rotation=rot,zorder=6)
        cx+=wd/(72*W)

# ---------- plate border + registration ----------
mx0,mx1,my0,my1 = 0.075,0.925,0.052,0.948
ax.add_patch(Rectangle((mx0,my0),mx1-mx0,my1-my0,fill=False,ec=INK,lw=0.9,zorder=5))
ax.add_patch(Rectangle((mx0+0.012,my0+0.009),(mx1-mx0)-0.024,(my1-my0)-0.018,fill=False,ec=FAINT,lw=0.5,zorder=5))
def cross(x,y,r=0.012):
    ax.add_line(Line2D([x-r,x+r],[y,y],color=INK,lw=0.7,zorder=6))
    ax.add_line(Line2D([x,x],[y-r*AR,y+r*AR],color=INK,lw=0.7,zorder=6))
for cx in (mx0+0.012,mx1-0.012):
    for cy in (my0+0.009,my1-0.009): cross(cx,cy,0.010)

# ---------- header ----------
hy=my1-0.028
spaced(mx0+0.025,hy,"KINETIC STILLNESS",mono,9.5,INK,ls=0.30)
txt(mx1-0.025,hy,"ÉTUDE  Nº 01",mono,9.5,INK,ha="right",va="center")
ax.add_line(Line2D([mx0+0.025,mx1-0.025],[hy-0.012,hy-0.012],color=FAINT,lw=0.6,zorder=5))
txt(mx1-0.025,hy-0.026,"31.7683° N   /   35.2137° E",mono,7.0,INK2,ha="right",va="center")
txt(mx0+0.025,hy-0.026,"PLATE  I  —  OF  ONE",mono,7.0,INK2,ha="left",va="center")

# ---------- title block ----------
ty=0.852
spaced(mx0+0.025,ty,"A  STUDY  OF  FLOW",serif,46,INK,ls=0.14)
ax.add_line(Line2D([mx0+0.026,mx0+0.30],[ty-0.028,ty-0.028],color=CLAY,lw=1.4,zorder=6))
txt(mx0+0.026,ty-0.050,"the observation of breath and motion across sixty minutes",garam,15.5,INK2,style="italic")

# ============ THE FLOW FIELD ============
ytop, ybot = 0.745, 0.150          # session t=0 .. t=60
axx = mx0+0.075                     # time axis x
xR  = mx1-0.045                     # right bound
def Y(t): return ytop-(t)*(ytop-ybot)     # t normalized 0..1

# felt grid: faint horizontals every 5 min
for k in range(0,13):
    t=k/12; y=Y(t)
    ax.add_line(Line2D([axx,xR],[y,y],color=FAINT,lw=0.4,alpha=0.55,zorder=1))

# time axis
ax.add_line(Line2D([axx,axx],[Y(0),Y(1)],color=INK,lw=0.9,zorder=3))
for k in range(0,13):
    t=k/12; y=Y(t); mn=k*5
    long = (k%2==0)
    ax.add_line(Line2D([axx-(0.012 if long else 0.007),axx],[y,y],color=INK,lw=0.8,zorder=3))
    if long:
        txt(axx-0.018,y,f"{mn:02d}",mono,8.5,INK,ha="right",va="center")
txt(axx-0.018,Y(0)+0.020,"MIN",mono,6.5,INK2,ha="right",va="center")

# breath strands: two phases (inhale clay / exhale ink) of one continuous flow
CEN, FREQ = 0.405, 2.5
def envf(tt): return 0.045+0.108*np.exp(-((tt-0.60)/0.27)**2)   # swells toward the peak
def exf(tt):  return CEN+envf(tt)*np.sin(2*np.pi*FREQ*tt)
def inf(tt):  return CEN+envf(tt)*0.80*np.sin(2*np.pi*FREQ*tt+np.pi*0.90)
t=np.linspace(0,1,2000)
ex,inh,ycur = exf(t),inf(t),Y(t)
# faint band between strands -> the "lung" of the flow
ax.fill_betweenx(ycur, np.minimum(ex,inh), np.maximum(ex,inh), color=CLAY, alpha=0.05, zorder=1.5, lw=0)
ax.plot(inh,ycur,color=CLAY,lw=1.0,alpha=0.85,zorder=3,solid_capstyle="round")
ax.plot(ex,ycur,color=INK,lw=1.5,zorder=4,solid_capstyle="round")

# ---------- notation nodes (key postures) ----------
nodes=[
 (0.03,"01","ARRIVAL"),
 (0.13,"02","GROUND"),
 (0.27,"03","AWAKEN"),
 (0.40,"04","BUILD"),
 (0.52,"05","ASCEND"),
 (0.62,"06","APEX"),       # the held note
 (0.72,"07","SUSTAIN"),
 (0.83,"08","RELEASE"),
 (0.93,"09","SETTLE"),
 (1.00,"10","STILLNESS"),
]
th=np.linspace(0,2*np.pi,90)
for tt,num,name in nodes:
    x=exf(tt); y=Y(tt)
    peak = (num=="06")
    col = CLAY if peak else INK
    r=0.0105 if peak else 0.0072
    # tangent of the flow (direction of motion) -> a posture reduced to pure geometry
    dt=1e-3
    dx=(exf(min(tt+dt,1))-exf(max(tt-dt,0))); dy=Y(min(tt+dt,1))-Y(max(tt-dt,0))
    nrm=np.hypot(dx,dy); dx,dy=dx/nrm,dy/nrm
    # open circle + short tangent stroke
    ax.plot(x+r*np.cos(th), y+r*AR*np.sin(th),color=col,lw=1.1,zorder=5)
    ax.plot([x],[y],marker="o",ms=(2.4 if peak else 1.5),color=col,zorder=6)
    ax.add_line(Line2D([x+dx*r*1.2, x+dx*0.026],[y+dy*r*1.2*AR, y+dy*0.026*AR],color=col,lw=1.0,zorder=5))
    # leader to right rail label
    lx=xR
    ax.add_line(Line2D([x+r+0.006, lx-0.117],[y,y],color=FAINT,lw=0.5,zorder=2))
    txt(lx-0.110,y+0.0040,num,mono,8.5,col,ha="left",va="center")
    txt(lx-0.110,y-0.011,name,mono,6.3,INK2,ha="left",va="center")

# right rail
ax.add_line(Line2D([xR-0.117,xR-0.117],[Y(1)-0.01,Y(0)+0.01],color=FAINT,lw=0.6,zorder=2))

# legend (bottom-left, clinical)
lgy=0.128
def leg(x,y,kind,label):
    if kind=="ex": ax.add_line(Line2D([x,x+0.03],[y,y],color=INK,lw=1.5,zorder=5))
    elif kind=="in": ax.add_line(Line2D([x,x+0.03],[y,y],color=CLAY,lw=1.05,zorder=5))
    elif kind=="nd":
        th=np.linspace(0,2*np.pi,60); ax.plot(x+0.015+0.006*np.cos(th),y+0.006*AR*np.sin(th),color=INK,lw=1.0,zorder=5)
    txt(x+0.04,y,label,mono,7.0,INK2,va="center")
leg(mx0+0.025,lgy,"ex","EXHALE  —  descent")
leg(mx0+0.025,lgy-0.020,"in","INHALE  —  rise")
leg(mx0+0.30,lgy,"nd","POSTURE  node")
ax.plot([mx0+0.315],[lgy-0.020],marker="o",ms=4.0,color=CLAY,zorder=6)
txt(mx0+0.34,lgy-0.020,"APEX  /  held",mono,7.0,CLAY,va="center")

# ---------- footer ----------
ax.add_line(Line2D([mx0+0.025,mx1-0.025],[0.094,0.094],color=FAINT,lw=0.6,zorder=5))
fy=0.075
txt(mx0+0.025,fy,"FIG. 1 — RESPIROGRAM OF A SINGLE FLOW",mono,7.5,INK,va="center")
txt(mx1-0.025,fy,"what moves, mapped.",garam,14,INK,ha="right",va="center",style="italic")
# small seal
sx,sy=0.5,fy
th2=np.linspace(0,2*np.pi,120)
ax.plot(sx+0.013/AR*np.cos(th2),sy+0.013*np.sin(th2),color=INK,lw=0.8,zorder=6)
txt(sx,sy,"KS",serif,11,INK,ha="center",va="center")

fig.savefig("design/kinetic-stillness.png", dpi=300, facecolor=PAPER)
fig.savefig("design/kinetic-stillness.pdf", facecolor=PAPER)
print("done")
