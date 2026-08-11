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

interface TermShareChartProps {
  deposits: Deposit[];
}

interface TermData {
  bucket: string;
  amount: number;
  percent: number;
  count: number;
}

const bucketColors = [
  '#ce93d8', // < 3
  '#4caf50', // 3 - 6
  '#ff9800', // 6 - 12
  '#e91e63', // > 12
];

const BUCKETS = ['< 3 tháng', '3 - 6 tháng', '6 - 12 tháng', '> 12 tháng'];

export const TermShareChart: React.FC<TermShareChartProps> = ({ deposits }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const parseDate = (d: string) => {
    const [day, month, year] = d.split('/');
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  // Group active deposits theo bucket
  const termData: TermData[] = (() => {
    const amounts = [0, 0, 0, 0];
    const counts = [0, 0, 0, 0];
    
    deposits
      .filter(d => d.status === 'active')
      .forEach(d => {
        const start = parseDate(d.created_at);
        const end = parseDate(d.maturity_at);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        const diffMonths = diffDays / 30;

        let bucketIdx = 0;
        if (diffMonths < 3) bucketIdx = 0;
        else if (diffMonths < 6) bucketIdx = 1;
        else if (diffMonths <= 12) bucketIdx = 2; // Usually 6-12 includes 12
        else bucketIdx = 3;

        amounts[bucketIdx] += d.amount;
        counts[bucketIdx] += 1;
      });

    const totalAmount = amounts.reduce((s, a) => s + a, 0);
    if (totalAmount === 0) return [];

    return BUCKETS.map((bucket, i) => ({
      bucket,
      amount: amounts[i],
      percent: amounts[i] > 0 ? (amounts[i] / totalAmount) * 100 : 0,
      count: counts[i],
    })).filter(d => d.amount > 0);
  })();

  const totalAssets = termData.reduce((s, d) => s + d.amount, 0);

  useEffect(() => {
    if (isCollapsed || termData.length === 0 || !canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Center text plugin
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
        labels: termData.map(d => d.bucket),
        datasets: [{
          data: termData.map(d => d.amount),
          backgroundColor: termData.map(d => bucketColors[BUCKETS.indexOf(d.bucket)]),
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
                return termData[idx].bucket;
              },
              label: (context: any) => {
                const idx = context.dataIndex;
                const d = termData[idx];
                if (!d) return '';
                return `${d.amount.toLocaleString('vi-VN')} ₫`;
              },
              afterLabel: (context: any) => {
                const idx = context.dataIndex;
                const d = termData[idx];
                if (!d) return '';
                return [
                  `${d.percent.toFixed(1)}% tổng tài sản`,
                  `Số lượng: ${d.count} khoản`,
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
  }, [isCollapsed, termData, totalAssets]);

  if (termData.length === 0) {
    return (
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl flex flex-col items-center justify-center text-center py-8">
        <h3 className="text-sm font-bold text-[#f5f5f5] mb-1">Không có dữ liệu</h3>
        <p className="text-xs text-[#708499]">Chưa có khoản gửi đang hoạt động.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl space-y-3">
      <div className="flex justify-between items-center border-b border-[#2b394a] pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">⏳</span>
          <h2 className="text-sm font-bold text-[#f5f5f5]">Tỷ trọng theo kỳ hạn</h2>
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
          <div className="grid grid-cols-2 gap-3 text-xs border-b border-[#2b394a]/50 pb-2">
            <div>
              <div className="text-[#708499]">Tổng tài sản</div>
              <div className="font-bold text-[#f5f5f5]">{totalAssets.toLocaleString('vi-VN')} ₫</div>
            </div>
            <div>
              <div className="text-[#708499]">Nhóm kỳ hạn</div>
              <div className="font-bold text-[#64b5f6]">{termData.length}</div>
            </div>
          </div>

          <div className="flex justify-center px-4">
            <div style={{ width: '280px', height: '280px' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            {termData.map((data) => (
              <div key={data.bucket} className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: bucketColors[BUCKETS.indexOf(data.bucket)] }}
                  />
                  <span className="text-[#f5f5f5] font-semibold">{data.bucket}</span>
                  <span className="text-[#708499] text-[10px]">({data.count})</span>
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
