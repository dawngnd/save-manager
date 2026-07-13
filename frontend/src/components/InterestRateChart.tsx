import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Deposit } from '../types';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
);

interface InterestRateChartProps {
  deposits: Deposit[];
}

/** Tách bankcode từ user_bankcode: "dangnd_VCB" → "VCB" */
function extractBankCode(userBankcode: string): string {
  const parts = userBankcode.split('_');
  return parts.length > 1 ? parts.slice(1).join('_') : userBankcode;
}

/** Parse DD/MM/YYYY → { month: "MM/YYYY", date: Date } */
function parseToMonth(dateStr: string): { key: string; date: Date } | null {
  try {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return { key: `${String(m + 1).padStart(2, '0')}/${y}`, date: new Date(y, m, d) };
  } catch {
    return null;
  }
}

export const InterestRateChart: React.FC<InterestRateChartProps> = ({ deposits }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [chartWidth, setChartWidth] = useState<number>(0);

  // Build per-bank monthly average interest rates
  const buildData = () => {
    // Collect all banks and their monthly rates
    const bankMonthRates = new Map<string, Map<string, number[]>>();
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    deposits.forEach(dep => {
      const bank = extractBankCode(dep.user_bankcode);
      const parsed = parseToMonth(dep.created_at);
      if (!parsed) return;

      if (!bankMonthRates.has(bank)) {
        bankMonthRates.set(bank, new Map());
      }
      const monthMap = bankMonthRates.get(bank)!;
      if (!monthMap.has(parsed.key)) {
        monthMap.set(parsed.key, []);
      }
      monthMap.get(parsed.key)!.push(dep.interest_rate);

      if (!minDate || parsed.date < minDate) minDate = parsed.date;
      if (!maxDate || parsed.date > maxDate) maxDate = parsed.date;
    });

    if (!minDate || !maxDate || bankMonthRates.size === 0) return null;

    // Generate all months from min to max
    const months: string[] = [];
    const cursor = new Date((minDate as Date).getFullYear(), (minDate as Date).getMonth(), 1);
    const end = new Date((maxDate as Date).getFullYear(), (maxDate as Date).getMonth(), 1);

    while (cursor <= end) {
      const key = `${String(cursor.getMonth() + 1).padStart(2, '0')}/${cursor.getFullYear()}`;
      months.push(key);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // For each bank, compute average rate per month with forward-fill
    const banks = Array.from(bankMonthRates.keys()).sort();
    const datasets: { bank: string; data: number[] }[] = [];

    banks.forEach(bank => {
      const monthMap = bankMonthRates.get(bank)!;
      const data: number[] = [];
      let lastValue: number | null = null;

      months.forEach(month => {
        const rates = monthMap.get(month);
        if (rates && rates.length > 0) {
          const avg = rates.reduce((s, r) => s + r, 0) / rates.length;
          const rounded = Math.round(avg * 100) / 100;
          data.push(rounded);
          lastValue = rounded;
        } else if (lastValue !== null) {
          // Forward-fill: dùng giá trị tháng trước
          data.push(lastValue);
        } else {
          // Chưa có dữ liệu → NaN (skip point)
          data.push(NaN);
        }
      });

      datasets.push({ bank, data });
    });

    return { months, datasets };
  };

  const chartData = buildData();

  // Color palette for banks
  const bankColors = [
    '#64b5f6', // blue
    '#4caf50', // green
    '#ff9800', // orange
    '#e91e63', // pink
    '#9c27b0', // purple
    '#00bcd4', // cyan
    '#ff5722', // deep orange
    '#8bc34a', // light green
  ];

  useEffect(() => {
    if (isCollapsed || !chartData || !canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Width: 80px per month, minimum = container width
    const containerWidth = scrollContainerRef.current?.clientWidth || 320;
    const width = Math.max(containerWidth, chartData.months.length * 80);
    setChartWidth(width);

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Set canvas size thủ công — responsive:false để Chart.js không co canvas về container
    const canvasHeight = 200;
    const dpr = window.devicePixelRatio || 1;
    canvasRef.current.width = width * dpr;
    canvasRef.current.height = canvasHeight * dpr;
    canvasRef.current.style.width = width + 'px';
    canvasRef.current.style.height = canvasHeight + 'px';
    ctx.scale(dpr, dpr);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.months,
        datasets: chartData.datasets.map((ds, i) => ({
          label: ds.bank,
          data: ds.data,
          borderColor: bankColors[i % bankColors.length],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: bankColors[i % bankColors.length],
          pointHoverRadius: 6,
          borderWidth: 2,
          spanGaps: true,
        })),
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#708499',
              font: { size: 10 },
              boxWidth: 12,
              padding: 12,
            },
          },
          tooltip: {
            backgroundColor: '#17212b',
            titleColor: '#64b5f6',
            bodyColor: '#f5f5f5',
            borderColor: '#2b394a',
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                const val = context.parsed.y;
                if (val === null || isNaN(val)) return '';
                return `${context.dataset.label}: ${val}%`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#708499',
              font: { size: 9 },
              maxRotation: 0,
            },
          },
          y: {
            grid: { color: 'rgba(44, 56, 71, 0.3)' },
            ticks: {
              color: '#708499',
              font: { size: 10 },
              callback: function (value) {
                return value + '%';
              },
            },
            title: {
              display: true,
              text: 'Lãi suất (%/năm)',
              color: '#708499',
              font: { size: 10 },
            },
          },
        },
      },
    });

    // Auto-scroll to end
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [isCollapsed, chartData]);

  if (!chartData || chartData.datasets.length === 0) {
    return (
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl flex flex-col items-center justify-center text-center py-8">
        <h3 className="text-sm font-bold text-[#f5f5f5] mb-1">Không có dữ liệu</h3>
        <p className="text-xs text-[#708499]">Chưa có khoản gửi để thống kê lãi suất.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#2b394a] pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📉</span>
          <h2 className="text-sm font-bold text-[#f5f5f5]">Lãi suất theo ngân hàng</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-2.5 py-1 text-xs font-semibold bg-[#2c3847] hover:bg-[#374657] text-[#64b5f6] rounded-lg transition duration-150 cursor-pointer"
        >
          {isCollapsed ? 'Hiện' : 'Ẩn'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Summary: latest rates */}
          <div className="flex flex-wrap gap-2 text-xs border-b border-[#2b394a]/50 pb-2">
            {chartData.datasets.map((ds, i) => {
              const lastVal = [...ds.data].reverse().find(v => !isNaN(v));
              return (
                <div key={ds.bank} className="flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: bankColors[i % bankColors.length] }}
                  />
                  <span className="text-[#708499]">{ds.bank}:</span>
                  <span className="font-bold text-[#f5f5f5]">{lastVal ?? '-'}%</span>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div
            ref={scrollContainerRef}
            className="w-full overflow-x-auto overflow-y-hidden chart-scroll"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div style={{ width: chartWidth > 0 ? `${chartWidth}px` : '100%' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
