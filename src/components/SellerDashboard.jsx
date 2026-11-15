import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Search,
  Users,
  ShoppingBag,
  Calendar,
  Share2,
  Check,
  RefreshCw,
  Store,
  Flame,
  ArrowUpRight,
  PieChart,
  Eye,
  Filter,
  Sparkles,
  FlaskConical,
  MessageCircle,
  HelpCircle,
  Globe,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';
import { getSellerDashboardMetrics } from '../services/sellerAnalyticsService.js';

export default function SellerDashboard({ isDark, onToggleTheme }) {
  const [datePreset, setDatePreset] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('range');
      return ['today', '7d', '14d', '30d', 'all', 'custom'].includes(p) ? p : '30d';
    } catch {
      return '30d';
    }
  });

  const [selectedSeller, setSelectedSeller] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('seller') || 'all';
    } catch {
      return 'all';
    }
  });

  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchTermFilter, setSearchTermFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load metrics when filters change
  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const data = await getSellerDashboardMetrics({
        preset: datePreset,
        customStart: customStart || null,
        customEnd: customEnd || null,
        selectedSeller,
        forceRefresh: force
      });
      setMetrics(data);
    } catch (err) {
      console.error('Error loading seller dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [datePreset, customStart, customEnd, selectedSeller]);

  // Sync state to URL for easy bookmarking & sharing
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (datePreset !== '30d') url.searchParams.set('range', datePreset);
      else url.searchParams.delete('range');

      if (selectedSeller !== 'all') url.searchParams.set('seller', selectedSeller);
      else url.searchParams.delete('seller');

      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [datePreset, selectedSeller]);

  // Share / Copy Dashboard Link
  const handleCopyLink = () => {
    try {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  // Filtered Top Search Queries
  const filteredSearches = useMemo(() => {
    if (!metrics?.topSearches) return [];
    if (!searchTermFilter.trim()) return metrics.topSearches.slice(0, 20);
    const q = searchTermFilter.toLowerCase().trim();
    return metrics.topSearches.filter(s => s.query.includes(q)).slice(0, 25);
  }, [metrics?.topSearches, searchTermFilter]);

  // Peak activity day
  const peakDay = useMemo(() => {
    if (!metrics?.dailyTrends || metrics.dailyTrends.length === 0) return null;
    return [...metrics.dailyTrends].sort((a, b) => b.leads - a.leads)[0];
  }, [metrics?.dailyTrends]);

  const maxDailySearches = useMemo(() => {
    if (!metrics?.dailyTrends) return 100;
    return Math.max(...metrics.dailyTrends.map(d => d.searches), 10);
  }, [metrics?.dailyTrends]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      
      {/* TOP HEADER & CONTROLS */}
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
                  Seller Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
                Real-Time Buyer Demand & WhatsApp Leads Engine
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <a
              href="https://fragscanner.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

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
              title="Copy shareable link with current date and seller filters"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-white" />
                  <span>Share Link</span>
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

        {/* FILTER BAR: DATES & SELLER SELECTOR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 bg-slate-100/50 dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Date range filter pills */}
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

          {/* Seller filter dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <label className="font-mono text-slate-500 dark:text-slate-400 shrink-0">Store Focus:</label>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
            >
              <option value="all">All Community Sellers (Market Overview)</option>
              {(metrics?.sellersList || []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Custom date range inputs when 'custom' is active */}
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
            <span className="text-slate-400 text-[11px]">(Leave empty for auto bounds)</span>
          </div>
        )}

      </header>

      {/* DASHBOARD CONTENT BODY */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* STORE FOCUS BANNER (IF SPECIFIC SELLER SELECTED) */}
        {selectedSeller !== 'all' && (
          <div className="p-3.5 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-emerald-500/5 to-transparent flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-300 font-bold font-mono">
                {selectedSeller.charAt(0)}
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Focused Store: {selectedSeller}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                  Showing customer WhatsApp purchase leads and perfume inquiries specifically directed to your store.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSeller('all')}
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-mono text-xs font-medium"
            >
              Reset to All Sellers
            </button>
          </div>
        )}

        {/* 1. CORE KPI CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Total Buyer Searches */}
          <div className="col-span-1 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Total Searches</span>
              <Search className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {metrics ? metrics.totalSearches.toLocaleString() : '...'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              In-app queries from buyers
            </p>
          </div>

          {/* WhatsApp Purchase Leads */}
          <div className="col-span-1 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">WhatsApp Leads</span>
              <MessageCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {metrics ? (selectedSeller !== 'all' ? metrics.selectedSellerLeads : metrics.totalLeads) : '...'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {selectedSeller !== 'all' ? `Direct leads for ${selectedSeller}` : 'Total buy inquiries initiated'}
            </p>
          </div>

          {/* Visitor-to-Lead Conversion Rate */}
          <div className="col-span-1 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Conversion Rate</span>
              <TrendingUp className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
              {metrics ? `${metrics.conversionRate}%` : '...'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Shoppers tapping Buy button
            </p>
          </div>

          {/* Unique Shopper Visitors */}
          <div className="col-span-1 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Unique Shoppers</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {metrics ? metrics.totalVisitors.toLocaleString() : '...'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Distinct buyer sessions
            </p>
          </div>

          {/* Format Demand Split */}
          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Bottles vs Decants</span>
              <FlaskConical className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {metrics ? `${metrics.bottlePercentage}%` : '...'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Full</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-lg font-bold text-amber-500">
                {metrics ? `${metrics.decantPercentage}%` : '...'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Decant</span>
            </div>
            {/* Progress split bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex mt-2">
              <div
                className="bg-cyan-500 h-full"
                style={{ width: `${metrics?.bottlePercentage || 80}%` }}
                title={`Full Bottles: ${metrics?.bottlePercentage || 80}%`}
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${metrics?.decantPercentage || 20}%` }}
                title={`Decants: ${metrics?.decantPercentage || 20}%`}
              />
            </div>
          </div>

        </div>

        {/* 2. DAILY VELOCITY CHART (SEARCHES & WHATSAPP LEADS OVER TIME) */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-500" />
                <span>Search Activity & Inbound Leads Velocity</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Daily timeline showing buyer intent surges vs. actual purchase clicks
              </p>
            </div>
            {peakDay && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-xs font-mono text-cyan-700 dark:text-cyan-300">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Peak Traffic: <strong>{peakDay.date}</strong> ({peakDay.leads} leads, {peakDay.searches} searches)</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-44 flex items-center justify-center font-mono text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2 text-cyan-500" />
              Loading timeline velocity...
            </div>
          ) : metrics?.dailyTrends && metrics.dailyTrends.length > 0 ? (
            <div className="space-y-2">
              <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                {metrics.dailyTrends.map((d, idx) => {
                  const searchHeight = Math.max((d.searches / maxDailySearches) * 100, 4);
                  const isPeak = peakDay?.date === d.date;
                  return (
                    <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-md shadow-lg pointer-events-none z-20 whitespace-nowrap border border-slate-700">
                        <span>{d.date}</span>
                        <span className="text-cyan-400">{d.searches} Searches</span>
                        <span className="text-emerald-400">{d.leads} WhatsApp Leads</span>
                      </div>

                      {/* Bar columns */}
                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        {/* Searches bar */}
                        <div
                          className={`w-3 sm:w-4 rounded-t-sm transition-all duration-300 ${
                            isPeak ? 'bg-cyan-500' : 'bg-cyan-500/60 group-hover:bg-cyan-500'
                          }`}
                          style={{ height: `${searchHeight}%` }}
                        />
                        {/* Leads bar */}
                        <div
                          className="w-2.5 sm:w-3 bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-400"
                          style={{ height: `${Math.max((d.leads / (maxDailySearches / 3)) * 100, d.leads > 0 ? 8 : 2)}%` }}
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
                  <span>WhatsApp Leads</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center font-mono text-xs text-slate-400">
              No daily activity recorded for the selected range.
            </div>
          )}
        </div>

        {/* 3. TWO-COLUMN CORE BREAKDOWN: TOP SEARCHED vs TOP PURCHASE CONVERTED */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: WHAT BUYERS ARE SEARCHING FOR (RESTOCK OPPORTUNITY) */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-500" />
                  <span>Top Searched Fragrances & Houses</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Direct search queries entered by shoppers — prime restock demand
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {metrics?.topSearches?.length || 0} unique terms
              </span>
            </div>

            {/* In-Card Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter search terms (e.g. hawas, afnan, dior)..."
                value={searchTermFilter}
                onChange={(e) => setSearchTermFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-hidden focus:border-cyan-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Search List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px] overflow-y-auto pr-1">
              {filteredSearches.length > 0 ? (
                filteredSearches.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-heading font-medium text-slate-800 dark:text-slate-200 capitalize truncate">
                        {item.query}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.share}% share
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800/50">
                        {item.count} searches
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-mono text-slate-400">
                  No matching search terms found.
                </div>
              )}
            </div>

            {/* Seller Insight Tip */}
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs font-mono text-cyan-800 dark:text-cyan-300 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
              <span>
                <strong>Restock Tip:</strong> Buyers searching terms like <em>"hawas"</em>, <em>"afnan"</em>, and <em>"marwa"</em> convert fastest when priced under market retail.
              </span>
            </div>

          </div>

          {/* RIGHT: TOP PURCHASE DEMANDED PERFUMES (WHATSAPP CLICKS) */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-500" />
                  <span>Top Converted Perfumes</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Fragrances with highest "Buy on WhatsApp" customer lead clicks
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 font-bold">
                {metrics ? (selectedSeller !== 'all' ? `${metrics.selectedSellerLeads} Leads` : `${metrics.totalLeads} Total Leads`) : '...'}
              </span>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px] overflow-y-auto pr-1">
              {metrics?.topDemandedPerfumes && metrics.topDemandedPerfumes.length > 0 ? (
                metrics.topDemandedPerfumes.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' :
                        idx === 1 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' :
                        idx === 2 ? 'bg-amber-700/20 text-amber-700 dark:text-amber-300' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-heading font-medium text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.share}%
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-emerald-500" />
                        <span>{item.leads} leads</span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-mono text-slate-400">
                  No WhatsApp purchase leads recorded for this filter selection.
                </div>
              )}
            </div>

            {/* Seller Insight Tip */}
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs font-mono text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Inventory Insight:</strong> <em>Afnan 9 PM</em> and <em>Rasasi Hawas Ice</em> lead buyer purchase conversions across all 11 community sellers.
              </span>
            </div>

          </div>

        </div>

        {/* 4. SELLER BENCHMARK & COMMUNITY LEAD SHARE */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-cyan-500" />
                <span>Verified Seller Inbound Lead Leaderboard</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Distribution of high-intent purchase clicks across community seller stores
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              11 Pan-India Sellers Synced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics?.topSellers && metrics.topSellers.map((s, idx) => {
              const isSelected = selectedSeller.toLowerCase() === s.seller.toLowerCase();
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedSeller(s.seller)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-cyan-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      {s.seller}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {s.leads} <span className="text-xs font-normal text-slate-500">leads</span>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {s.share}% share
                    </span>
                  </div>
                  {/* Lead share miniature progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(parseFloat(s.share) * 3, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. AUDIENCE REACH & ACQUISITION CHANNELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Acquisition Channels */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-3">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Shopper Acquisition Channels</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Where buyers originate before browsing fragrance inventory
            </p>
            <div className="space-y-2.5 pt-2">
              {(metrics?.trafficSources || []).map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{t.source}</span>
                    <span className="text-slate-400">{t.count} shoppers ({t.share}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${t.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audience Persona & Summary */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-3">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" />
              <span>Audience Demographics & Persona</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Core characteristics of active buyers on FragScanner
            </p>
            <ul className="text-xs space-y-2 pt-2 text-slate-600 dark:text-slate-300 font-mono">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">•</span>
                <span><strong>High Purchase Intent:</strong> 27%+ of unique visitors click directly to contact sellers on WhatsApp.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">•</span>
                <span><strong>Bottle Focused:</strong> Nearly 80% of buyers seek full retail bottles, with decants driving exploratory trials (~20%).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">•</span>
                <span><strong>Middle-Eastern Clones Dominant:</strong> Afnan, Rasasi, Armaf, and Lattafa command over 60% of search volume.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">•</span>
                <span><strong>Speed Matters:</strong> Sellers who list clear prices and respond immediately on WhatsApp win the highest conversion rate.</span>
              </li>
            </ul>
          </div>

        </div>

      </main>

    </div>
  );
}
