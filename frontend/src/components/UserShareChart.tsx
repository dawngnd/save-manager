import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Deposit } from '../types';

Chart.register(
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
);

interface UserShareChartProps {
  deposits: Deposit[];
}

interface UserData {
  user: string;
  amount: number;
  percent: number;
  bankCodes: string[];
}

const userColors = [
  '#5288c1', '#4caf50', '#ff9800', '#e91e63', '#9c27b0',
  '#00bcd4', '#ff5722', '#8bc34a', '#673ab7', '#ffc107',
  '#03a9f4', '#cddc39', '#f44336', '#009688', '#3f51b5',
];

export const UserShareChart: React.FC<UserShareChartProps> = ({ deposits }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Tách user từ user_bankcode: "dangnd_vcb" → "dangnd"
  const extractUser = (bankcode: string): string => {
    const lastUnderscore = bankcode.lastIndexOf('_');
    if (lastUnderscore > 0) {
      return bankcode.substring(0, lastUnderscore);
    }
    return bankcode;
  };

  // Group active deposits theo user
  const userData: UserData[] = (() => {
    const map = new Map<string, { amount: number; bankCodes: Set<string> }>();
    deposits
      .filter(d => d.status === 'active')
      .forEach(d => {
        const user = extractUser(d.user_bankcode);
        const existing = map.get(user) || { amount: 0, bankCodes: new Set<string>() };
        existing.amount += d.amount;
        existing.bankCodes.add(d.user_bankcode);
        map.set(user, existing);
      });

    const totalAmount = Array.from(map.values()).reduce((s, d) => s + d.amount, 0);
    if (totalAmount === 0) return [];

    return Array.from(map.entries())
      .map(([user, data]) => ({
        user,
        amount: data.amount,
        percent: (data.amount / totalAmount) * 100,
        bankCodes: Array.from(data.bankCodes).sort(),
      }))
      .sort((a, b) => b.amount - a.amount);
  })();

  const totalAssets = userData.reduce((s, d) => s + d.amount, 0);

  useEffect(() => {
    if (isCollapsed || userData.length === 0 || !canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Center text plugin — hiển thị tổng tài sản ở giữa doughnut
    const centerTextPlugin = {
      id: 'centerText',
      afterDraw(chart: Chart) {
        const { ctx: drawCtx, chartArea } = chart;
        if (!drawCtx || !chartArea) return;

        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        drawCtx.save();
        drawCtx.textAlign = 'center';
        drawCtx.textBaseline = 'middle';

        // Label
        drawCtx.font = "11px 'Outfit', sans-serif";
        drawCtx.fillStyle = '#708499';
        drawCtx.fillText('Tổng tài sản', centerX, centerY - 12);

        // Value
        const formatted = totalAssets >= 1_000_000_000
          ? (totalAssets / 1_000_000_000).toFixed(1) + ' tỷ'
          : totalAssets >= 1_000_000
            ? (totalAssets / 1_000_000).toFixed(0) + ' triệu'
            : totalAssets.toLocaleString('vi-VN');
        drawCtx.font = "bold 16px 'Outfit', sans-serif";
        drawCtx.fillStyle = '#f5f5f5';
        drawCtx.fillText(formatted, centerX, centerY + 8);

        drawCtx.restore();
      },
    };

    chartInstanceRef.current = new Chart(ctx, {
      plugins: [centerTextPlugin],
      type: 'doughnut',
      data: {
        labels: userData.map(d => d.user),
        datasets: [{
          data: userData.map(d => d.amount),
          backgroundColor: userData.map((_, i) => userColors[i % userColors.length]),
          borderColor: '#0e1621',
          borderWidth: 3,
          hoverBorderColor: '#f5f5f5',
          hoverBorderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: { display: false },
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
                return userData[idx].user;
              },
              label: (context: any) => {
                const idx = context.dataIndex;
                const d = userData[idx];
                if (!d) return '';
                return `${d.amount.toLocaleString('vi-VN')} ₫`;
              },
              afterLabel: (context: any) => {
                const idx = context.dataIndex;
                const d = userData[idx];
                if (!d) return '';
                return [
                  `${d.percent.toFixed(1)}% tổng tài sản`,
                  `TK: ${d.bankCodes.join(', ')}`,
                ];
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
  }, [isCollapsed, userData, totalAssets]);

  if (userData.length === 0) {
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
          <span className="text-lg">🧩</span>
          <h2 className="text-sm font-bold text-[#f5f5f5]">Tỷ trọng theo người dùng</h2>
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
              <div className="text-[#708499]">Tổng tài sản</div>
              <div className="font-bold text-[#f5f5f5]">{totalAssets.toLocaleString('vi-VN')} ₫</div>
            </div>
            <div>
              <div className="text-[#708499]">Số người dùng</div>
              <div className="font-bold text-[#64b5f6]">{userData.length}</div>
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="flex justify-center px-4">
            <div style={{ width: '280px', height: '280px' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-1">
            {userData.map((data, i) => (
              <div key={data.user} className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: userColors[i % userColors.length] }}
                  />
                  <span className="text-[#f5f5f5] font-semibold">{data.user}</span>
                  <span className="text-[#708499] text-[10px]">({data.bankCodes.join(', ')})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#f5f5f5] font-mono text-[11px]">
                    {data.amount.toLocaleString('vi-VN')} ₫
                  </span>
                  <span className="text-[#64b5f6] font-bold min-w-[42px] text-right">
                    {data.percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
