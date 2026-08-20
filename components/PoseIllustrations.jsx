// components/PoseIllustrations.jsx — Postures com a maniquí de fusta articulat amb colors per parts
// Cada postura és un "esquelet" de punts (coll, maluc, braços, cames) i es dibuixa
// amb segments gruixuts (fusta) i articulacions de bola. Colors: cap=vermell,
// braços=ambre, tronc=verd, cames=blau — perquè la postura es llegeixi sense confusió.

const POSE_COLORS = {
  head:'#BC6B43', headEdge:'#8A4A2B',
  arm:'#D8A63F', armEdge:'#A67A1E',
  torso:'#5E7D3E', torsoEdge:'#3E5527',
  leg:'#4E7E90', legEdge:'#345965',
  joint:'#6E5432', jointEdge:'#4A3720',
  ground:'#B9AE98',
};

// head:[x,y,r] · neck:[x,y] (dalt del tronc) · hip:[x,y] (baix del tronc)
// arms:[ [espatlla,colze,canell], ... ] · legs:[ [maluc,genoll,turmell], ... ]
const POSES = {
  'tadasana': { head:[100,34,11], neck:[100,50], hip:[100,108],
    arms:[ [[90,54],[86,80],[85,106]], [[110,54],[114,80],[115,106]] ],
    legs:[ [[93,110],[91,145],[91,180]], [[107,110],[109,145],[109,180]] ] },
  'adho-mukha': { head:[74,118,10], neck:[90,96], hip:[118,54],
    arms:[ [[90,96],[70,132],[50,176]] ],
    legs:[ [[124,64],[148,120],[168,176]] ] },
  'vrksasana': { head:[100,32,11], neck:[100,48], hip:[100,110],
    arms:[ [[92,52],[88,30],[97,15]], [[108,52],[112,30],[103,15]] ],
    legs:[ [[95,112],[96,146],[96,180]], [[105,112],[124,122],[99,134]] ] },
  'virabhadrasana-ii': { head:[100,38,11], neck:[100,60], hip:[100,110],
    arms:[ [[88,64],[64,65],[42,66]], [[112,64],[136,65],[158,66]] ],
    legs:[ [[110,110],[146,122],[147,180]], [[90,110],[66,146],[42,180]] ] },
  'balasana': { head:[166,138,10], neck:[148,138], hip:[78,150],
    arms:[ [[148,138],[168,142],[186,144]] ],
    legs:[ [[78,150],[52,166],[66,180]] ] },
  'bhujangasana': { head:[48,72,10], neck:[60,88], hip:[150,150],
    arms:[ [[64,92],[62,120],[60,150]] ],
    legs:[ [[150,150],[168,152],[184,153]] ] },
  'setu-bandha': { head:[35,152,9], neck:[55,148], hip:[108,108],
    arms:[ [[55,148],[45,156],[34,158]] ],
    legs:[ [[108,108],[132,128],[140,176]] ] },
  'paschimottanasana': { head:[122,120,9], neck:[92,116], hip:[55,128],
    arms:[ [[92,116],[125,124],[158,132]] ],
    legs:[ [[55,128],[110,132],[165,134]] ] },
  'sukhasana': { head:[100,58,10], neck:[100,72], hip:[100,120],
    arms:[ [[90,76],[74,100],[64,118]], [[110,76],[126,100],[136,118]] ],
    legs:[ [[92,122],[72,136],[98,142]], [[108,122],[128,136],[102,142]] ] },
  'savasana': { head:[34,108,9], neck:[50,110], hip:[122,113],
    arms:[ [[50,110],[56,124],[60,132]] ],
    legs:[ [[122,113],[145,114],[168,116]] ] },
  'marjariasana': { head:[40,96,9], neck:[56,90], hip:[150,90],
    arms:[ [[56,90],[53,120],[50,148]] ],
    legs:[ [[150,90],[156,120],[160,148]] ] },
  'trikonasana': { head:[52,56,9], neck:[60,72], hip:[96,100],
    arms:[ [[62,72],[52,50],[42,30]], [[62,76],[76,96],[86,110]] ],
    legs:[ [[96,100],[130,140],[160,178]], [[96,100],[62,140],[42,178]] ] },
  'ardha-matsyendrasana': { head:[82,58,9], neck:[84,72], hip:[92,128],
    arms:[ [[84,74],[108,92],[124,102]] ],
    legs:[ [[92,128],[118,120],[138,138]], [[92,128],[70,140],[105,146]] ] },
  'utkatasana': { head:[90,34,10], neck:[90,50], hip:[110,108],
    arms:[ [[83,54],[70,32],[60,15]], [[97,54],[104,32],[100,14]] ],
    legs:[ [[104,110],[116,145],[112,178]], [[116,110],[128,145],[126,178]] ] },
  'anjaneyasana': { head:[105,48,9], neck:[105,62], hip:[105,108],
    arms:[ [[97,66],[88,40],[80,20]], [[113,66],[122,40],[130,20]] ],
    legs:[ [[113,108],[150,132],[152,176]], [[97,108],[62,140],[40,150]] ] },
  'viparita-karani': { head:[45,130,8], neck:[60,128], hip:[108,125],
    arms:[ [[60,128],[56,140],[52,148]] ],
    legs:[ [[108,125],[112,90],[116,54]] ] },
  'supta-baddha': { head:[35,100,9], neck:[52,102], hip:[110,105],
    arms:[ [[52,102],[54,90],[56,80]] ],
    legs:[ [[110,105],[135,90],[156,100]], [[110,105],[135,120],[156,110]] ] },
  'utthita-parsvakonasana': { head:[60,72,8], neck:[62,84], hip:[105,108],
    arms:[ [[70,86],[110,60],[150,44]], [[65,86],[76,105],[86,120]] ],
    legs:[ [[105,108],[140,140],[145,178]], [[105,108],[75,140],[60,178]] ] },
};

const POSE_FALLBACK = { head:[100,36,11], neck:[100,52], hip:[100,108],
  arms:[ [[90,56],[80,82],[74,106]], [[110,56],[120,82],[126,106]] ],
  legs:[ [[93,110],[91,145],[91,180]], [[107,110],[109,145],[109,180]] ] };

const _pathOf = (pts) => 'M ' + pts[0][0] + ' ' + pts[0][1] + pts.slice(1).map(p => ' L ' + p[0] + ' ' + p[1]).join('');

// Tronc amb forma real: espatlles amples → cintura estreta → maluc, orientat al llarg
// de l'eix coll→maluc (funciona en qualsevol postura).
const _torsoPath = (N, H) => {
  const dx = H[0] - N[0], dy = H[1] - N[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;      // al llarg de l'eix
  const px = -uy, py = ux;                 // perpendicular
  const at = (t) => [N[0] + ux * len * t, N[1] + uy * len * t];
  const off = (p, w) => (p[0] + px * w).toFixed(1) + ' ' + (p[1] + py * w).toFixed(1);
  const a = at(0.06), b = at(0.36), c = at(0.63), d = at(0.95);
  const capTop = at(-0.06), capBot = at(1.05);
  const SH = 16.5, CH = 14, WA = 9.5, HI = 13;
  return 'M ' + off(a, SH) + ' L ' + off(b, CH) + ' L ' + off(c, WA) + ' L ' + off(d, HI) +
         ' Q ' + off(capBot, 0) + ' ' + off(d, -HI) +
         ' L ' + off(c, -WA) + ' L ' + off(b, -CH) + ' L ' + off(a, -SH) +
         ' Q ' + off(capTop, 0) + ' ' + off(a, SH) + ' Z';
};

const PoseSVG = ({ id, style: drawStyle = 'line', size = 200, color = 'currentColor' }) => {
  const P = POSES[id] || POSE_FALLBACK;
  const C = POSE_COLORS;

  const seg = (pts, col, edge, w, key) => ([
    <path key={key + 'o'} d={_pathOf(pts)} stroke={edge} strokeWidth={w + 4} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    <path key={key + 'f'} d={_pathOf(pts)} stroke={col} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  ]);

  const arms = P.arms || [];
  const legs = P.legs || [];

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="184" x2="182" y2="184" stroke={C.ground} strokeWidth="3" strokeLinecap="round" opacity="0.5"/>

      {legs.map((lg, i) => seg(lg, C.leg, C.legEdge, 15, 'l' + i))}
      {arms.map((ar, i) => seg(ar, C.arm, C.armEdge, 12, 'a' + i))}
      {seg([[P.head[0], P.head[1]], P.neck], C.torso, C.torsoEdge, 9, 'neck')}
      <path d={_torsoPath(P.neck, P.hip)} fill={C.torso} stroke={C.torsoEdge} strokeWidth="2.5" strokeLinejoin="round"/>

      <g fill={C.joint} stroke={C.jointEdge} strokeWidth="1.5">
        <circle cx={P.neck[0]} cy={P.neck[1]} r="4.5"/>
        {arms.map((ar, i) => ar.map((pt, j) => (<circle key={'aj' + i + '_' + j} cx={pt[0]} cy={pt[1]} r="5"/>)))}
        {legs.map((lg, i) => lg.map((pt, j) => (<circle key={'lj' + i + '_' + j} cx={pt[0]} cy={pt[1]} r="5.5"/>)))}
      </g>

      <ellipse cx={P.head[0]} cy={P.head[1]} rx={P.head[2]} ry={P.head[2] * 1.15}
        fill={C.head} stroke={C.headEdge} strokeWidth="2.5"/>
    </svg>
  );
};

window.PoseSVG = PoseSVG;
