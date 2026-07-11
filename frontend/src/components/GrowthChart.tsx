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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const data = generateStepWiseGrowthData(deposits);

  useEffect(() => {
    if (isCollapsed || data.length === 0 || !canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Tìm index tháng hiện tại
    const now = new Date();
    const currentMonthLabel = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const todayIndex = data.findIndex(d => d.date === currentMonthLabel);

    // Custom plugin: vẽ đường xanh green tại tháng hiện tại
    const todayLinePlugin = {
      id: 'todayLine',
      afterDraw(chart: Chart) {
        if (todayIndex < 0) return;
        const xScale = chart.scales['x'];
        const yScale = chart.scales['y'];
        if (!xScale || !yScale) return;
        const x = xScale.getPixelForValue(todayIndex);
        const drawCtx = chart.ctx;
        drawCtx.save();
        drawCtx.beginPath();
        drawCtx.setLineDash([4, 4]);
        drawCtx.strokeStyle = '#4caf50';
        drawCtx.lineWidth = 2;
        drawCtx.moveTo(x, yScale.top);
        drawCtx.lineTo(x, yScale.bottom);
        drawCtx.stroke();
        drawCtx.setLineDash([]);
        drawCtx.fillStyle = '#4caf50';
        drawCtx.font = 'bold 10px sans-serif';
        drawCtx.textAlign = 'center';
        drawCtx.fillText('Hiện tại', x, yScale.top - 4);
        drawCtx.restore();
      }
    };

    // 90px mỗi tháng cho dễ đọc trên mobile
    const containerWidth = scrollContainerRef.current?.clientWidth || 400;
    const minWidth = Math.max(data.length * 90, containerWidth);
    canvasRef.current.style.width = `${minWidth}px`;
    canvasRef.current.width = minWidth * (window.devicePixelRatio || 1);

    chartInstanceRef.current = new Chart(ctx, {
      plugins: [todayLinePlugin],
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
            tension: 0,
            pointRadius: 3,
            pointBackgroundColor: '#64b5f6',
            pointHoverRadius: 6,
            borderWidth: 2,
          }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 16 }
        },
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
                const val = context.parsed.y ?? 0;
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
            },
            ticks: {
              color: '#708499',
              font: { size: 11 },
              maxRotation: 0,
              minRotation: 0,
            }
          },
          y: {
            grid: {
              color: 'rgba(44, 56, 71, 0.3)',
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

    // Scroll tới tháng hiện tại (canh giữa viewport)
    if (scrollContainerRef.current) {
      if (todayIndex >= 0) {
        const scrollTarget = (todayIndex / data.length) * minWidth - containerWidth / 2;
        scrollContainerRef.current.scrollLeft = Math.max(0, scrollTarget);
      } else {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    }

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

  const currentTotal = data[0].total;
  const peakTotal = data[data.length - 1].total;
  const totalInterestEarned = peakTotal - data[0].principal;

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#2b394a] pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📈</span>
          <h2 className="text-sm font-bold text-[#f5f5f5]">Biểu đồ tăng trưởng</h2>
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
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs border-b border-[#2b394a]/50 pb-2">
            <div>
              <div className="text-[#708499]">Khởi đầu</div>
              <div className="font-bold text-[#f5f5f5]">{currentTotal.toLocaleString('vi-VN')} ₫</div>
            </div>
            <div>
              <div className="text-[#708499]">Dự phóng đỉnh</div>
              <div className="font-bold text-[#64b5f6]">{peakTotal.toLocaleString('vi-VN')} ₫</div>
            </div>
          </div>

          {/* Scrollable Chart */}
          <div
            ref={scrollContainerRef}
            className="h-48 w-full overflow-x-auto overflow-y-hidden relative"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <canvas ref={canvasRef} style={{ height: '100%' }} />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-[10px] text-[#708499] italic">
              {data[0].date} → {data[data.length - 1].date} · +{totalInterestEarned.toLocaleString('vi-VN')} ₫ lãi
            </div>
            <div className="text-[10px] text-[#708499]">
              ← vuốt ngang →
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Biểu đồ step-wise theo bước 1 tháng.
 * Từ created_at sớm nhất → maturity_at muộn nhất.
 */
export function generateStepWiseGrowthData(deposits: Deposit[]): ChartDataPoint[] {
  if (deposits.length === 0) return [];

  const origins = deposits.filter(d => !d.parent_id);
  if (origins.length === 0) return [];

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

  const chains = origins.map(o => buildChain(o));

  // Tìm ngày sớm nhất và muộn nhất
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  deposits.forEach(dep => {
    try {
      const cre = parseClientDateString(dep.created_at);
      const mat = parseClientDateString(dep.maturity_at);
      if (!minDate || cre < minDate) minDate = cre;
      if (!maxDate || mat > maxDate) maxDate = mat;
    } catch { /* skip */ }
  });

  if (!minDate || !maxDate) return [];

  const startDate: Date = minDate;
  const endDate: Date = maxDate;

  // Tính tổng tại thời điểm T
  const computeTotalAt = (targetDate: Date): { principal: number; interest: number } => {
    let principal = 0;
    let interest = 0;

    chains.forEach(chain => {
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

  // Tạo data points theo bước 1 tháng
  const dataPoints: ChartDataPoint[] = [];
  const cursor = new Date(startDate);
  cursor.setDate(1);

  while (cursor <= endDate) {
    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
    const yyyy = cursor.getFullYear();
    const dateStr = `${mm}/${yyyy}`;

    const { principal, interest } = computeTotalAt(cursor);
    dataPoints.push({
      date: dateStr,
      total: principal + interest,
      principal,
      interest
    });

    // Tiến tới tháng tiếp theo
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Thêm điểm cuối cùng (ngày đáo hạn chính xác) nếu chưa có
  const lastPoint = dataPoints[dataPoints.length - 1];
  const { principal: endP, interest: endI } = computeTotalAt(endDate);
  const endTotal = endP + endI;
  if (!lastPoint || lastPoint.total !== endTotal) {
    const edd = String(endDate.getDate()).padStart(2, '0');
    const emm = String(endDate.getMonth() + 1).padStart(2, '0');
    const eyyyy = endDate.getFullYear();
    dataPoints.push({
      date: `${edd}/${emm}/${eyyyy}`,
      total: endTotal,
      principal: endP,
      interest: endI
    });
  }

  return dataPoints;
}
