import React, { useEffect, useRef, useMemo } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { MortgageResult } from '../types';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

interface CumulativeChartProps {
  result: MortgageResult;
}

export const CumulativeChart: React.FC<CumulativeChartProps> = ({ result }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Compute cumulative sums
  const { cumulativePrincipal, cumulativeInterest, labels } = useMemo(() => {
    const schedule = result.monthlySchedule;
    const cumP: number[] = [];
    const cumI: number[] = [];
    let sumP = 0;
    let sumI = 0;

    schedule.forEach(m => {
      sumP += m.principalPaid;
      sumI += m.interestPaid;
      cumP.push(sumP);
      cumI.push(sumI);
    });

    // If > 120 months, show yearly labels for cleaner display
    let chartLabels: string[];
    if (schedule.length > 120) {
      chartLabels = schedule.map((m, i) => {
        if (i % 12 === 0) return `Năm ${m.year}`;
        return '';
      });
    } else {
      chartLabels = schedule.map(m => `T${m.month}`);
    }

    return { cumulativePrincipal: cumP, cumulativeInterest: cumI, labels: chartLabels };
  }, [result]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Gốc đã trả',
            data: cumulativePrincipal,
            fill: true,
            backgroundColor: 'rgba(239, 83, 80, 0.3)',
            borderColor: '#ef5350',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
          },
          {
            label: 'Lãi đã trả',
            data: cumulativeInterest,
            fill: true,
            backgroundColor: 'rgba(100, 181, 246, 0.3)',
            borderColor: '#64b5f6',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: '#2c3847' },
            ticks: {
              color: '#708499',
              font: { size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 20,
            },
          },
          y: {
            grid: { color: '#2c3847' },
            ticks: {
              color: '#708499',
              font: { size: 10 },
              callback: (value: any) => {
                const num = Number(value);
                if (num >= 1_000_000_000) {
                  return (num / 1_000_000_000).toFixed(1) + ' tỷ';
                }
                if (num >= 1_000_000) {
                  return (num / 1_000_000).toFixed(0) + ' tr';
                }
                return num.toLocaleString('vi-VN') + ' ₫';
              },
            },
          },
        },
        plugins: {
          legend: {
            labels: { color: '#f5f5f5', font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: '#17212b',
            titleColor: '#64b5f6',
            bodyColor: '#f5f5f5',
            borderColor: '#2b394a',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: (contexts: any[]) => {
                const idx = contexts[0]?.dataIndex;
                if (idx === undefined) return '';
                const m = result.monthlySchedule[idx];
                return `Tháng ${m.month} — Năm ${m.year}`;
              },
              label: (context: any) => {
                const value = context.raw as number;
                return `${context.dataset.label}: ${value.toLocaleString('vi-VN')} ₫`;
              },
            },
          },
        },
      } as any,
    });

    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [cumulativePrincipal, cumulativeInterest, labels, result]);

  return (
    <div style={{ height: '300px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
