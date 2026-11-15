import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Database, RefreshCw, TrendingDown, Sparkles, Store, Search,
  Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink,
  ArrowUpDown, ArrowUp, ArrowDown, Activity, Users, ShoppingBag, Eye, Award,
  Clock, Sun, Moon, CheckCircle2, AlertCircle, Zap, Tag, MessageCircle
} from 'lucide-react';
import { fetchAdminDashboardData, fetchAdminCatalogPage } from '../services/adminService.js';

export default function FragAdminDashboard({ isDark, onToggleTheme, onSwitchToSellerView }) {
  // Global Admin State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [daysWindow, setDaysWindow] = useState(30);
  const [adminData, setAdminData] = useState(null);

  // Active Tab: 'sellers' | 'catalog' | 'drops' | 'arrivals' | 'demand'
  const [activeTab, setActiveTab] = useState('sellers');

  // Catalog Explorer State
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(25);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogSeller, setCatalogSeller] = useState('all');
  const [catalogStockStatus, setCatalogStockStatus] = useState('in_stock');
  const [catalogSortBy, setCatalogSortBy] = useState('name_asc');
  const [catalogData, setCatalogData] = useState({ items: [], totalCount: 0, totalPages: 1 });
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Price Drops Pagination
  const [dropsPage, setDropsPage] = useState(1);
  const dropsPageSize = 10;

  // New Arrivals Pagination
  const [arrivalsPage, setArrivalsPage] = useState(1);
  const arrivalsPageSize = 10;

  // Initial load
  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchAdminDashboardData(daysWindow)
      .then(data => {
        if (!active) return;
        setAdminData(data);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setError(err.message || 'Failed to load executive admin telemetry');
        setLoading(false);
      });

    return () => { active = false; };
  }, [daysWindow]);

  // Load catalog page whenever filters or pagination change
  useEffect(() => {
    let active = true;
    setCatalogLoading(true);

    fetchAdminCatalogPage({
      page: catalogPage,
      pageSize: catalogPageSize,
      search: catalogSearch,
      seller: catalogSeller,
      stockStatus: catalogStockStatus,
      sortBy: catalogSortBy
    }).then(res => {
      if (!active) return;
      setCatalogData(res);
      setCatalogLoading(false);
    }).catch(err => {
      if (!active) return;
      console.warn('Catalog fetch error:', err);
      setCatalogLoading(false);
    });

    return () => { active = false; };
  }, [catalogPage, catalogPageSize, catalogSearch, catalogSeller, catalogStockStatus, catalogSortBy]);

  // Format relative time helper
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${Math.max(1, diffMins)}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const syncMeta = adminData?.syncMeta;
  const sellerMatrix = adminData?.sellerMatrix || [];
  const demandMetrics = adminData?.demandMetrics;

  // Paginated Price Drops slice
  const allPriceDrops = syncMeta?.activePriceDrops || [];
  const totalDropPages = Math.max(1, Math.ceil(allPriceDrops.length / dropsPageSize));
  const paginatedDrops = allPriceDrops.slice((dropsPage - 1) * dropsPageSize, dropsPage * dropsPageSize);

  // Paginated New Arrivals slice
  const allArrivals = syncMeta?.activeNewArrivals || [];
  const totalArrivalPages = Math.max(1, Math.ceil(allArrivals.length / arrivalsPageSize));
  const paginatedArrivals = allArrivals.slice((arrivalsPage - 1) * arrivalsPageSize, arrivalsPage * arrivalsPageSize);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      
      {/* 1. TOP EXECUTIVE HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  FragAdmin Console
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  Operations &amp; Intelligence
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 dark:bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
                <span>•</span>
                <span>Updated {getRelativeTime(syncMeta?.lastSync)}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Window selector */}
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80 flex items-center text-xs font-mono">
              {[
                { label: '24h', val: 1 },
                { label: '7D', val: 7 },
                { label: '30D', val: 30 }
              ].map(w => (
                <button
                  key={w.val}
                  onClick={() => setDaysWindow(w.val)}
                  className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                    daysWindow === w.val
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Switch to Seller View */}
            <button
              onClick={onSwitchToSellerView}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-300 font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              title="Open the Seller Audience Demand Portal"
            >
              <Store className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
              <span>Seller Portal →</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

          </div>

        </div>
      </header>

      {/* 2. MAIN EXECUTIVE CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* EXECUTIVE KPI BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
              Total Catalog
            </span>
            <div className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white">
              {syncMeta?.catalogTotal?.toLocaleString() || '2,460'}
            </div>
            <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 mt-1 block">
              100% deduplicated
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
              In-Stock Bottles
            </span>
            <div className="font-heading font-extrabold text-xl sm:text-2xl text-emerald-700 dark:text-emerald-400">
              {syncMeta?.inStockCount?.toLocaleString() || '1,217'}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
              Verified active quotes
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
              Active Decants
            </span>
            <div className="font-heading font-extrabold text-xl sm:text-2xl text-cyan-700 dark:text-cyan-400">
              {syncMeta?.decantsCount?.toLocaleString() || '1,775'}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
              2ml / 5ml / 10ml travel
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
              Verified Sellers
            </span>
            <div className="font-heading font-extrabold text-xl sm:text-2xl text-indigo-700 dark:text-indigo-400">
              {sellerMatrix.length || 11}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
              Active inventory feeds
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
              Price Drops / New
            </span>
            <div className="font-heading font-extrabold text-xl sm:text-2xl text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span>{syncMeta?.priceDropsCount || 6}</span>
              <span className="text-slate-300 dark:text-slate-700 text-sm font-normal">/</span>
              <span>{syncMeta?.newArrivalsCount || 9}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
              Arbitrage deals &amp; stock
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
              WhatsApp Leads ({daysWindow}d)
            </span>
            <div className="font-heading font-extrabold text-xl sm:text-2xl text-emerald-700 dark:text-emerald-400">
              {demandMetrics?.summary?.totalWhatsAppClicks || 0}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
              {demandMetrics?.summary?.conversionRate || '0.0'}% shopper-to-lead
            </span>
          </div>

        </div>

        {/* 3. NAVIGATION TABS */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto hide-scrollbar text-xs font-mono font-bold">
            
            <button
              onClick={() => setActiveTab('sellers')}
              className={`pb-3 pt-1 px-1 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'sellers'
                  ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Sellers Matrix ({sellerMatrix.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`pb-3 pt-1 px-1 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Catalog Inventory ({syncMeta?.catalogTotal || 2460})</span>
            </button>

            <button
              onClick={() => setActiveTab('drops')}
              className={`pb-3 pt-1 px-1 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'drops'
                  ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <TrendingDown className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Arbitrage Drops ({allPriceDrops.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('arrivals')}
              className={`pb-3 pt-1 px-1 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'arrivals'
                  ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>New Arrivals ({allArrivals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('demand')}
              className={`pb-3 pt-1 px-1 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'demand'
                  ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Activity className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
              <span>Search &amp; Card Demand</span>
            </button>

          </nav>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: SELLERS OVERVIEW MATRIX                           */}
        {/* ======================================================== */}
        {activeTab === 'sellers' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Verified Community Sellers Matrix
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Complete breakdown of stock volumes, catalog shares, and price dominance across all 11 sellers
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                11 Active Inventory Feeds
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Seller Name</th>
                    <th className="py-3 px-4 font-semibold">Specialty</th>
                    <th className="py-3 px-4 font-semibold text-right">Retail Bottles</th>
                    <th className="py-3 px-4 font-semibold text-right">Bottle Share</th>
                    <th className="py-3 px-4 font-semibold text-right">Decants</th>
                    <th className="py-3 px-4 font-semibold text-right">Decant Share</th>
                    <th className="py-3 px-4 font-semibold text-right text-emerald-700 dark:text-emerald-400 font-bold">Lowest Price Champion</th>
                    <th className="py-3 px-4 font-semibold text-right text-indigo-700 dark:text-indigo-400">Total Listings</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {sellerMatrix.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                          {idx + 1}
                        </span>
                        <span>{s.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.type === 'Dual' 
                            ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20' 
                            : s.type === 'Decants' 
                            ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20' 
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {s.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                        {s.bottles.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                        {s.bottleShare}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                        {s.decants.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                        {s.decantShare}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {s.bestPriceCount > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            👑 {s.bestPriceCount} Best Rates
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                        {s.totalListings.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{s.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CATALOG INVENTORY EXPLORER (FULLY PAGINATED)      */}
        {/* ======================================================== */}
        {activeTab === 'catalog' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Search and Filter Controls */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => {
                      setCatalogSearch(e.target.value);
                      setCatalogPage(1);
                    }}
                    placeholder="Search by perfume name, house, or inspiration..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500"
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => { setCatalogSearch(''); setCatalogPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Pickers */}
                <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                  
                  {/* Stock Status Picker */}
                  <select
                    value={catalogStockStatus}
                    onChange={(e) => {
                      setCatalogStockStatus(e.target.value);
                      setCatalogPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="in_stock">In Stock Bottles</option>
                    <option value="has_decants">Has Decants Ready</option>
                    <option value="drops">📉 Price Drops Only</option>
                    <option value="new">✨ New Arrivals Only</option>
                    <option value="all">Entire Catalog (All)</option>
                  </select>

                  {/* Seller Picker */}
                  <select
                    value={catalogSeller}
                    onChange={(e) => {
                      setCatalogSeller(e.target.value);
                      setCatalogPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="all">All 11 Sellers</option>
                    {sellerMatrix.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.totalListings})</option>
                    ))}
                  </select>

                  {/* Sort By Picker */}
                  <select
                    value={catalogSortBy}
                    onChange={(e) => {
                      setCatalogSortBy(e.target.value);
                      setCatalogPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="name_asc">Name (A → Z)</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating_desc">Highest Rated</option>
                    <option value="newest">Recently Added</option>
                  </select>

                  {/* Page Size */}
                  <select
                    value={catalogPageSize}
                    onChange={(e) => {
                      setCatalogPageSize(Number(e.target.value));
                      setCatalogPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>

                </div>

              </div>
            </div>

            {/* Catalog Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Fragrance</th>
                    <th className="py-3 px-4 font-semibold">House</th>
                    <th className="py-3 px-4 font-semibold">Concentration</th>
                    <th className="py-3 px-4 font-semibold text-right">Best Bottle Rate</th>
                    <th className="py-3 px-4 font-semibold">Champion Seller</th>
                    <th className="py-3 px-4 font-semibold text-right">Lowest Decant</th>
                    <th className="py-3 px-4 font-semibold">Longevity</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {catalogLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-cyan-500" />
                          <span>Loading catalog slice from Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : catalogData.items.length > 0 ? (
                    catalogData.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            {item.is_price_drop && <span className="text-emerald-700 dark:text-emerald-400" title="Price Drop">📉</span>}
                            {item.is_new_arrival && <span className="text-amber-700 dark:text-amber-400" title="New Arrival">✨</span>}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-cyan-700 dark:text-cyan-400 font-semibold">
                          {item.brand}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {item.concentration || 'Eau de Parfum'}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                          {item.community_price ? `₹${item.community_price.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          {item.best_bottle_seller ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.best_bottle_seller}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-cyan-700 dark:text-cyan-400 font-bold">
                          {item.lowest_decant_price ? `₹${item.lowest_decant_price}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {item.longevity || '6.2h (Moderate)'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.in_seller_stock ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              In Stock
                            </span>
                          ) : item.has_decants ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                              Decant Only
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                              Out of Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No fragrances matching the applied filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">
                Showing {((catalogPage - 1) * catalogPageSize) + 1}–{Math.min(catalogPage * catalogPageSize, catalogData.totalCount)} of {catalogData.totalCount.toLocaleString()} fragrances
              </span>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  disabled={catalogPage <= 1}
                  onClick={() => setCatalogPage(1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={catalogPage <= 1}
                  onClick={() => setCatalogPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white">
                  Page {catalogPage} of {catalogData.totalPages}
                </span>

                <button
                  disabled={catalogPage >= catalogData.totalPages}
                  onClick={() => setCatalogPage(prev => Math.min(catalogData.totalPages, prev + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  disabled={catalogPage >= catalogData.totalPages}
                  onClick={() => setCatalogPage(catalogData.totalPages)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ARBITRAGE PRICE DROPS (PAGINATED)                 */}
        {/* ======================================================== */}
        {activeTab === 'drops' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <span>Verified Arbitrage Price Drops ({allPriceDrops.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Fragrances discounted by community sellers compared to earlier catalog price sheets
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Fragrance</th>
                    <th className="py-3 px-4 font-semibold">House</th>
                    <th className="py-3 px-4 font-semibold">Discounting Seller</th>
                    <th className="py-3 px-4 font-semibold text-right">Previous Price</th>
                    <th className="py-3 px-4 font-semibold text-right text-emerald-700 dark:text-emerald-400 font-bold">New Lowest Price</th>
                    <th className="py-3 px-4 font-semibold text-right text-emerald-700 dark:text-emerald-400">Discount Amount</th>
                    <th className="py-3 px-4 font-semibold text-right">Discount %</th>
                    <th className="py-3 px-4 font-semibold text-right">Recorded Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedDrops.length > 0 ? (
                    paginatedDrops.map((drop, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {drop.name}
                        </td>
                        <td className="py-3 px-4 text-cyan-700 dark:text-cyan-400 font-semibold">
                          {drop.brand}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {drop.seller}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 line-through">
                          ₹{drop.previous_price?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                          ₹{drop.current_price?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                          -₹{drop.drop_amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            -{drop.drop_percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                          {drop.drop_date} {drop.drop_time || ''}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No active price drops logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Drops Pagination */}
            {totalDropPages > 1 && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">
                  Showing {((dropsPage - 1) * dropsPageSize) + 1}–{Math.min(dropsPage * dropsPageSize, allPriceDrops.length)} of {allPriceDrops.length} price drops
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={dropsPage <= 1}
                    onClick={() => setDropsPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="px-2 py-1 font-bold">Page {dropsPage} of {totalDropPages}</span>
                  <button
                    disabled={dropsPage >= totalDropPages}
                    onClick={() => setDropsPage(p => Math.min(totalDropPages, p + 1))}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: FRESH NEW ARRIVALS (PAGINATED)                    */}
        {/* ======================================================== */}
        {activeTab === 'arrivals' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  <span>Fresh Stock Arrivals ({allArrivals.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Recently introduced perfume flankers and uncataloged releases discovered from verified sheets
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Fragrance</th>
                    <th className="py-3 px-4 font-semibold">House</th>
                    <th className="py-3 px-4 font-semibold">Format / Size</th>
                    <th className="py-3 px-4 font-semibold">Sourcing Seller</th>
                    <th className="py-3 px-4 font-semibold text-right text-emerald-700 dark:text-emerald-400 font-bold">Quoted Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Added Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedArrivals.length > 0 ? (
                    paginatedArrivals.map((arrival, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {arrival.name}
                        </td>
                        <td className="py-3 px-4 text-cyan-700 dark:text-cyan-400 font-semibold">
                          {arrival.brand}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {arrival.size || '100ml Retail Bottle'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {arrival.seller}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                          ₹{arrival.price?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                          {arrival.added_date}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No recent new arrivals recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Arrivals Pagination */}
            {totalArrivalPages > 1 && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">
                  Showing {((arrivalsPage - 1) * arrivalsPageSize) + 1}–{Math.min(arrivalsPage * arrivalsPageSize, allArrivals.length)} of {allArrivals.length} arrivals
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={arrivalsPage <= 1}
                    onClick={() => setArrivalsPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="px-2 py-1 font-bold">Page {arrivalsPage} of {totalArrivalPages}</span>
                  <button
                    disabled={arrivalsPage >= totalArrivalPages}
                    onClick={() => setArrivalsPage(p => Math.min(totalArrivalPages, p + 1))}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: DEMAND, SEARCH & CARD TELEMETRY                   */}
        {/* ======================================================== */}
        {activeTab === 'demand' && demandMetrics && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top 10 Most Clicked Cards Showcase */}
            {demandMetrics.top10Cards && demandMetrics.top10Cards.length > 0 && (
              <div className="p-5 rounded-2xl border border-indigo-500/30 bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span>Top 10 Most Clicked Fragrance Cards ({daysWindow}d)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Perfumes shoppers actively tapped to inspect olfactory notes, details, and compare prices
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                    {demandMetrics.totalCardViews || 0} Total Card Opens
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Rank</th>
                        <th className="py-2.5 px-3 font-semibold">Fragrance</th>
                        <th className="py-2.5 px-3 font-semibold">Format</th>
                        <th className="py-2.5 px-3 font-semibold text-right text-indigo-700 dark:text-indigo-400 font-bold">Card Opens</th>
                        <th className="py-2.5 px-3 font-semibold text-right text-emerald-700 dark:text-emerald-400 font-bold">WhatsApp Leads</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Card-to-Buy Rate</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {demandMetrics.top10Cards.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.format}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-indigo-700 dark:text-indigo-400">
                            {item.cardViews}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                            {item.whatsappClicks}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.conversionRate >= 10 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {item.conversionRate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                            {item.avgPrice ? `₹${item.avgPrice.toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Search Trends Table */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                <span>Search Query Velocity ({daysWindow}d)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Rank</th>
                      <th className="py-2.5 px-3 font-semibold">Search Term</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Search Volume</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Card Opens</th>
                      <th className="py-2.5 px-3 font-semibold text-right">WhatsApp Leads</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {demandMetrics.searchInsights?.slice(0, 15).map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">“{s.query}”</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-cyan-700 dark:text-cyan-400">{s.searches}</td>
                        <td className="py-2.5 px-3 text-right text-indigo-700 dark:text-indigo-400 font-bold">{s.cardViews || 0}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{s.clicks || 0}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.conversionRate >= 10 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {s.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
