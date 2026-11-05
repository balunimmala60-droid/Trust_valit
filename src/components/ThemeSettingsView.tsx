import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette, CheckCircle, Shield, Check, Info } from 'lucide-react';

export const ThemeSettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border shadow-md bg-[#132238] border-[#334155]">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider mb-1.5 text-cyan-400">
          <Palette className="w-4 h-4 text-cyan-400" />
          <span>Enterprise Design System</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Midnight Cyber Blue Theme
        </h1>
        <p className="text-sm mt-1 max-w-2xl leading-relaxed text-slate-300">
          TrustVault is built with the official <strong>Midnight Cyber Blue</strong> cybersecurity design system. Engineered for high visual clarity, zero cognitive friction, accessible contrast ratios, and zero harsh red surfaces.
        </p>
      </div>

      {/* Palette Specifications Card */}
      <div className="p-6 rounded-2xl bg-[#132238] border border-[#334155] shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Official Enterprise Color Tokens
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1B2D45] text-cyan-300 font-mono border border-[#334155]">
            100% WCAG AA Compliant
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#081426] border border-[#334155] space-y-1">
            <span className="text-[10px] text-slate-400 block font-semibold">Main Canvas</span>
            <div className="font-mono text-cyan-300 font-bold text-xs">#081426</div>
            <div className="w-full h-3 rounded bg-[#081426] border border-blue-900/60 mt-1" />
          </div>

          <div className="p-3 rounded-xl bg-[#0D1B2A] border border-[#334155] space-y-1">
            <span className="text-[10px] text-slate-400 block font-semibold">Sidebar & Nav</span>
            <div className="font-mono text-cyan-300 font-bold text-xs">#0D1B2A</div>
            <div className="w-full h-3 rounded bg-[#0D1B2A] border border-blue-900/60 mt-1" />
          </div>

          <div className="p-3 rounded-xl bg-[#132238] border border-[#334155] space-y-1">
            <span className="text-[10px] text-slate-400 block font-semibold">Surface Cards</span>
            <div className="font-mono text-cyan-300 font-bold text-xs">#132238</div>
            <div className="w-full h-3 rounded bg-[#132238] border border-blue-800/60 mt-1" />
          </div>

          <div className="p-3 rounded-xl bg-[#1B2D45] border border-[#334155] space-y-1">
            <span className="text-[10px] text-slate-400 block font-semibold">Elevated Panels</span>
            <div className="font-mono text-cyan-300 font-bold text-xs">#1B2D45</div>
            <div className="w-full h-3 rounded bg-[#1B2D45] border border-blue-700/60 mt-1" />
          </div>

          <div className="p-3 rounded-xl bg-[#2563EB] text-white space-y-1">
            <span className="text-[10px] text-blue-100 block font-semibold">Primary Actions</span>
            <div className="font-mono text-white font-bold text-xs">#2563EB</div>
            <div className="w-full h-3 rounded bg-[#2563EB] border border-white/20 mt-1" />
          </div>

          <div className="p-3 rounded-xl bg-[#1B2D45] border border-[#334155] space-y-1">
            <span className="text-[10px] text-slate-400 block font-semibold">Cyan Accent</span>
            <div className="font-mono text-cyan-300 font-bold text-xs">#22D3EE</div>
            <div className="w-full h-3 rounded bg-[#22D3EE] mt-1" />
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-[#0D1B2A] border border-[#334155] text-xs text-slate-300 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            All security denial containers have been transformed into rich sapphire blue (<code className="text-cyan-300 font-mono">#1e3a8a</code>) with high-contrast text (<code className="text-cyan-200 font-mono">#93c5fd</code> / <code className="text-white font-mono">#FFFFFF</code>) and azure borders (<code className="text-blue-400 font-mono">#3b82f6</code>), completely eliminating jarring red and raw black/white mixes.
          </p>
        </div>
      </div>
    </div>
  );
};
