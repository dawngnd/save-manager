import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Deposit } from '../types';
import { parseClientDateString } from '../utils/interest';

// Register Chart.js components for tree shaking
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface ChartDataPoint {
  date: string;
  total: number;
  principal: number;
  interest: number;
}

interface GrowthChartProps {
  deposits: Deposit[];
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ deposits }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const data = generateStepWiseGrowthData(deposits);

  useEffect(() => {
    if (isCollapsed || data.length === 0 || !canvasRef.current) return;

    // Destroy existing chart to prevent memory leaks and reuse errors
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Tổng tài sản',
            data: data.map(d => d.total),
            borderColor: '#64b5f6',
            backgroundColor: 'rgba(100, 181, 246, 0.08)',
            fill: true,
            tension: 0, // Sharp step-wise line segments
            pointRadius: data.length > 50 ? 0 : 2, // Hide points if there are too many data points
            pointHoverRadius: 5,
            borderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#17212b',
            titleColor: '#64b5f6',
            bodyColor: '#f5f5f5',
            borderColor: '#2b394a',
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                const index = context.dataIndex;
                const point = data[index];
                const val = context.parsed.y !== null && context.parsed.y !== undefined ? context.parsed.y : 0;
                if (point) {
                  return [
                    `Tổng: ${val.toLocaleString('vi-VN')} ₫`,
                    `Gốc: ${point.principal.toLocaleString('vi-VN')} ₫`,
                    `Lãi tích lũy: ${point.interest.toLocaleString('vi-VN')} ₫`
                  ];
                }
                return `${val.toLocaleString('vi-VN')} ₫`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(44, 56, 71, 0.3)',
              tickBorderDash: [2, 2]
            },
            ticks: {
              color: '#708499',
              maxTicksLimit: 6,
              font: { size: 10 }
            }
          },
          y: {
            grid: {
              color: 'rgba(44, 56, 71, 0.3)',
              tickBorderDash: [2, 2]
            },
            ticks: {
              color: '#708499',
              font: { size: 10 },
              callback: function (value) {
                return (Number(value) / 1000000).toLocaleString('vi-VN') + 'M';
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [isCollapsed, deposits, data.length]);

  if (data.length === 0) {
    return (
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl flex flex-col items-center justify-center text-center py-8">
        <h3 className="text-sm font-bold text-[#f5f5f5] mb-1">Không có dữ liệu tăng trưởng</h3>
        <p className="text-xs text-[#708499]">Hãy thêm khoản gửi mới để xem biểu đồ.</p>
      </div>
    );
  }

  // Calculate current and peak projections
  const currentTotal = data[0].total;
  const peakTotal = data[data.length - 1].total;
  const totalInterestEarned = peakTotal - data[0].principal;

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl space-y-3">
      {/* Header with toggle */}
      <div className="flex justify-between items-center border-b border-[#2b394a] pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📈</span>
          <h2 className="text-sm font-bold text-[#f5f5f5]">Biểu đồ tăng trưởng tài sản</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-2.5 py-1 text-xs font-semibold bg-[#2c3847] hover:bg-[#374657] text-[#64b5f6] rounded-lg transition duration-150 cursor-pointer"
        >
          {isCollapsed ? 'Hiện biểu đồ' : 'Ẩn biểu đồ'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 gap-3 text-xs border-b border-[#2b394a]/50 pb-2">
            <div>
              <div className="text-[#708499]">Tài sản hiện tại</div>
              <div className="font-bold text-[#f5f5f5]">{currentTotal.toLocaleString('vi-VN')} ₫</div>
            </div>
            <div>
              <div className="text-[#708499]">Dự phóng đỉnh</div>
              <div className="font-bold text-[#64b5f6]">{peakTotal.toLocaleString('vi-VN')} ₫</div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-44 w-full relative">
            <canvas ref={canvasRef} />
          </div>
          
          <div className="text-[10px] text-[#708499] text-center italic">
            * Ước tính tăng trưởng step-wise từ hôm nay đến {data[data.length - 1].date} (+{(totalInterestEarned).toLocaleString('vi-VN')} ₫ lãi tích lũy)
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Vẽ biểu đồ tăng trưởng step-wise từ lịch sử rollover.
 * Mỗi khoản gửi = flat line tại amount, đến ngày đáo hạn thì +expected_interest.
 *
 * Ví dụ: deposit 5,000,000 đáo hạn 10/10/2026, lãi 500,000
 *   → 10/10/2025 ~ 09/10/2026: 5,000,000
 *   → 10/10/2026:             5,500,000
 */
export function generateStepWiseGrowthData(deposits: Deposit[]): ChartDataPoint[] {
  if (deposits.length === 0) return [];

  // Tìm gốc (deposits không có parent_id)
  const origins = deposits.filter(d => !d.parent_id);
  if (origins.length === 0) return [];

  // Truy vết chuỗi tái tục từ gốc
  const buildChain = (origin: Deposit): Deposit[] => {
    const chain: Deposit[] = [origin];
    let current = origin;
    const usedIds = new Set<string>([origin.id]);
    while (true) {
      const child = deposits.find(d => d.parent_id === current.id && !usedIds.has(d.id));
      if (!child) break;
      chain.push(child);
      usedIds.add(child.id);
      current = child;
    }
    return chain;
  };

  // Tính tổng tài sản tại thời điểm targetDate
  // Với mỗi chain, chỉ tính khoản cuối cùng có created_at <= targetDate
  const computeTotalAt = (targetDate: Date, chains: Deposit[][]): { principal: number; interest: number } => {
    let principal = 0;
    let interest = 0;

    chains.forEach(chain => {
      // Tìm khoản active tại thời điểm targetDate
      let activeDep: Deposit | null = null;
      for (const dep of chain) {
        try {
          const creDate = parseClientDateString(dep.created_at);
          if (creDate <= targetDate) {
            activeDep = dep;
          }
        } catch { /* skip */ }
      }

      if (activeDep) {
        principal += activeDep.amount;
        try {
          const matDate = parseClientDateString(activeDep.maturity_at);
          if (targetDate >= matDate) {
            interest += activeDep.expected_interest;
          }
        } catch { /* skip */ }
      }
    });

    return { principal, interest };
  };

  // Build tất cả chains
  const chains = origins.map(o => buildChain(o));

  // Thu thập tất cả mốc thời gian (created_at + maturity_at)
  const uniqueDates = new Map<string, Date>();
  const formatDate = (d: Date): string => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  chains.forEach(chain => {
    chain.forEach(dep => {
      try {
        const creDate = parseClientDateString(dep.created_at);
        uniqueDates.set(dep.created_at, creDate);

        const matDate = parseClientDateString(dep.maturity_at);
        uniqueDates.set(dep.maturity_at, matDate);

        // Thêm ngày trước đáo hạn (để thấy step nhảy rõ)
        const dayBefore = new Date(matDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dbKey = formatDate(dayBefore);
        if (!uniqueDates.has(dbKey)) {
          uniqueDates.set(dbKey, dayBefore);
        }
      } catch { /* skip */ }
    });
  });

  // Sắp xếp và tạo data points
  const sortedDates = Array.from(uniqueDates.entries())
    .sort((a, b) => a[1].getTime() - b[1].getTime());

  const dataPoints: ChartDataPoint[] = [];
  sortedDates.forEach(([dateStr, date]) => {
    const { principal, interest } = computeTotalAt(date, chains);
    dataPoints.push({
      date: dateStr,
      total: principal + interest,
      principal,
      interest
    });
  });

  return dataPoints;
}

