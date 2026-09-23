import { School, CategoryKey, CATEGORY_RULES } from '../data/schools';

interface PrintReportProps {
  applicationNo: string;
  childName: string;
  parentNic: string;
  category: CategoryKey;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  nearbySchools: School[];
  maxMarks: number;
  deduction: number;
  netMarks: number;
}

export function PrintReport({
  applicationNo,
  childName,
  parentNic,
  category,
  distance,
  latitude,
  longitude,
  nearbySchools,
  maxMarks,
  deduction,
  netMarks,
}: PrintReportProps) {
  const currentDate = new Date().toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div id="printArea" className="print-only p-8 text-black bg-white max-w-4xl mx-auto font-sans">
      <div className="flex items-center gap-4 border-b-2 border-[#123057] pb-4 mb-6">
        <div className="w-16 h-16 bg-[#0b1f3a] text-amber-400 rounded-lg flex items-center justify-center font-bold text-2xl border-2 border-amber-400">
          SSC
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-600 font-semibold">
            GRADE 1 · NEW KIDS REGISTRATION
          </div>
          <h1 className="text-xl font-bold text-[#0b1f3a]">
            Primary Section Admission — Distance Check Report
          </h1>
          <p className="text-sm text-gray-700">
            Sri Sumangala College, Panadura (ශ්‍රී සුමංගල විද්‍යාලය, පාණදුර)
          </p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm mb-6">
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-2.5 font-semibold text-gray-700 w-2/5">Application Number</td>
            <td className="py-2.5 text-gray-900 font-medium">{applicationNo || '—'}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2.5 font-semibold text-gray-700">Child's Full Name</td>
            <td className="py-2.5 text-gray-900">{childName || '—'}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2.5 font-semibold text-gray-700">Parent / Guardian NIC</td>
            <td className="py-2.5 text-gray-900">{parentNic || '—'}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2.5 font-semibold text-gray-700">Admission Category</td>
            <td className="py-2.5 text-gray-900">
              {category} ({CATEGORY_RULES[category].labelSinhala})
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2.5 font-semibold text-gray-700">Residence to School Distance</td>
            <td className="py-2.5 text-gray-900 font-bold">
              {distance !== null
                ? `${distance.toFixed(1)} metres (${(distance / 1000).toFixed(3)} km)`
                : '—'}
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2.5 font-semibold text-gray-700">Residence GPS Coordinates</td>
            <td className="py-2.5 text-gray-900">
              {latitude !== null && longitude !== null
                ? `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
                : '—'}
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2.5 font-semibold text-gray-700 align-top">
              Schools Within Radius ({nearbySchools.length})
            </td>
            <td className="py-2.5 text-gray-900">
              {nearbySchools.length === 0 ? (
                <span className="text-gray-500 italic">None within this radius</span>
              ) : (
                <ol className="list-decimal pl-4 space-y-1">
                  {nearbySchools.map((school, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{school.en}</span> ({school.name})
                    </li>
                  ))}
                </ol>
              )}
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2.5 font-semibold text-gray-700">Category Maximum Marks</td>
            <td className="py-2.5 text-gray-900 font-semibold">{maxMarks}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2.5 font-semibold text-gray-700">Deduction</td>
            <td className="py-2.5 text-red-600 font-semibold">
              - {deduction} ({nearbySchools.length} schools × {CATEGORY_RULES[category].perSchool} marks)
            </td>
          </tr>
          <tr className="border-b-2 border-gray-800 bg-gray-50">
            <td className="py-3 font-bold text-gray-900 text-base">Net Score Obtained</td>
            <td className="py-3 text-green-700 font-bold text-xl">{netMarks} / {maxMarks}</td>
          </tr>
          <tr>
            <td className="py-2.5 font-semibold text-gray-700">Report Generated On</td>
            <td className="py-2.5 text-gray-600 text-xs">{currentDate}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-12 pt-6 border-t border-gray-300 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="text-gray-700 font-medium mb-12">Parent / Guardian Signature:</p>
          <div className="border-b border-gray-400 w-3/4"></div>
          <p className="text-xs text-gray-500 mt-1">Date: ________________________</p>
        </div>
        <div>
          <p className="text-gray-700 font-medium mb-12">Officer in Charge Verification:</p>
          <div className="border-b border-gray-400 w-3/4"></div>
          <p className="text-xs text-gray-500 mt-1">Signature & Official Seal</p>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500">
        Principal — W. T. Raweendra Pushpakumara · Sri Sumangala College, Panadura · © All rights reserved.
      </div>
    </div>
  );
}
