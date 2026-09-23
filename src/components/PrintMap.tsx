import React, { useMemo } from 'react';
import { SRI_SUMANGALA_CENTER, SCHOOL_DATA, School } from '../data/schools';
import { SSCLogo } from './SSCLogo';

interface PrintMapProps {
  residence: { lat: number; lng: number } | null;
  distance: number | null;
  nearbySchools: School[];
  className?: string;
}

export function PrintMap({
  residence,
  distance,
  nearbySchools,
  className = '',
}: PrintMapProps) {
  const width = 760;
  const height = 300;
  const padding = 50;

  // Compute bounding box that includes SSC, residence, and relevant schools
  const { project, sscPos, resPos, visibleSchools, radiusPx, scaleMeters, scalePx } = useMemo(() => {
    const points: { lat: number; lng: number }[] = [
      { lat: SRI_SUMANGALA_CENTER.lat, lng: SRI_SUMANGALA_CENTER.lng },
    ];

    if (residence) {
      points.push({ lat: residence.lat, lng: residence.lng });
    }

    nearbySchools.forEach((s) => points.push({ lat: s.lat, lng: s.lng }));

    let minLat = Math.min(...points.map((p) => p.lat));
    let maxLat = Math.max(...points.map((p) => p.lat));
    let minLng = Math.min(...points.map((p) => p.lng));
    let maxLng = Math.max(...points.map((p) => p.lng));

    // Add margin
    const latSpan = Math.max(0.012, (maxLat - minLat) * 1.5);
    const lngSpan = Math.max(0.018, (maxLng - minLng) * 1.5);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    minLat = centerLat - latSpan / 2;
    maxLat = centerLat + latSpan / 2;
    minLng = centerLng - lngSpan / 2;
    maxLng = centerLng + lngSpan / 2;

    const proj = (lat: number, lng: number) => {
      const x = padding + ((lng - minLng) / (maxLng - minLng)) * (width - 2 * padding);
      const y = height - (padding + ((lat - minLat) / (maxLat - minLat)) * (height - 2 * padding));
      return { x, y };
    };

    const ssc = proj(SRI_SUMANGALA_CENTER.lat, SRI_SUMANGALA_CENTER.lng);
    const res = residence ? proj(residence.lat, residence.lng) : null;

    // Radius in pixels
    let rPx = 0;
    if (res) {
      rPx = Math.hypot(res.x - ssc.x, res.y - ssc.y);
    }

    // Identify schools within bounding box
    const schoolsInBox = SCHOOL_DATA.filter(
      (s) => s.lat >= minLat && s.lat <= maxLat && s.lng >= minLng && s.lng <= maxLng
    ).map((s) => {
      const pos = proj(s.lat, s.lng);
      const isDeducted = nearbySchools.some(
        (ns) => Math.abs(ns.lat - s.lat) < 0.0001 && Math.abs(ns.lng - s.lng) < 0.0001
      );
      return { ...s, x: pos.x, y: pos.y, isDeducted };
    });

    // Calculate approximate scale bar (500m or 1000m)
    // 1 deg lat ≈ 110574 m
    const metersPerPx = (latSpan * 110574) / (height - 2 * padding);
    let scaleM = 500;
    if (metersPerPx * 100 > 700) scaleM = 1000;
    if (metersPerPx * 100 > 1500) scaleM = 2000;
    const sPx = Math.max(30, scaleM / metersPerPx);

    return {
      project: proj,
      sscPos: ssc,
      resPos: res,
      visibleSchools: schoolsInBox,
      radiusPx: rPx,
      scaleMeters: scaleM,
      scalePx: sPx,
    };
  }, [residence, nearbySchools]);

  const midPoint = useMemo(() => {
    if (!resPos) return null;
    return {
      x: (sscPos.x + resPos.x) / 2,
      y: (sscPos.y + resPos.y) / 2,
    };
  }, [sscPos, resPos]);

  return (
    <div className={`relative border border-gray-300 rounded-lg overflow-hidden bg-[#f8fafc] text-black ${className}`}>
      {/* Top Banner / Map Header */}
      <div className="bg-[#12275e] text-white px-3 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span>GEODETIC DISTANCE & CADASTRAL VERIFICATION MAP</span>
        </div>
        <div className="text-[11px] font-mono text-gray-200">
          SSC Gateway: 6.710070° N, 79.914400° E · Datum: WGS84
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        style={{ maxHeight: '310px' }}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="printGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
          </pattern>

          {/* Ocean Water Pattern */}
          <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.75" />
            <stop offset="85%" stopColor="#e0f2fe" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
          </linearGradient>

          {/* Marker Drop Shadows */}
          <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Background Grid */}
        <rect width={width} height={height} fill="#fcfdfd" />
        <rect width={width} height={height} fill="url(#printGrid)" />

        {/* Coastal Ocean Band on West side */}
        <path
          d={`M 0 0 L ${padding + 30} 0 Q ${padding + 10} ${height / 2} ${padding + 25} ${height} L 0 ${height} Z`}
          fill="url(#oceanGrad)"
        />
        <text
          x={padding - 15}
          y={height / 2}
          fill="#0284c7"
          fontSize="10"
          fontWeight="bold"
          letterSpacing="2"
          transform={`rotate(-90, ${padding - 15}, ${height / 2})`}
          textAnchor="middle"
          opacity="0.8"
        >
          INDIAN OCEAN (ඉන්දියන් සාගරය)
        </text>

        {/* Galle Road (A2) Schematic Axis */}
        <path
          d={`M ${padding + 55} 0 Q ${padding + 65} ${height / 2} ${padding + 60} ${height}`}
          stroke="#cbd5e1"
          strokeWidth="3.5"
          fill="none"
        />
        <text
          x={padding + 70}
          y={25}
          fill="#64748b"
          fontSize="9"
          fontWeight="semibold"
          letterSpacing="0.5"
        >
          A2 Galle Rd
        </text>

        {/* Distance Verification Radius Circle */}
        {resPos && radiusPx > 0 && (
          <g>
            <circle
              cx={resPos.x}
              cy={resPos.y}
              r={radiusPx}
              fill="rgba(37, 99, 235, 0.06)"
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            {/* Radius Perimeter Label */}
            <text
              x={resPos.x}
              y={Math.max(16, resPos.y - radiusPx - 6)}
              textAnchor="middle"
              fill="#2563eb"
              fontSize="9.5"
              fontWeight="bold"
              paintOrder="stroke"
              stroke="#ffffff"
              strokeWidth="2.5"
            >
              Proximity Radius Boundary (Center: Residence · Radius: {distance ? `${distance.toFixed(0)} m` : ''})
            </text>
          </g>
        )}

        {/* Intermediate Schools in Area */}
        {visibleSchools.map((sch, i) => (
          <g key={i} transform={`translate(${sch.x}, ${sch.y})`}>
            {sch.isDeducted ? (
              // Highlighted Deducting School (Inside Residence Radius)
              <g filter="url(#mapShadow)">
                <circle cx="0" cy="0" r="5.5" fill="#ea580c" stroke="#ffffff" strokeWidth="1.5" />
                <rect
                  x="-4"
                  y="-16"
                  width="8"
                  height="8"
                  rx="1"
                  fill="#ea580c"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="14"
                  textAnchor="middle"
                  fill="#9a3412"
                  fontSize="8.5"
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth="2"
                >
                  {sch.en}
                </text>
                <text
                  x="0"
                  y="22"
                  textAnchor="middle"
                  fill="#c2410c"
                  fontSize="7.5"
                  fontWeight="semibold"
                >
                  [Deduction: -{sch.isDeducted ? 'School' : ''}]
                </text>
              </g>
            ) : (
              // Other surrounding school
              <g opacity="0.6">
                <circle cx="0" cy="0" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1" />
                <text
                  x="0"
                  y="11"
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="7.5"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                >
                  {sch.en.split(' ')[0]}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* Straight-line distance vector connecting SSC and Residence */}
        {resPos && (
          <g>
            <line
              x1={sscPos.x}
              y1={sscPos.y}
              x2={resPos.x}
              y2={resPos.y}
              stroke="#047857"
              strokeWidth="2.5"
              strokeDasharray="6 3"
            />

            {/* Midpoint Distance Measurement Badge */}
            {midPoint && distance !== null && (
              <g transform={`translate(${midPoint.x}, ${midPoint.y})`} filter="url(#mapShadow)">
                <rect
                  x="-65"
                  y="-12"
                  width="130"
                  height="24"
                  rx="12"
                  fill="#ffffff"
                  stroke="#047857"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#065f46"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  📏 {distance.toFixed(1)} m ({(distance / 1000).toFixed(3)} km)
                </text>
              </g>
            )}
          </g>
        )}

        {/* Sri Sumangala College Primary Section Marker */}
        <g transform={`translate(${sscPos.x}, ${sscPos.y})`} filter="url(#mapShadow)">
          {/* Target Ring */}
          <circle cx="0" cy="0" r="16" fill="#047857" fillOpacity="0.2" stroke="#047857" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="12" fill="#ffffff" stroke="#15803d" strokeWidth="2" />
          <image href="/crest.png" x="-10" y="-10" width="20" height="20" preserveAspectRatio="xMidYMid meet" />
          {/* College Label */}
          <g transform="translate(0, -22)">
            <rect
              x="-95"
              y="-10"
              width="190"
              height="20"
              rx="4"
              fill="#0b1f3a"
              stroke="#eab308"
              strokeWidth="1.2"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#fef08a"
              fontSize="9.5"
              fontWeight="bold"
            >
              ★ Sri Sumangala College (Main Gate)
            </text>
          </g>
        </g>

        {/* Applicant Residence Marker */}
        {resPos ? (
          <g transform={`translate(${resPos.x}, ${resPos.y})`} filter="url(#mapShadow)">
            {/* Outer pulse ring */}
            <circle cx="0" cy="0" r="12" fill="#ef4444" fillOpacity="0.2" stroke="#dc2626" strokeWidth="1.5" />
            <path
              d="M 0 0 C -6 -10, -8 -16, 0 -24 C 8 -16, 6 -10, 0 0 Z"
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx="0" cy="-15" r="3.5" fill="#ffffff" />
            {/* Residence Label */}
            <g transform="translate(0, 18)">
              <rect
                x="-85"
                y="-8"
                width="170"
                height="28"
                rx="4"
                fill="#ffffff"
                stroke="#dc2626"
                strokeWidth="1.2"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fill="#991b1b"
                fontSize="9"
                fontWeight="bold"
              >
                ● Applicant Residence (Circle Center)
              </text>
              <text
                x="0"
                y="14"
                textAnchor="middle"
                fill="#4b5563"
                fontSize="7.5"
                fontFamily="monospace"
              >
                {residence ? `${residence.lat.toFixed(5)}°N, ${residence.lng.toFixed(5)}°E` : ''}
              </text>
            </g>
          </g>
        ) : (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
            fontStyle="italic"
          >
            [Residence pin not placed on map]
          </text>
        )}

        {/* North Arrow / Compass */}
        <g transform={`translate(${width - 45}, 40)`} filter="url(#mapShadow)">
          <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          <polygon points="0,-12 4,0 0,3 -4,0" fill="#dc2626" />
          <polygon points="0,12 4,0 0,3 -4,0" fill="#64748b" />
          <text x="0" y="-14" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="bold">
            N
          </text>
        </g>

        {/* Scale Bar */}
        <g transform={`translate(45, ${height - 25})`}>
          <line x1="0" y1="0" x2={scalePx} y2="0" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="#0f172a" strokeWidth="1.5" />
          <line x1={scalePx} y1="-4" x2={scalePx} y2="4" stroke="#0f172a" strokeWidth="1.5" />
          <text x={scalePx / 2} y="-6" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="bold">
            {scaleMeters >= 1000 ? `${scaleMeters / 1000} km` : `${scaleMeters} m`}
          </text>
        </g>

        {/* Map Legend (Bottom Right) */}
        <g transform={`translate(${width - 240}, ${height - 48})`}>
          <rect
            x="0"
            y="0"
            width="230"
            height="40"
            rx="4"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="1"
            opacity="0.95"
          />
          <g transform="translate(10, 14)">
            <circle cx="5" cy="0" r="4" fill="#15803d" />
            <text x="14" y="3" fill="#1f2937" fontSize="8" fontWeight="medium">
              Sri Sumangala College (Destination)
            </text>
          </g>
          <g transform="translate(10, 28)">
            <circle cx="5" cy="0" r="4" fill="#dc2626" />
            <text x="14" y="3" fill="#1f2937" fontSize="8" fontWeight="medium">
              Applicant Residence (Circle Center)
            </text>
          </g>
          <g transform="translate(130, 14)">
            <circle cx="5" cy="0" r="3.5" fill="#ea580c" />
            <text x="14" y="3" fill="#1f2937" fontSize="8" fontWeight="medium">
              Closer Schools (Deductions)
            </text>
          </g>
          <g transform="translate(130, 28)">
            <line x1="0" y1="0" x2="10" y2="0" stroke="#047857" strokeWidth="2" strokeDasharray="3 2" />
            <text x="14" y="3" fill="#1f2937" fontSize="8" fontWeight="medium">
              Radius Vector (Distance)
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
