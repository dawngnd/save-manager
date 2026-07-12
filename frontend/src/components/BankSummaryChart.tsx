import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Deposit } from '../types';

Chart.register(
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
);

interface BankSummaryChartProps {
  deposits: Deposit[];
}

interface BankData {
  bankcode: string;
  amount: number;
  estimatedInterest: number;
}

export const BankSummaryChart: React.FC<BankSummaryChartProps> = ({ deposits }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Group active deposits by user_bankcode
  const bankData: BankData[] = (() => {
    const map = new Map<string, { amount: number; interest: number }>();
    deposits
      .filter(d => d.status === 'active')
      .forEach(d => {
        const existing = map.get(d.user_bankcode) || { amount: 0, interest: 0 };
        existing.amount += d.amount;
        existing.interest += d.expected_interest;
        map.set(d.user_bankcode, existing);
      });
    return Array.from(map.entries())
      .map(([bankcode, data]) => ({
        bankcode,
        amount: data.amount,
        estimatedInterest: data.interest,
      }))
      .sort((a, b) => (b.amount + b.estimatedInterest) - (a.amount + a.estimatedInterest));
  })();

  const totalAmount = bankData.reduce((s, d) => s + d.amount, 0);
  const totalInterest = bankData.reduce((s, d) => s + d.estimatedInterest, 0);

  useEffect(() => {
    if (isCollapsed || bankData.length === 0 || !canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bankData.map(d => d.bankcode),
        datasets: [
          {
            label: 'Tiền gốc',
            data: bankData.map(d => d.amount),
            backgroundColor: '#5288c1',
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 6, bottomRight: 6 },
          },
          {
            label: 'Lãi ước tính',
            data: bankData.map(d => d.estimatedInterest),
            backgroundColor: '#4caf50',
            borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
                const val = context.parsed.y ?? 0;
                return `${context.dataset.label}: ${val.toLocaleString('vi-VN')} ₫`;
              },
              afterBody: function (contexts) {
                const idx = contexts[0]?.dataIndex;
                if (idx === undefined) return '';
                const d = bankData[idx];
                if (!d) return '';
                return `Tổng: ${(d.amount + d.estimatedInterest).toLocaleString('vi-VN')} ₫`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: '#f5f5f5',
              font: { size: 11, weight: 'bold' as const },
            },
          },
          y: {
            stacked: true,
            grid: { color: 'rgba(44, 56, 71, 0.3)' },
            ticks: {
              color: '#708499',
              font: { size: 10 },
              callback: function (value) {
                return (Number(value) / 1000000).toLocaleString('vi-VN') + 'M';
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [isCollapsed, bankData]);

  if (bankData.length === 0) {
    return (
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl flex flex-col items-center justify-center text-center py-8">
        <h3 className="text-sm font-bold text-[#f5f5f5] mb-1">Không có dữ liệu</h3>
        <p className="text-xs text-[#708499]">Chưa có khoản gửi đang hoạt động.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#2b394a] pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🏦</span>
          <h2 className="text-sm font-bold text-[#f5f5f5]">Tổng hợp theo tài khoản</h2>
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
              <div className="text-[#708499]">Tổng gốc</div>
              <div className="font-bold text-[#5288c1]">{totalAmount.toLocaleString('vi-VN')} ₫</div>
            </div>
            <div>
              <div className="text-[#708499]">Tổng lãi ước tính</div>
              <div className="font-bold text-[#4caf50]">{totalInterest.toLocaleString('vi-VN')} ₫</div>
            </div>
          </div>

          {/* Chart */}
          <div style={{ height: `${Math.max(200, bankData.length * 60)}px` }}>
            <canvas ref={canvasRef} />
          </div>
        </>
      )}
    </div>
  );
};
