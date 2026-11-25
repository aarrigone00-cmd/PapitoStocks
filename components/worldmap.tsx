"use client";
import { useMemo, useRef, useState } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import world from "world-atlas/countries-110m.json";
import { numericToIso3 } from "@/lib/countries";
import { CHOKEPOINTS, ROUTES } from "@/lib/geo";

const W = 960, H = 500;
type CountryFeature = Feature<Geometry, { name: string }> & { iso3: string | null };

const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const COUNTRIES: CountryFeature[] = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>).features
  .filter(f => f.id !== "010") // Antarctica
  .map(f => ({ ...f, iso3: f.id ? numericToIso3(String(f.id)) : null }));

export function WorldMap({ fill, selected, onSelect, tooltip, showRoutes, showChokepoints, onChokepoint }: {
  fill: (iso3: string | null) => string;
  selected: string | null;
  onSelect: (iso3: string) => void;
  tooltip: (iso3: string, name: string) => React.ReactNode;
  showRoutes: boolean; showChokepoints: boolean;
  onChokepoint: (id: string) => void;
}) {
  const projection = useMemo(() => geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], { type: "FeatureCollection", features: COUNTRIES }), []);
  const path = useMemo(() => geoPath(projection), [projection]);
  const [hover, setHover] = useState<{ iso3: string; name: string; x: number; y: number; w: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const move = (e: React.MouseEvent, c: CountryFeature) => {
    if (!c.iso3 || !box.current) return;
    const r = box.current.getBoundingClientRect();
    setHover({ iso3: c.iso3, name: c.properties.name, x: e.clientX - r.left, y: e.clientY - r.top, w: r.width });
  };

  return (
    <div ref={box} className="worldmap" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="World map">
        <path d={path({ type: "Sphere" }) ?? ""} className="wm-sphere" />
        <path d={path(geoGraticule10()) ?? ""} className="wm-grat" />
        {COUNTRIES.map((c, i) => (
          <path key={(c.id as string) ?? i} d={path(c) ?? ""} fill={fill(c.iso3)}
            className={`wm-country${c.iso3 && c.iso3 === selected ? " sel" : ""}${c.iso3 ? "" : " nodata"}`}
            onMouseMove={e => move(e, c)} onClick={() => c.iso3 && onSelect(c.iso3)}
            tabIndex={c.iso3 ? 0 : -1} aria-label={c.properties.name}
            onKeyDown={e => { if (e.key === "Enter" && c.iso3) onSelect(c.iso3); }} />
        ))}
        {showRoutes && ROUTES.map(r => (
          <path key={r.id} d={path({ type: "LineString", coordinates: r.path }) ?? ""} className={`wm-route ${r.kind}`}>
            <title>{r.name.it} / {r.name.en}</title>
          </path>
        ))}
        {showChokepoints && CHOKEPOINTS.map(c => {
          const p = projection(c.at);
          if (!p) return null;
          return (
            <g key={c.id} className="wm-choke" transform={`translate(${p[0]},${p[1]})`} onClick={() => onChokepoint(c.id)} tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter") onChokepoint(c.id); }} role="button" aria-label={c.name.en}>
              <circle r="9" className="pulse" /><circle r="4" className="dot" />
            </g>
          );
        })}
      </svg>
      {hover && <div className="wm-tip" style={{ left: Math.min(hover.x + 14, hover.w - 220), top: hover.y + 14 }}>{tooltip(hover.iso3, hover.name)}</div>}
    </div>
  );
}
