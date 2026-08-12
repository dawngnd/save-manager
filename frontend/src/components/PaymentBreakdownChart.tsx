import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { MortgageResult } from '../types';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  annotationPlugin,
);

interface PaymentBreakdownChartProps {
  result: MortgageResult;
  promoMonths: number;
}

export const PaymentBreakdownChart: React.FC<PaymentBreakdownChartProps> = ({ result, promoMonths }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data based on view mode
    let labels: string[];
    let principalData: number[];
    let interestData: number[];
    let cliffIndex: number | null = null;

    if (viewMode === 'yearly') {
      labels = result.yearlySummary.map(y => `Năm ${y.year}`);
      principalData = result.yearlySummary.map(y => y.principalPaid);
      interestData = result.yearlySummary.map(y => y.interestPaid);
      // Rate cliff position in yearly view
      if (result.rateCliffPaymentBefore !== result.rateCliffPaymentAfter && promoMonths > 0) {
        cliffIndex = Math.ceil(promoMonths / 12) - 1;
      }
    } else {
      labels = result.monthlySchedule.map(m => `T${m.month}`);
      principalData = result.monthlySchedule.map(m => m.principalPaid);
      interestData = result.monthlySchedule.map(m => m.interestPaid);
      // Rate cliff position in monthly view
      if (result.rateCliffPaymentBefore !== result.rateCliffPaymentAfter && promoMonths > 0) {
        cliffIndex = promoMonths - 1;
      }
    }

    // Rate cliff annotation
    const diffPercent = result.rateCliffPaymentBefore > 0
      ? (((result.rateCliffPaymentAfter - result.rateCliffPaymentBefore) / result.rateCliffPaymentBefore) * 100).toFixed(1)
      : '0';

    const annotations: Record<string, any> = {};
    if (cliffIndex !== null && cliffIndex >= 0 && cliffIndex < labels.length) {
      annotations.rateCliffLine = {
        type: 'line' as const,
        xMin: cliffIndex,
        xMax: cliffIndex,
        borderColor: '#ffd54f',
        borderWidth: 2,
        borderDash: [6, 3],
        label: {
          display: true,
          content: `Vách đá: +${diffPercent}%`,
          position: 'start' as const,
          backgroundColor: 'rgba(255, 213, 79, 0.15)',
          color: '#ffd54f',
          font: { size: 11, weight: 'bold' as const },
          padding: 4,
        },
      };
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Gốc',
            data: principalData,
            backgroundColor: 'rgba(239, 83, 80, 0.8)',
            borderColor: '#ef5350',
            borderWidth: 1,
          },
          {
            label: 'Lãi',
            data: interestData,
            backgroundColor: 'rgba(100, 181, 246, 0.8)',
            borderColor: '#64b5f6',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { color: '#2c3847' },
            ticks: { color: '#708499', font: { size: 10 } },
          },
          y: {
            stacked: true,
            grid: { color: '#2c3847' },
            ticks: {
              color: '#708499',
              font: { size: 10 },
              callback: (value: any) => {
                const num = Number(value);
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
              label: (context: any) => {
                const value = context.raw as number;
                return `${context.dataset.label}: ${value.toLocaleString('vi-VN')} ₫`;
              },
            },
          },
          annotation: {
            annotations,
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
  }, [result, promoMonths, viewMode]);

  const monthCount = result.monthlySchedule.length;

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => setViewMode('yearly')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            viewMode === 'yearly'
              ? 'bg-[#64b5f6] text-[#0e1621]'
              : 'bg-[#2c3847] text-[#708499] hover:bg-[#374657]'
          }`}
        >
          Năm
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            viewMode === 'monthly'
              ? 'bg-[#64b5f6] text-[#0e1621]'
              : 'bg-[#2c3847] text-[#708499] hover:bg-[#374657]'
          }`}
        >
          Tháng
        </button>
      </div>

      {/* Chart Container */}
      {viewMode === 'monthly' ? (
        <div className="chart-scroll">
          <div style={{ minWidth: `${monthCount * 15}px`, height: '300px' }}>
            <canvas ref={canvasRef} />
          </div>
        </div>
      ) : (
        <div style={{ height: '300px' }}>
          <canvas ref={canvasRef} />
        </div>
      )}
    </div>
  );
};
