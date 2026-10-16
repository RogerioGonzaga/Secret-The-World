"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";
import type { Destination } from "@/lib/domain/types";
import { referenceMonthlyCost } from "@/lib/calc/cost-of-living";
import { formatMoney } from "@/lib/format";

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>';

/** Mapa interativo (Leaflet + OpenStreetMap). Carregado apenas no navegador. */
export default function MapView({ destinations }: { destinations: Destination[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sand-200 shadow-card">
      <MapContainer center={[25, 10]} zoom={2} minZoom={2} scrollWheelZoom={false} worldCopyJump className="h-[min(70vh,560px)] w-full bg-teal-50">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {destinations.map((d) => (
          <CircleMarker
            key={d.slug}
            center={[d.coordinates.lat, d.coordinates.lng]}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#137572", fillOpacity: 0.95 }}
          >
            <Popup>
              <div className="min-w-44 font-sans">
                <p className="text-base font-semibold text-ink">{d.name}</p>
                <p className="text-xs text-muted">
                  {d.country.name} · {d.currency.code}
                </p>
                <p className="mt-2 text-sm">
                  Custo/mês: <strong>{formatMoney(referenceMonthlyCost(d.costs), d.currency.code, { compact: true })}</strong>
                </p>
                <Link href={`/destinos/${d.slug}`} className="mt-2 inline-block text-sm font-medium text-teal-700">
                  Ver destino →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <ul className="sr-only">
        {destinations.map((d) => (
          <li key={d.slug}>
            <Link href={`/destinos/${d.slug}`}>
              {d.name}, {d.country.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
