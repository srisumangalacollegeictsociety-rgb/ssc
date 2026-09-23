import React, { useState, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import {
  SRI_SUMANGALA_CENTER,
  SCHOOL_DATA,
  School,
  CategoryKey,
  CATEGORY_RULES,
  calculateGreatCircleDistance,
} from './data/schools';
import { MapOverlay } from './components/MapOverlay';
import { PrintReport } from './components/PrintReport';
import { SSCLogo } from './components/SSCLogo';
import {
  School as SchoolIcon,
  MapPin,
  Crosshair,
  RotateCcw,
  Printer,
  Compass,
  Award,
  Layers,
  CheckCircle2,
  Eye,
  X,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyB2fS_e5lTyS3RfbD088y0lHJMRTs6BHKk';

export default function App() {
  const [mode, setMode] = useState<'click' | 'coords'>('click');
  const [mapTypeId, setMapTypeId] = useState<string>('hybrid');
  const [residence, setResidence] = useState<{ lat: number; lng: number } | null>(null);
  const [inputLat, setInputLat] = useState<string>('');
  const [inputLng, setInputLng] = useState<string>('');
  const [category, setCategory] = useState<CategoryKey>('Closest Residence');

  // Form Details
  const [applicationNo, setApplicationNo] = useState<string>('');
  const [childName, setChildName] = useState<string>('');
  const [parentNic, setParentNic] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Selected School info popup
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showCollegeInfo, setShowCollegeInfo] = useState<boolean>(false);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute straight line distance from Sri Sumangala College to applicant residence
  const distance = useMemo(() => {
    if (!residence) return null;
    return calculateGreatCircleDistance(
      SRI_SUMANGALA_CENTER.lat,
      SRI_SUMANGALA_CENTER.lng,
      residence.lat,
      residence.lng
    );
  }, [residence]);

  // Find schools closer to applicant residence than Sri Sumangala College (inside residence-centered circle)
  const nearbySchools = useMemo(() => {
    if (!residence || distance === null) return [];
    return SCHOOL_DATA.filter((s) => {
      const dFromResidence = calculateGreatCircleDistance(
        residence.lat,
        residence.lng,
        s.lat,
        s.lng
      );
      // A school is closer if its distance to residence is less than distance to SSC
      return dFromResidence < distance;
    });
  }, [residence, distance]);

  // Marks Calculation
  const categoryRule = CATEGORY_RULES[category];
  const maxMarks = categoryRule.max;
  const deduction = nearbySchools.length * categoryRule.perSchool;
  const netMarks = Math.max(0, maxMarks - deduction);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (mode !== 'click') return;
      if (e.detail.latLng) {
        const newPos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
        setResidence(newPos);
        setInputLat(newPos.lat.toFixed(6));
        setInputLng(newPos.lng.toFixed(6));
        setErrorMsg(null);
      }
    },
    [mode]
  );

  const handleCheckCoordinates = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setErrorMsg('Please enter valid numeric latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    setErrorMsg(null);
    setResidence({ lat, lng });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser or device.');
      return;
    }
    setLocatingUser(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setResidence(newPos);
        setInputLat(newPos.lat.toFixed(6));
        setInputLng(newPos.lng.toFixed(6));
      },
      (err) => {
        setLocatingUser(false);
        setErrorMsg(`Unable to retrieve location: ${err.message}. Please enter coordinates manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleReset = () => {
    setResidence(null);
    setInputLat('');
    setInputLng('');
    setSelectedSchool(null);
    setShowCollegeInfo(false);
    setErrorMsg(null);
    setApplicationNo('');
    setChildName('');
    setParentNic('');
    setCategory('Closest Residence');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Screen Interactive App */}
      <div className="no-print min-h-screen text-[#f4f7fb]">
        <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-7">
          {/* Topbar Header */}
          <header className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 md:p-5 rounded-2xl bg-white/6 border border-white/14 backdrop-blur-xl shadow-2xl mb-6">
            <SSCLogo className="w-14 h-16 drop-shadow-xl hover:scale-105 transition-transform" />
            <div className="flex-1 min-w-[240px]">
              <p className="text-amber-300 text-xs md:text-sm font-semibold tracking-wider uppercase mb-0.5">
                Grade 1 · New Kids Registration
              </p>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight font-heading">
                Primary Section Admission — Distance Check
              </h1>
              <p className="text-slate-300 text-xs md:text-sm mt-0.5 font-medium">
                Sri Sumangala College, Panadura (ශ්‍රී සුමංගල විද්‍යාලය, පාණදුර)
              </p>
            </div>
            <div className="text-left md:text-right text-xs text-slate-400 leading-relaxed border-t md:border-t-0 pt-2 md:pt-0 border-white/10 w-full md:w-auto">
              <span className="font-semibold text-slate-300">Principal</span>
              <br />
              W. T. Raweendra Pushpakumara
              <br />
              <span className="text-[11px] text-slate-500">© All rights reserved</span>
            </div>
          </header>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Map Column (7 cols on lg) */}
            <section className="lg:col-span-7 bg-white/6 border border-white/14 rounded-2xl backdrop-blur-xl p-3.5 md:p-4 shadow-2xl">
              {/* Map Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="inline-flex bg-black/40 border border-white/14 rounded-full p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setMode('click')}
                    className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                      mode === 'click'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Click on map
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('coords')}
                    className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                      mode === 'coords'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Enter coordinates
                  </button>
                </div>

                {/* Map Type Switcher */}
                <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 px-2.5 py-1 rounded-lg text-xs">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400 hidden sm:inline">Layer:</span>
                  <select
                    value={mapTypeId}
                    onChange={(e) => setMapTypeId(e.target.value)}
                    className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
                  >
                    <option value="hybrid" className="bg-slate-900 text-white">Hybrid</option>
                    <option value="roadmap" className="bg-slate-900 text-white">Roadmap</option>
                    <option value="satellite" className="bg-slate-900 text-white">Satellite</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-slate-400 mb-2.5 flex items-center justify-between">
                <span>
                  {mode === 'click'
                    ? '🎯 Click anywhere on the map or drag the applicant marker to measure distance.'
                    : '⌨️ Type residence latitude and longitude, then click "Check distance".'}
                </span>
                <span className="text-amber-400/90 font-medium hidden sm:inline">
                  35 Area Schools Mapped
                </span>
              </div>

              {/* Coordinates Inputs Row */}
              {mode === 'coords' && (
                <div className="mb-3.5 p-3 rounded-xl bg-black/30 border border-white/10 flex flex-wrap items-end gap-3 animate-fadeIn">
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={inputLat}
                      onChange={(e) => setInputLat(e.target.value)}
                      placeholder="e.g. 6.70860"
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={inputLng}
                      onChange={(e) => setInputLng(e.target.value)}
                      placeholder="e.g. 79.91470"
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckCoordinates}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-bold text-xs rounded-lg hover:shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    Check distance
                  </button>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locatingUser}
                    className="px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
                    <span>{locatingUser ? 'Locating…' : 'My location'}</span>
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {errorMsg && (
                <div className="mb-3 px-3 py-2 bg-red-950/60 border border-red-500/40 rounded-lg text-xs text-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Google Map Container with explicit CSS height */}
              <div className="w-full h-[540px] md:h-[600px] rounded-xl overflow-hidden border border-white/15 relative bg-[#0a1626]">
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={[]}>
                  <Map
                    defaultCenter={{ lat: SRI_SUMANGALA_CENTER.lat, lng: SRI_SUMANGALA_CENTER.lng }}
                    defaultZoom={15}
                    mapId="DEMO_MAP_ID"
                    mapTypeId={mapTypeId}
                    onClick={handleMapClick}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    clickableIcons={false}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    className="w-full h-full"
                  >
                    {/* Sri Sumangala College Marker */}
                    <AdvancedMarker
                      position={{ lat: SRI_SUMANGALA_CENTER.lat, lng: SRI_SUMANGALA_CENTER.lng }}
                      onClick={() => setShowCollegeInfo(true)}
                      title={SRI_SUMANGALA_CENTER.en}
                    >
                      <div className="relative group cursor-pointer transition-transform hover:scale-110">
                        <SSCLogo className="w-10 h-12 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow"></span>
                      </div>
                    </AdvancedMarker>

                    {showCollegeInfo && (
                      <InfoWindow
                        position={{ lat: SRI_SUMANGALA_CENTER.lat, lng: SRI_SUMANGALA_CENTER.lng }}
                        onCloseClick={() => setShowCollegeInfo(false)}
                      >
                        <div className="p-1 text-slate-900 max-w-xs">
                          <h4 className="font-bold text-sm text-[#0b1f3a]">
                            {SRI_SUMANGALA_CENTER.en}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">{SRI_SUMANGALA_CENTER.name}</p>
                          <p className="text-[11px] text-amber-700 font-semibold mt-1">
                            Reference College Gate (Measurement Origin)
                          </p>
                        </div>
                      </InfoWindow>
                    )}

                    {/* Surrounding Schools Markers */}
                    {SCHOOL_DATA.map((school, i) => {
                      const distFromRes = residence
                        ? calculateGreatCircleDistance(
                            residence.lat,
                            residence.lng,
                            school.lat,
                            school.lng
                          )
                        : null;
                      const isCloser =
                        distFromRes !== null &&
                        distance !== null &&
                        distFromRes < distance;

                      return (
                        <AdvancedMarker
                          key={i}
                          position={{ lat: school.lat, lng: school.lng }}
                          onClick={() => setSelectedSchool(school)}
                          title={`${school.en} (${school.name})`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs shadow-md transition-transform hover:scale-110 cursor-pointer ${
                              isCloser
                                ? 'bg-rose-600 text-white border-white ring-2 ring-rose-400'
                                : 'bg-[#123057] text-amber-300 border-amber-300/60'
                            }`}
                          >
                            <SchoolIcon className="w-3.5 h-3.5" />
                          </div>
                        </AdvancedMarker>
                      );
                    })}

                    {selectedSchool && (
                      <InfoWindow
                        position={{ lat: selectedSchool.lat, lng: selectedSchool.lng }}
                        onCloseClick={() => setSelectedSchool(null)}
                      >
                        <div className="p-1 text-slate-900 max-w-xs">
                          <h4 className="font-bold text-xs text-[#0b1f3a]">{selectedSchool.en}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{selectedSchool.name}</p>
                          <div className="text-[11px] text-slate-600 mt-1 space-y-1">
                            {residence && distance !== null ? (
                              <>
                                <p className="font-semibold text-slate-800">
                                  Distance to Residence (Center):{' '}
                                  {calculateGreatCircleDistance(
                                    residence.lat,
                                    residence.lng,
                                    selectedSchool.lat,
                                    selectedSchool.lng
                                  ).toFixed(0)}{' '}
                                  m
                                </p>
                                <p>
                                  Distance to SSC:{' '}
                                  {calculateGreatCircleDistance(
                                    SRI_SUMANGALA_CENTER.lat,
                                    SRI_SUMANGALA_CENTER.lng,
                                    selectedSchool.lat,
                                    selectedSchool.lng
                                  ).toFixed(0)}{' '}
                                  m
                                </p>
                                <p
                                  className={
                                    calculateGreatCircleDistance(
                                      residence.lat,
                                      residence.lng,
                                      selectedSchool.lat,
                                      selectedSchool.lng
                                    ) < distance
                                      ? 'text-rose-600 font-bold'
                                      : 'text-emerald-700 font-medium'
                                  }
                                >
                                  {calculateGreatCircleDistance(
                                    residence.lat,
                                    residence.lng,
                                    selectedSchool.lat,
                                    selectedSchool.lng
                                  ) < distance
                                    ? '⚠️ Inside Residence Radius (Closer than SSC - Deducts marks)'
                                    : '✓ Outside Residence Radius (Farther than SSC - No deduction)'}
                                </p>
                              </>
                            ) : (
                              <p>
                                Distance to SSC:{' '}
                                {calculateGreatCircleDistance(
                                  SRI_SUMANGALA_CENTER.lat,
                                  SRI_SUMANGALA_CENTER.lng,
                                  selectedSchool.lat,
                                  selectedSchool.lng
                                ).toFixed(0)}{' '}
                                m
                              </p>
                            )}
                          </div>
                        </div>
                      </InfoWindow>
                    )}

                    {/* Applicant Residence Marker (ALWAYS Circle Center) */}
                    {residence && (
                      <AdvancedMarker
                        position={residence}
                        title="Applicant Residence (Circle Center)"
                        draggable={true}
                        onDragEnd={(e) => {
                          if (e.latLng) {
                            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                            setResidence(newPos);
                            setInputLat(newPos.lat.toFixed(6));
                            setInputLng(newPos.lng.toFixed(6));
                          }
                        }}
                      >
                        <div className="flex flex-col items-center cursor-move group">
                          <div className="px-2 py-0.5 rounded bg-black/90 text-amber-300 text-[10px] font-bold border border-amber-300/50 shadow mb-0.5 whitespace-nowrap flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Residence (Circle Center)
                          </div>
                          <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs ring-4 ring-emerald-500/30">
                            <MapPin className="w-4 h-4" />
                          </div>
                        </div>
                      </AdvancedMarker>
                    )}

                    {/* Polyline & Distance Boundary Circle */}
                    <MapOverlay residenceLocation={residence} radius={distance} />
                  </Map>
                </APIProvider>
              </div>

              {/* Quick Actions Footer below map */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-3 px-1 gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <SSCLogo className="w-3.5 h-4 inline-block" />
                    Sri Sumangala College (Destination)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-white"></span>
                    Residence (Circle Center)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-600 inline-block border border-white"></span>
                    Closer School (Deduction)
                  </span>
                </div>
                {residence && (
                  <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear marker
                  </button>
                )}
              </div>
            </section>

            {/* Sidebar Column (5 cols on lg) */}
            <aside className="lg:col-span-5 flex flex-col gap-5">
              {/* Location details card */}
              <div className="bg-white/6 border border-white/14 rounded-2xl backdrop-blur-xl p-5 shadow-2xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3.5 font-heading">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#e9b949]"></span>
                  Location & Distance Measurements
                </h2>
                <div className="divide-y divide-white/8 text-sm">
                  <div className="py-2.5 flex justify-between items-baseline">
                    <span className="text-slate-300">Distance to school</span>
                    <span className="font-bold text-white font-mono text-base">
                      {distance !== null ? `${distance.toFixed(1)} m` : '—'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">Distance in Kilometers</span>
                    <span className="font-semibold text-slate-200 font-mono text-xs">
                      {distance !== null ? `${(distance / 1000).toFixed(3)} km` : '—'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-baseline">
                    <span className="text-slate-300">Latitude</span>
                    <span className="font-mono text-slate-200 text-xs">
                      {residence ? residence.lat.toFixed(6) : '—'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-baseline">
                    <span className="text-slate-300">Longitude</span>
                    <span className="font-mono text-slate-200 text-xs">
                      {residence ? residence.lng.toFixed(6) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schools closer than SSC (within residence-centered circle) */}
              <div className="bg-white/6 border border-white/14 rounded-2xl backdrop-blur-xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
                      Schools Closer to Residence
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Inside circle (Center: Residence, Radius: {distance ? `${distance.toFixed(0)}m` : 'SSC'})
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    nearbySchools.length === 0
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {nearbySchools.length} {nearbySchools.length === 1 ? 'school' : 'schools'}
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {nearbySchools.length === 0 ? (
                    <div className="text-center py-6 text-slate-300 text-xs bg-emerald-500/10 rounded-xl border border-emerald-500/20 px-3">
                      {residence
                        ? '✅ No closer schools found inside the residence circle! Zero deductions.'
                        : 'Place an entering location on the map to evaluate closer schools.'}
                    </div>
                  ) : (
                    nearbySchools.map((s, idx) => {
                      const dFromRes = residence
                        ? calculateGreatCircleDistance(
                            residence.lat,
                            residence.lng,
                            s.lat,
                            s.lng
                          )
                        : null;
                      return (
                        <div
                          key={idx}
                          className="bg-white/5 hover:bg-white/10 border border-rose-500/20 rounded-xl p-2.5 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-100 truncate">{s.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{s.en}</p>
                            {dFromRes !== null && (
                              <p className="text-[10px] text-amber-300/90 font-mono mt-0.5">
                                📍 {dFromRes.toFixed(0)} m from residence{' '}
                                {distance !== null && (
                                  <span className="text-rose-300">
                                    ({(distance - dFromRes).toFixed(0)} m closer than SSC)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-rose-400 shrink-0 font-mono bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                            -{categoryRule.perSchool} pts
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Category & Marks Card */}
              <div className="bg-white/6 border border-white/14 rounded-2xl backdrop-blur-xl p-5 shadow-2xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3 font-heading">
                  <Award className="w-4 h-4 text-amber-400" />
                  Category & Marks Evaluation
                </h2>

                <div className="mb-4">
                  <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                    Admission Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryKey)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Closest Residence" className="bg-slate-900">
                      Closest Residence (ආසන්නතම පදිංචිකරු) - 50 Max
                    </option>
                    <option value="Brotherhood" className="bg-slate-900">
                      Brotherhood (සොහොයුරු සහෝදර) - 30 Max
                    </option>
                    <option value="Transfer" className="bg-slate-900">
                      Transfer (සේවා මාරුවීම්) - 30 Max
                    </option>
                    <option value="Foreign Travel" className="bg-slate-900">
                      Foreign Travel (විදේශගතව පැමිණි) - 35 Max
                    </option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1.5">{categoryRule.description}</p>
                </div>

                <div className="flex items-baseline justify-between py-2 border-t border-white/10">
                  <span className="text-xs text-slate-300">Category Maximum</span>
                  <span className="text-lg font-bold text-white font-mono">{maxMarks}</span>
                </div>

                <div className="flex items-baseline justify-between py-2 border-t border-white/10">
                  <span className="text-xs text-slate-300">
                    Deduction ({nearbySchools.length} × {categoryRule.perSchool})
                  </span>
                  <span className="text-sm font-bold text-rose-400 font-mono">- {deduction}</span>
                </div>

                {/* Net Marks Highlight */}
                <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-teal-900/40 border border-emerald-500/40 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="block text-xs font-semibold text-emerald-200">
                      Final Net Marks
                    </span>
                    <span className="text-[11px] text-emerald-300/80">
                      {residence ? 'Score calculated' : 'Awaiting residence point'}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-300 font-mono">
                    {residence ? netMarks : maxMarks}
                  </div>
                </div>
              </div>

              {/* Applicant Details & Print Actions */}
              <div className="bg-white/6 border border-white/14 rounded-2xl backdrop-blur-xl p-5 shadow-2xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3.5 font-heading">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#e9b949]"></span>
                  Applicant Information
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Application No.</label>
                    <input
                      type="text"
                      value={applicationNo}
                      onChange={(e) => setApplicationNo(e.target.value)}
                      placeholder="e.g. 2027/0142"
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Child's Full Name</label>
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Child's full name"
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Parent / Guardian NIC
                    </label>
                    <input
                      type="text"
                      value={parentNic}
                      onChange={(e) => setParentNic(e.target.value)}
                      placeholder="e.g. 198512345678 / 851234567V"
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="pt-1 flex items-start gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      I certify that the information entered above and the residence location plotted
                      are true and accurate for Grade 1 admission.
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex-1 min-w-[130px] py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-bold text-sm rounded-full shadow-lg hover:shadow-amber-400/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print report
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="py-2.5 px-3.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-sm rounded-full transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                    title="Preview printable report with map area"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-2.5 px-3.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 font-semibold text-sm rounded-full transition-all active:scale-98 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-400 mt-10 mb-6 space-y-2 border-t border-white/10 pt-6">
            <p>
              Sri Sumangala College, Panadura · Distance measured as straight-line (great-circle) from the college gate
              (6.71007° N, 79.91440° E).
            </p>
            <div className="flex items-center justify-center gap-2 pt-1 font-medium text-slate-300">
              <SSCLogo className="w-5 h-6 drop-shadow" />
              <span>
                Developed By <strong className="text-amber-400 font-bold tracking-wide">SSCICTS</strong> (Sri Sumangala College ICT Society)
              </span>
            </div>
          </footer>
        </div>
      </div>

      {/* Report Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6 overflow-y-auto no-print">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-white/10 text-white">
              <div className="flex items-center gap-2.5">
                <SSCLogo className="w-6 h-7" />
                <div>
                  <span className="font-bold text-sm tracking-wide block">
                    Printable Report Preview (Includes Map Area)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Official Grade 1 Admission Geodetic Distance Verification
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-xs rounded-full flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Document
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-3 md:p-6 bg-slate-800/80">
              <PrintReport
                applicationNo={applicationNo}
                childName={childName}
                parentNic={parentNic}
                category={category}
                distance={distance}
                latitude={residence?.lat ?? null}
                longitude={residence?.lng ?? null}
                nearbySchools={nearbySchools}
                maxMarks={maxMarks}
                deduction={deduction}
                netMarks={netMarks}
                isPreview={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Component (shown only when printing) */}
      <PrintReport
        applicationNo={applicationNo}
        childName={childName}
        parentNic={parentNic}
        category={category}
        distance={distance}
        latitude={residence?.lat ?? null}
        longitude={residence?.lng ?? null}
        nearbySchools={nearbySchools}
        maxMarks={maxMarks}
        deduction={deduction}
        netMarks={netMarks}
      />
    </>
  );
}
