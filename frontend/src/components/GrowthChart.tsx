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
 * Maps active/matured deposits to a step-wise timeseries timeline.
 * Horizon starts from today to the max maturity date of active deposits.
 */
export function generateStepWiseGrowthData(deposits: Deposit[]): ChartDataPoint[] {
  const activeDeposits = deposits.filter(
    d => d.status === 'active' || d.status === 'matured'
  );

  if (activeDeposits.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the furthest maturity date among active deposits
  let maxMaturity = new Date(today);
  activeDeposits.forEach(d => {
    try {
      const matDate = parseClientDateString(d.maturity_at);
      if (matDate > maxMaturity) {
        maxMaturity = matDate;
      }
    } catch (e) {
      console.error('Lỗi phân tích ngày đáo hạn:', e);
    }
  });

  const dataPoints: ChartDataPoint[] = [];
  const currentDate = new Date(today);

  // Generate step-wise data for each day from today to maxMaturity
  while (currentDate <= maxMaturity) {
    let totalPrincipal = 0;
    let totalInterest = 0;

    activeDeposits.forEach(d => {
      try {
        const matDate = parseClientDateString(d.maturity_at);
        
        // Principal is always present for active/matured deposits
        totalPrincipal += d.amount;
        
        // Expected interest is only realized/added on or after maturity date
        if (currentDate >= matDate) {
          totalInterest += d.expected_interest;
        }
      } catch (e) {
        totalPrincipal += d.amount; // Fallback
      }
    });

    const dd = String(currentDate.getDate()).padStart(2, '0');
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yyyy = currentDate.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    dataPoints.push({
      date: dateStr,
      total: totalPrincipal + totalInterest,
      principal: totalPrincipal,
      interest: totalInterest
    });

    // Advance to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dataPoints;
}
