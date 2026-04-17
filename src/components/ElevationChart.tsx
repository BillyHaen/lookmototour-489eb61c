import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ElevationChartProps {
  data: { distance: number; alt: number }[];
  height?: number;
}

export default function ElevationChart({ data, height = 160 }: ElevationChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="distance"
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v) => `${v}km`}
          stroke="hsl(var(--border))"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v) => `${v}m`}
          stroke="hsl(var(--border))"
          width={45}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v: number) => [`${v} m`, 'Ketinggian']}
          labelFormatter={(v) => `Jarak: ${v} km`}
        />
        <Area
          type="monotone"
          dataKey="alt"
          stroke="hsl(217 91% 60%)"
          strokeWidth={2}
          fill="url(#elevGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
