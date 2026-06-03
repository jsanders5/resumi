'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';

const LOCATIONS = [
  'Remote', 'Hybrid',
  'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
  'Seattle, WA', 'Austin, TX', 'Boston, MA', 'Denver, CO', 'Atlanta, GA',
  'Dallas, TX', 'Washington, DC', 'Miami, FL', 'San Jose, CA', 'Portland, OR',
  'Nashville, TN', 'Phoenix, AZ', 'Minneapolis, MN', 'San Diego, CA',
  'Philadelphia, PA', 'Charlotte, NC', 'Raleigh, NC', 'Salt Lake City, UT',
  'Las Vegas, NV', 'Pittsburgh, PA', 'Baltimore, MD', 'Columbus, OH',
  'Indianapolis, IN', 'Tampa, FL', 'Orlando, FL', 'Kansas City, MO',
  'London, UK', 'Toronto, Canada', 'Vancouver, Canada', 'Berlin, Germany',
  'Amsterdam, Netherlands', 'Sydney, Australia', 'Singapore', 'Dublin, Ireland',
];

export default function LocationInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = value.trim()
    ? LOCATIONS.filter((l) => l.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : LOCATIONS.slice(0, 8);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = useCallback(
    (loc: string) => {
      onChange(loc);
      setOpen(false);
      setHighlighted(-1);
    },
    [onChange]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { if (e.key === 'ArrowDown') setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); select(suggestions[highlighted]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Remote, New York NY"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {suggestions.map((loc, i) => (
            <li
              key={loc}
              onMouseDown={() => select(loc)}
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                i === highlighted ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MapPin size={12} className="shrink-0 opacity-50" />
              {loc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
