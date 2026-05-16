// components/PoseIllustrations.jsx — SVG il·lustracions de postures (estil línia/orgànic)

const PoseSVG = ({ id, style: drawStyle = 'line', size = 200, color = 'currentColor' }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 200 200',
    fill: 'none', stroke: color,
    strokeWidth: drawStyle === 'thick' ? 3 : 1.6,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  const fill = drawStyle === 'fill' ? color : 'none';
  const fillOp = drawStyle === 'fill' ? 0.15 : 0;

  // Each is a stylised silhouette
  const draw = {
    'tadasana': (
      <g>
        <circle cx="100" cy="40" r="10" fill={fill} fillOpacity={fillOp} />
        <path d="M100 50 L100 130" />
        <path d="M100 130 L92 175 M100 130 L108 175" />
        <path d="M100 60 L82 105 M100 60 L118 105" />
      </g>
    ),
    'adho-mukha': (
      <g>
        <circle cx="55" cy="115" r="8" fill={fill} fillOpacity={fillOp}/>
        <path d="M55 120 Q70 130 90 100 L150 60" />
        <path d="M150 60 L155 50" />
        <path d="M90 100 L130 130 L160 165" />
        <path d="M160 165 L168 162" />
      </g>
    ),
    'vrksasana': (
      <g>
        <circle cx="100" cy="35" r="9" fill={fill} fillOpacity={fillOp}/>
        <path d="M100 45 L100 130" />
        <path d="M100 130 L98 178" />
        <path d="M100 130 Q120 110 102 90" />
        <path d="M100 50 Q85 25 95 15 M100 50 Q115 25 105 15" />
      </g>
    ),
    'virabhadrasana-ii': (
      <g>
        <circle cx="100" cy="55" r="9" fill={fill} fillOpacity={fillOp}/>
        <path d="M100 65 L100 110" />
        <path d="M100 110 L65 175 M100 110 L150 145 L150 175" />
        <path d="M40 80 L100 80 L160 80" />
      </g>
    ),
    'balasana': (
      <g>
        <path d="M30 140 Q50 120 80 125 Q110 130 145 145 Q165 152 175 145" />
        <circle cx="170" cy="140" r="8" fill={fill} fillOpacity={fillOp}/>
        <path d="M30 140 L25 155 L175 155" />
      </g>
    ),
    'bhujangasana': (
      <g>
        <circle cx="50" cy="80" r="9" fill={fill} fillOpacity={fillOp}/>
        <path d="M50 88 Q70 110 110 130 L170 145" />
        <path d="M50 100 L55 140 M70 110 L75 145" />
        <path d="M30 145 L175 150" />
      </g>
    ),
    'setu-bandha': (
      <g>
        <path d="M30 140 L60 140" />
        <path d="M60 140 Q90 80 130 105" />
        <path d="M130 105 L145 140 L175 140" />
        <circle cx="35" cy="135" r="7" fill={fill} fillOpacity={fillOp}/>
        <path d="M30 155 L175 155" />
      </g>
    ),
    'paschimottanasana': (
      <g>
        <circle cx="60" cy="80" r="8" fill={fill} fillOpacity={fillOp}/>
        <path d="M60 86 Q75 105 105 110 L170 115" />
        <path d="M50 130 L170 128" />
        <path d="M170 115 L175 105" />
        <path d="M50 130 L50 155 L175 155" />
      </g>
    ),
    'sukhasana': (
      <g>
        <circle cx="100" cy="60" r="10" fill={fill} fillOpacity={fillOp}/>
        <path d="M100 70 L100 120" />
        <path d="M100 120 Q70 130 50 145 L100 145 Q130 130 150 145 L100 145" />
        <path d="M100 80 Q80 110 70 120 M100 80 Q120 110 130 120" />
        <path d="M30 155 L175 155" />
      </g>
    ),
    'savasana': (
      <g>
        <circle cx="35" cy="110" r="9" fill={fill} fillOpacity={fillOp}/>
        <path d="M44 110 L165 115" />
        <path d="M55 110 L60 95 M55 115 L60 130" />
        <path d="M30 130 L175 130" />
      </g>
    ),
    'marjariasana': (
      <g>
        <path d="M40 90 Q70 60 100 70 Q130 80 165 75" />
        <circle cx="170" cy="72" r="8" fill={fill} fillOpacity={fillOp}/>
        <path d="M50 90 L45 145 L65 145" />
        <path d="M155 80 L160 145 L140 145" />
      </g>
    ),
    'trikonasana': (
      <g>
        <circle cx="55" cy="65" r="8" fill={fill} fillOpacity={fillOp}/>
        <path d="M55 73 L100 100" />
        <path d="M100 100 L60 175 M100 100 L160 175" />
        <path d="M55 65 L40 30 M100 100 L150 50" />
      </g>
    ),
    'ardha-matsyendrasana': (
      <g>
        <circle cx="80" cy="60" r="9" fill={fill} fillOpacity={fillOp}/>
        <path d="M80 68 Q105 90 95 130 L150 145" />
        <path d="M150 145 L40 145" />
        <path d="M80 80 L120 100 M95 100 L60 105" />
        <path d="M30 155 L175 155" />
      </g>
    ),
    'utkatasana': (
      <g>
        <circle cx="80" cy="35" r="9" fill={fill} fillOpacity={fillOp}/>
        <path d="M80 44 L95 95 L115 145" />
        <path d="M115 145 L100 178 M115 145 L130 178" />
        <path d="M80 50 L60 15 M80 50 L100 15" />
      </g>
    ),
    'anjaneyasana': (
      <g>
        <circle cx="105" cy="50" r="9" fill={fill} fillOpacity={fillOp}/>
        <path d="M105 60 L105 110" />
        <path d="M105 110 L60 145 L40 145" />
        <path d="M105 110 L155 145 L175 155" />
        <path d="M105 70 L75 30 M105 70 L135 30" />
        <path d="M30 155 L175 155" />
      </g>
    ),
    'viparita-karani': (
      <g>
        <path d="M30 70 L30 175" stroke={color} strokeOpacity="0.4"/>
        <path d="M30 130 L40 130" />
        <circle cx="48" cy="130" r="7" fill={fill} fillOpacity={fillOp}/>
        <path d="M55 128 L150 122" />
        <path d="M55 132 L150 138" />
        <path d="M150 122 L60 80 M150 138 L60 90" />
        <path d="M30 155 L175 155" stroke={color}/>
      </g>
    ),
    'supta-baddha': (
      <g>
        <circle cx="35" cy="100" r="9" fill={fill} fillOpacity={fillOp}/>
        <path d="M44 100 L120 105" />
        <path d="M120 105 Q140 90 160 80 M120 105 Q140 120 160 130" />
        <path d="M30 145 L175 145" />
      </g>
    ),
    'utthita-parsvakonasana': (
      <g>
        <circle cx="60" cy="75" r="8" fill={fill} fillOpacity={fillOp}/>
        <path d="M60 82 L110 110 L155 50" />
        <path d="M110 110 L70 175 M110 110 L155 175" />
        <path d="M60 82 L40 110" />
      </g>
    ),
  };

  return (
    <svg {...props}>
      {draw[id] || (
        <g>
          <circle cx="100" cy="60" r="10"/>
          <path d="M100 70 L100 130 M100 130 L80 175 M100 130 L120 175 M100 80 L70 110 M100 80 L130 110"/>
        </g>
      )}
    </svg>
  );
};

window.PoseSVG = PoseSVG;
