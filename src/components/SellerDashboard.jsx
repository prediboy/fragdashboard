import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MessageCircle,
  FlaskConical,
  Package,
  Calendar,
  Share2,
  Check,
  RefreshCw,
  Flame,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Sun,
  Moon,
  ExternalLink,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { getSellerDemandMetrics } from '../services/sellerAnalyticsService.js';

export default function SellerDashboard({ isDark, onToggleTheme }) {
  const [datePreset, setDatePreset] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('range');
      return ['today', '7d', '14d', '30d', 'all', 'custom'].includes(p) ? p : '30d';
    } catch {
      return '30d';
    }
  });

  const [activeTab, setActiveTab] = useState('searches'); // 'searches' | 'bottles' | 'decants'
  const [searchFilter, setSearchFilter] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const data = await getSellerDemandMetrics({
        preset: datePreset,
        customStart: customStart || null,
        customEnd: customEnd || null,
        forceRefresh: force
      });
      setMetrics(data);
    } catch (err) {
      console.error('Error loading demand metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [datePreset, customStart, customEnd]);

  // Sync date preset to URL query params for shareability
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (datePreset !== '30d') url.searchParams.set('range', datePreset);
      else url.searchParams.delete('range');
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [datePreset]);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {}
  };

  // Filtered search insights
  const filteredSearches = useMemo(() => {
    if (!metrics?.searchInsights) return [];
    if (!searchFilter.trim()) return metrics.searchInsights;
    const q = searchFilter.toLowerCase().trim();
    return metrics.searchInsights.filter(s => s.query.includes(q));
  }, [metrics?.searchInsights, searchFilter]);

  // Filtered bottles
  const filteredBottles = useMemo(() => {
    if (!metrics?.topBottles) return [];
    if (!searchFilter.trim()) return metrics.topBottles;
    const q = searchFilter.toLowerCase().trim();
    return metrics.topBottles.filter(b => b.name.toLowerCase().includes(q));
  }, [metrics?.topBottles, searchFilter]);

  // Filtered decants
  const filteredDecants = useMemo(() => {
    if (!metrics?.topDecants) return [];
    if (!searchFilter.trim()) return metrics.topDecants;
    const q = searchFilter.toLowerCase().trim();
    return metrics.topDecants.filter(d => d.name.toLowerCase().includes(q));
  }, [metrics?.topDecants, searchFilter]);

  // Peak activity day
  const peakDay = useMemo(() => {
    if (!metrics?.dailyVelocity || metrics.dailyVelocity.length === 0) return null;
    return [...metrics.dailyVelocity].sort((a, b) => b.clicks - a.clicks)[0];
  }, [metrics?.dailyVelocity]);

  const maxVelocitySearch = useMemo(() => {
    if (!metrics?.dailyVelocity) return 100;
    return Math.max(...metrics.dailyVelocity.map(d => d.searches), 10);
  }, [metrics?.dailyVelocity]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      
      {/* TOP HEADER */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md font-mono">
              FD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  FragDashboard
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Buyer Demand Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
                What Indian fragrance buyers are searching for, clicking to buy, and bottle vs. decant split
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-400 text-xs font-mono text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-mono font-bold shadow-xs hover:shadow-cyan-500/20 transition-all hover:scale-102"
              title="Copy shareable link with current date range"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-white" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

        </div>

        {/* TIMELINE FILTER BAR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 bg-slate-100/50 dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
            <span className="font-mono text-slate-500 dark:text-slate-400 mr-1 shrink-0 font-medium">Timeline:</span>
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '14d', label: 'Last 14 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-all shrink-0 font-medium ${
                  datePreset === p.id
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:block">
            {metrics ? `${metrics.totalSearches.toLocaleString()} searches • ${metrics.totalWhatsAppClicks} purchase clicks` : 'Loading live metrics...'}
          </div>
        </div>

        {/* Custom date range inputs */}
        {datePreset === 'custom' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 bg-cyan-500/5 border-t border-cyan-500/20 flex flex-wrap items-center gap-3 text-xs font-mono">
            <span>From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200"
            />
            <span>To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200"
            />
            <span className="text-slate-400 text-[11px]">(Auto bounded)</span>
          </div>
        )}

      </header>

      {/* DASHBOARD CONTENT BODY */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* 1. TOP CORE DEMAND SIGNALS (KPI CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Buyer Searches */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Total Buyer Searches</span>
              <Search className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {metrics ? metrics.totalSearches.toLocaleString() : '...'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              In-app queries from buyers looking to buy
            </p>
          </div>

          {/* WhatsApp Buy Clicks */}
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">WhatsApp Buy Clicks</span>
              <MessageCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {metrics ? metrics.totalWhatsAppClicks.toLocaleString() : '...'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Shoppers clicking "Buy on WhatsApp"
            </p>
          </div>

          {/* Full Bottles vs Decants Preference */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs sm:col-span-2">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Buyer Format Split (Full Bottles vs Decants)
              </span>
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-cyan-500" />
                <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
              </div>
            </div>

            <div className="flex items-baseline justify-between font-mono mt-1">
              <div>
                <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {metrics ? `${metrics.bottlePercentage}%` : '...'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                  Full Bottles ({metrics?.totalBottleClicks || 0} leads)
                </span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold text-amber-500">
                  {metrics ? `${metrics.decantPercentage}%` : '...'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                  Decants ({metrics?.totalDecantClicks || 0} leads)
                </span>
              </div>
            </div>

            {/* Split progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex mt-2.5">
              <div
                className="bg-cyan-500 h-full transition-all duration-500"
                style={{ width: `${metrics?.bottlePercentage || 80}%` }}
                title={`Full Bottles: ${metrics?.bottlePercentage || 80}%`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${metrics?.decantPercentage || 20}%` }}
                title={`Decants: ${metrics?.decantPercentage || 20}%`}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
              💡 8 out of 10 buyers look for retail bottles; decants surge for premium / blind-buy tests.
            </p>
          </div>

        </div>

        {/* 2. DAILY VELOCITY TIMELINE (SEARCHES VS BUY CLICKS) */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                <span>Search Volume vs. Inbound WhatsApp Buy Clicks</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Day-by-day buyer demand velocity across Indian community sellers
              </p>
            </div>
            {peakDay && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-mono text-emerald-700 dark:text-emerald-300">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Peak Buy Day: <strong>{peakDay.date}</strong> ({peakDay.clicks} WhatsApp clicks, {peakDay.searches} searches)</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-44 flex items-center justify-center font-mono text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2 text-cyan-500" />
              Loading timeline velocity...
            </div>
          ) : metrics?.dailyVelocity && metrics.dailyVelocity.length > 0 ? (
            <div className="space-y-2">
              <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                {metrics.dailyVelocity.map((d, idx) => {
                  const searchHeight = Math.max((d.searches / maxVelocitySearch) * 100, 5);
                  const isPeak = peakDay?.date === d.date;
                  return (
                    <div key={idx} className="flex-1 min-w-[34px] flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-md shadow-lg pointer-events-none z-20 whitespace-nowrap border border-slate-700">
                        <span>{d.date}</span>
                        <span className="text-cyan-400">{d.searches} Searches</span>
                        <span className="text-emerald-400">{d.clicks} WhatsApp Buy Clicks</span>
                      </div>

                      {/* Bar columns */}
                      <div className="w-full flex items-end justify-center gap-1 h-32">
                        <div
                          className={`w-3 sm:w-4 rounded-t-sm transition-all duration-300 ${
                            isPeak ? 'bg-cyan-500' : 'bg-cyan-500/60 group-hover:bg-cyan-500'
                          }`}
                          style={{ height: `${searchHeight}%` }}
                        />
                        <div
                          className="w-2.5 sm:w-3 bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-400"
                          style={{ height: `${Math.max((d.clicks / (maxVelocitySearch / 3)) * 100, d.clicks > 0 ? 8 : 2)}%` }}
                        />
                      </div>

                      {/* X Axis Label */}
                      <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center">
                        {d.date.split(' ')[1] || d.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-end gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500" />
                  <span>Buyer Searches</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  <span>WhatsApp Buy Clicks</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center font-mono text-xs text-slate-400">
              No daily activity recorded for the selected range.
            </div>
          )}
        </div>

        {/* 3. NAVIGATION TABS: WHAT PEOPLE SEARCH FOR vs TOP BOTTLES vs TOP DECANTS */}
        <div className="space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            
            {/* View switcher tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveTab('searches'); setSearchFilter(''); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                  activeTab === 'searches'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-cyan-400'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Terms & WhatsApp Conversion ({metrics?.searchInsights?.length || 0})</span>
              </button>

              <button
                onClick={() => { setActiveTab('bottles'); setSearchFilter(''); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                  activeTab === 'bottles'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-cyan-400'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Top Clicked Full Bottles ({metrics?.topBottles?.length || 0})</span>
              </button>

              <button
                onClick={() => { setActiveTab('decants'); setSearchFilter(''); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                  activeTab === 'decants'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-cyan-400'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Top Clicked Decants ({metrics?.topDecants?.length || 0})</span>
              </button>
            </div>

            {/* In-table search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === 'searches'
                    ? "Filter search terms..."
                    : activeTab === 'bottles'
                    ? "Filter bottles or brands..."
                    : "Filter decants..."
                }
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-hidden focus:border-cyan-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

          </div>

          {/* TAB 1: WHAT BUYERS ARE SEARCHING FOR & WHATSAPP CONVERSION */}
          {activeTab === 'searches' && (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-500" />
                    <span>Search Term Conversion Rate & WhatsApp Demand</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    For every search query: how many times searched, unique shoppers searching, and how many clicked WhatsApp to buy
                  </p>
                </div>
                <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800/60">
                  ⚡ High-intent restock targets
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">#</th>
                      <th className="py-3 px-4 font-semibold">Search Term</th>
                      <th className="py-3 px-4 font-semibold text-right">Search Volume</th>
                      <th className="py-3 px-4 font-semibold text-right">Unique Shoppers</th>
                      <th className="py-3 px-4 font-semibold text-right text-emerald-600 dark:text-emerald-400">WhatsApp Buy Clicks</th>
                      <th className="py-3 px-4 font-semibold text-right">Search-to-Buy Rate</th>
                      <th className="py-3 px-4 font-semibold">Demand Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredSearches.length > 0 ? (
                      filteredSearches.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-4 font-heading font-bold text-slate-800 dark:text-slate-200 text-sm capitalize">
                            {item.query}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                            {item.searches} <span className="text-[10px] text-slate-400 font-normal">({item.share}%)</span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                            {item.uniqueShoppers}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            {item.whatsappClicks} clicks
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded-md font-bold ${
                              item.conversionRate >= 50
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : item.conversionRate >= 25
                                ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {item.conversionRate}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {item.unmetDemand ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                Unmet Demand / Low Stock
                              </span>
                            ) : item.conversionRate >= 50 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                                <Flame className="w-3 h-3 text-emerald-500" />
                                High Conversion Target
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Regular Volume
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No matching search queries found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: WHICH BOTTLES ARE PEOPLE CLICKING ON MOST */}
          {activeTab === 'bottles' && (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-cyan-500" />
                    <span>Top Clicked Full Bottles (Customer WhatsApp Inquiries)</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Which exact retail bottles buyers click "Buy on WhatsApp" to purchase most frequently
                  </p>
                </div>
                <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800/60">
                  {metrics?.totalBottleClicks || 0} Total Bottle Buy Inquiries
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Rank</th>
                      <th className="py-3 px-4 font-semibold">Perfume Name</th>
                      <th className="py-3 px-4 font-semibold text-right text-emerald-600 dark:text-emerald-400">WhatsApp Buy Clicks</th>
                      <th className="py-3 px-4 font-semibold text-right">Bottle Market Share</th>
                      <th className="py-3 px-4 font-semibold text-right">Avg Clicked Price</th>
                      <th className="py-3 px-4 font-semibold">Demand Velocity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredBottles.length > 0 ? (
                      filteredBottles.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-bold">
                            <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center font-bold text-[11px] ${
                              idx === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' :
                              idx === 1 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' :
                              idx === 2 ? 'bg-amber-700/20 text-amber-700 dark:text-amber-300' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-heading font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {item.name}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {item.clicks} leads
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                            {item.share}%
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                            {item.avgPrice ? `₹${item.avgPrice.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            {idx < 3 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                                <Flame className="w-3 h-3 text-amber-500" />
                                Top Seller (#1-3)
                              </span>
                            ) : item.clicks >= 6 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800/50">
                                <TrendingUp className="w-3 h-3 text-cyan-500" />
                                Fast Mover
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Consistent Interest
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No matching bottles found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: WHICH DECANTS ARE PEOPLE CLICKING ON MOST */}
          {activeTab === 'decants' && (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-500" />
                    <span>Top Clicked Decants (Sample & Trial Demand)</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Which fragrances buyers want to test in 5ml/10ml/30ml decants before committing to full bottles
                  </p>
                </div>
                <div className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
                  {metrics?.totalDecantClicks || 0} Total Decant Inquiries
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Rank</th>
                      <th className="py-3 px-4 font-semibold">Perfume Name</th>
                      <th className="py-3 px-4 font-semibold text-right text-emerald-600 dark:text-emerald-400">WhatsApp Decant Clicks</th>
                      <th className="py-3 px-4 font-semibold text-right">Decant Market Share</th>
                      <th className="py-3 px-4 font-semibold text-right">Avg Clicked Price</th>
                      <th className="py-3 px-4 font-semibold">Trial Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredDecants.length > 0 ? (
                      filteredDecants.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-bold">
                            <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center font-bold text-[11px] ${
                              idx === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' :
                              idx === 1 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-heading font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {item.name}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {item.clicks} leads
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                            {item.share}%
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                            {item.avgPrice ? `₹${item.avgPrice.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            {idx < 2 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                High Test Demand
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Steady Decant Trials
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No matching decants found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* 4. RESTOCK RECOMMENDATION FOOTER FOR SELLERS */}
        <div className="p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-emerald-500/5 to-transparent flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-cyan-900 dark:text-cyan-200">
            <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>
              <strong>Key Restock Rule:</strong> Bottles with &gt;50% search-to-buy rate (e.g. <em>Hawas Ice</em>, <em>Afnan 9 PM</em>, <em>Marwa</em>) generate the highest return per unit stocked.
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Data powered by live community shopper telemetry
          </span>
        </div>

      </main>

    </div>
  );
}
