import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md w-full bg-[#0e1621] border border-[#2b394a] rounded-2xl p-8 shadow-2xl space-y-6 animate-fade-in">
        <div className="text-6xl animate-bounce">💰</div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Save Manager
        </h1>
        <p className="text-sm text-[#708499]">
          Frontend SPA Scaffolded Successfully.
        </p>
        <div className="flex flex-col gap-2 pt-4">
          <div className="px-4 py-2 bg-[#24303f] rounded-lg text-xs font-mono text-left border border-[#2c3847]">
            <span className="text-emerald-400">⚡ bundler:</span> vite-plugin-singlefile
          </div>
          <div className="px-4 py-2 bg-[#24303f] rounded-lg text-xs font-mono text-left border border-[#2c3847]">
            <span className="text-[#64b5f6]">🎨 styles:</span> tailwindcss v4
          </div>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
