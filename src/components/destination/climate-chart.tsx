"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function ClimateChart({ values }: { values: number[] }) {
  const data = values.map((v, i) => ({ month: MONTHS[i], v }));
  return (
    <figure>
      <div className="h-56" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -16, right: 4, top: 8 }}>
            <CartesianGrid stroke="#efe6d8" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8a939e" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#8a939e" }} axisLine={false} tickLine={false} unit="°" />
            <Tooltip formatter={(v) => [`${v} °C`, "Máxima média"]} cursor={{ fill: "#f8f2e9" }} />
            <Bar dataKey="v" radius={[6, 6, 0, 0]} fill="#12a38a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption>
        <details className="mt-2 text-xs text-muted">
          <summary className="cursor-pointer">Ver valores em tabela</summary>
          <table className="mt-2 w-full text-center">
            <thead>
              <tr>{MONTHS.map((m) => <th key={m} scope="col" className="font-medium">{m}</th>)}</tr>
            </thead>
            <tbody>
              <tr>{values.map((v, i) => <td key={i} className="tabular-nums">{v}°</td>)}</tr>
            </tbody>
          </table>
        </details>
      </figcaption>
    </figure>
  );
}
