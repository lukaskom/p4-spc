import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { RuleViolation } from '@p4-spc/spc-engine';

interface ShewhartChartProps {
  readonly title: string;
  readonly timestamps: readonly string[];
  readonly values: readonly number[];
  readonly center: number;
  readonly ucl: number;
  readonly lcl: number;
  readonly lsl?: number;
  readonly usl?: number;
  readonly violations?: readonly RuleViolation[];
  readonly unit?: string;
}

export function ShewhartChart(props: ShewhartChartProps): React.ReactElement {
  const {
    title,
    timestamps,
    values,
    center,
    ucl,
    lcl,
    lsl,
    usl,
    violations = [],
    unit = '',
  } = props;

  const option: EChartsOption = useMemo(() => {
    const violatingIndices = new Set<number>();
    for (const v of violations) {
      for (let i = v.startIndex; i <= v.endIndex; i++) violatingIndices.add(i);
    }

    const data = values.map((v, i) => ({
      value: [timestamps[i], v],
      itemStyle: violatingIndices.has(i)
        ? { color: '#e11d48', borderWidth: 1, borderColor: '#881337' }
        : undefined,
    }));

    const markLineData: Array<{ yAxis: number; lineStyle: object; label: object }> = [
      {
        yAxis: center,
        lineStyle: { color: '#16a34a', type: 'solid', width: 1 },
        label: { formatter: 'CL', position: 'insideEndTop', color: '#16a34a' },
      },
      {
        yAxis: ucl,
        lineStyle: { color: '#f97316', type: 'dashed', width: 1 },
        label: { formatter: 'UCL', position: 'insideEndTop', color: '#f97316' },
      },
      {
        yAxis: lcl,
        lineStyle: { color: '#f97316', type: 'dashed', width: 1 },
        label: { formatter: 'LCL', position: 'insideEndBottom', color: '#f97316' },
      },
    ];
    if (typeof usl === 'number') {
      markLineData.push({
        yAxis: usl,
        lineStyle: { color: '#991b1b', type: 'solid', width: 1 },
        label: { formatter: 'USL', position: 'insideEndTop', color: '#991b1b' },
      });
    }
    if (typeof lsl === 'number') {
      markLineData.push({
        yAxis: lsl,
        lineStyle: { color: '#991b1b', type: 'solid', width: 1 },
        label: { formatter: 'LSL', position: 'insideEndBottom', color: '#991b1b' },
      });
    }

    return {
      title: { text: title, textStyle: { fontSize: 14, fontWeight: 500 }, left: 8, top: 6 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: unknown) => {
          const arr = params as Array<{ dataIndex: number; value: [string, number] }>;
          const p = arr[0];
          if (!p) return '';
          const ts = new Date(p.value[0]).toLocaleString('cs-CZ');
          return `${ts}<br/><b>${p.value[1].toFixed(2)}${unit ? ' ' + unit : ''}</b>`;
        },
      },
      grid: { left: 50, right: 24, top: 36, bottom: 36 },
      xAxis: {
        type: 'time',
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { fontSize: 10, formatter: (v: number) => v.toFixed(1) },
      },
      series: [
        {
          type: 'line',
          name: 'Hodnota',
          smooth: false,
          symbolSize: 6,
          lineStyle: { color: '#334155', width: 1.5 },
          data,
          markLine: {
            silent: true,
            symbol: 'none',
            data: markLineData as never,
          },
        },
      ],
    };
  }, [title, timestamps, values, center, ucl, lcl, lsl, usl, violations, unit]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <ReactECharts option={option} style={{ height: 320, width: '100%' }} />
    </div>
  );
}
