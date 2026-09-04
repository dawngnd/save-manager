import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Deposit } from '../types';
import { parseClientDateString } from '../utils/interest';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

interface Props {
  deposits: Deposit[];
}

interface YearlyPIData {
  year: number;
  principal: number;
  settledInterest: number;
  estimatedInterest: number;
}

export const YearlyPrincipalInterestChart: React.FC<Props> = ({ deposits }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const yearlyData: YearlyPIData[] = useMemo(() => {
    // Build lookup map id → deposit
    const byId = new Map<string, Deposit>();
    deposits.forEach(d => byId.set(d.id, d));

    // Lọc các khoản gốc (không có parent_id)
    const roots = deposits.filter(d => !d.parent_id);

    const map = new Map<number, { principal: number; settledInterest: number; estimatedInterest: number }>();

    roots.forEach(root => {
      let year: number;
      try {
        year = parseClientDateString(root.created_at).getFullYear();
      } catch {
        return; // Bỏ qua bản ghi có ngày không hợp lệ
      }

      const existing = map.get(year) || { principal: 0, settledInterest: 0, estimatedInterest: 0 };
      existing.principal += root.amount;

      // Duyệt chuỗi: root → child → child...
      let current: Deposit | undefined = root;
      while (current) {
        if (current.status === 'matured' || current.status === 'rolled_over') {
          existing.settledInterest += current.expected_interest;
        } else if (current.status === 'active') {
          existing.estimatedInterest += current.expected_interest;
        }
        // Nhảy sang child tiếp theo
        current = current.child_id ? byId.get(current.child_id) : undefined;
      }

      map.set(year, existing);
    });

    return Array.from(map.entries())
      .map(([year, data]) => ({
        year,
        principal: data.principal,
        settledInterest: data.settledInterest,
        estimatedInterest: data.estimatedInterest,
      }))
      .sort((a, b) => a.year - b.year);
  }, [deposits]);

  const formatCompact = (value: number): string => {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + ' tỷ';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(0) + ' tr';
    return value.toLocaleString('vi-VN');
  };

  useEffect(() => {
    if (isCollapsed || yearlyData.length === 0 || !canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: yearlyData.map(d => String(d.year)),
        datasets: [
          {
            label: 'Tiền gốc',
            data: yearlyData.map(d => d.principal),
            backgroundColor: '#5288c1',
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 },
          },
          {
            label: 'Lãi đã tất toán',
            data: yearlyData.map(d => d.settledInterest),
            backgroundColor: '#4caf50',
          },
          {
            label: 'Lãi ước tính',
            data: yearlyData.map(d => d.estimatedInterest),
            backgroundColor: '#ff9800',
            borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#708499', font: { size: 11 } },
            border: { color: '#2b394a' },
          },
          y: {
            stacked: true,
            grid: { color: '#2b394a33' },
            ticks: {
              color: '#708499',
              font: { size: 10 },
              callback: (value: any) => formatCompact(Number(value)),
            },
            border: { display: false },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#f5f5f5',
              font: { size: 11 },
              boxWidth: 12,
              boxHeight: 12,
              useBorderRadius: true,
              borderRadius: 3,
              padding: 12,
            },
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
              afterBody: (contexts: any[]) => {
                const idx = contexts[0]?.dataIndex;
                if (idx === undefined) return '';
                const d = yearlyData[idx];
                const total = d.principal + d.settledInterest + d.estimatedInterest;
                return `Tổng: ${total.toLocaleString('vi-VN')} ₫`;
              },
            },
          },
        },
      } as any,
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [isCollapsed, yearlyData]);

  const totalPrincipal = yearlyData.reduce((s, d) => s + d.principal, 0);
  const totalSettled = yearlyData.reduce((s, d) => s + d.settledInterest, 0);
  const totalEstimated = yearlyData.reduce((s, d) => s + d.estimatedInterest, 0);
  const rootCount = deposits.filter(d => !d.parent_id).length;

  if (yearlyData.length === 0) {
    return (
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl flex flex-col items-center justify-center text-center py-8">
        <h3 className="text-sm font-bold text-[#f5f5f5] mb-1">Không có dữ liệu</h3>
        <p className="text-xs text-[#708499]">Chưa có khoản gốc nào.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#2b394a] pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📊</span>
          <h2 className="text-sm font-bold text-[#f5f5f5]">Gốc & Lãi theo năm</h2>
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
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs border-b border-[#2b394a]/50 pb-2">
            <div>
              <div className="text-[#708499]">Tổng gốc</div>
              <div className="font-bold text-[#5288c1]">{formatCompact(totalPrincipal)}</div>
            </div>
            <div>
              <div className="text-[#708499]">Số khoản gốc</div>
              <div className="font-bold text-[#64b5f6]">{rootCount}</div>
            </div>
            <div>
              <div className="text-[#708499]">Lãi đã tất toán</div>
              <div className="font-bold text-[#4caf50]">{formatCompact(totalSettled)}</div>
            </div>
            <div>
              <div className="text-[#708499]">Lãi ước tính</div>
              <div className="font-bold text-[#ff9800]">{formatCompact(totalEstimated)}</div>
            </div>
          </div>

          {/* Chart */}
          <div className="px-1">
            <canvas ref={canvasRef} />
          </div>
        </>
      )}
    </div>
  );
};
