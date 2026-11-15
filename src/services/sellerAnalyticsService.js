/**
 * sellerAnalyticsService.js
 * 
 * Aggregates live platform telemetry from Supabase for FragDashboard.
 * Filters by Date Range (Preset or Custom) and Seller ID.
 */

import { supabase } from '../lib/supabaseClient.js';

let cachedAllLogs = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache for fast tab switching

/**
 * Fetch telemetry rows from Supabase (paginated to bypass 1,000 row limits)
 */
async function fetchTelemetryRows(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedAllLogs && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedAllLogs;
  }

  let allRows = [];
  let page = 0;
  const pageSize = 1000;

  try {
    if (!supabase) {
      console.warn('[Seller Analytics] Supabase client is null or unconfigured.');
      return [];
    }

    while (true) {
      const { data, error } = await supabase
        .from('wardrobe_logs')
        .select('created_at, session_id, umbrella_title, umbrella_season, liked_perfumes')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < pageSize) break;
      page++;
      // Guard against infinite loop
      if (page > 20) break;
    }

    cachedAllLogs = allRows;
    lastFetchTime = Date.now();
    return allRows;
  } catch (err) {
    console.error('[Seller Analytics] Error fetching telemetry:', err);
    return cachedAllLogs || [];
  }
}

/**
 * Filter telemetry rows by date bounds
 */
function filterRowsByDate(rows, preset = '30d', customStart = null, customEnd = null) {
  const now = new Date();
  let startTime = null;
  let endTime = new Date(now.getTime() + 86400000); // end of current day buffer

  if (preset === 'today') {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    startTime = today;
  } else if (preset === '7d') {
    startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (preset === '14d') {
    startTime = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  } else if (preset === '30d') {
    startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (preset === 'custom' && (customStart || customEnd)) {
    if (customStart) startTime = new Date(customStart);
    if (customEnd) {
      const endD = new Date(customEnd);
      endD.setHours(23, 59, 59, 999);
      endTime = endD;
    }
  }

  if (!startTime) return rows;

  return rows.filter(r => {
    if (!r.created_at) return false;
    const rowDate = new Date(r.created_at);
    return rowDate >= startTime && rowDate <= endTime;
  });
}

/**
 * Parse a raw telemetry row into a typed event
 */
function parseTelemetryRow(row) {
  const title = (row.umbrella_title || '').trim();
  const season = (row.umbrella_season || '').trim();
  const liked = row.liked_perfumes;

  if (title === 'EVENT:session_visit') {
    let payload = {};
    if (Array.isArray(liked) && liked[0] && typeof liked[0] === 'object') {
      payload = liked[0];
    }
    return {
      type: 'session_visit',
      createdAt: row.created_at,
      sessionId: row.session_id,
      referrer: season || 'direct',
      source: payload.source || 'direct',
      utmSource: payload.utm_source || null,
      utmCampaign: payload.utm_campaign || null
    };
  }

  if (title === 'EVENT:search_query') {
    let resultCount = 0;
    if (Array.isArray(liked) && liked[0] && typeof liked[0].result_count === 'number') {
      resultCount = liked[0].result_count;
    }
    return {
      type: 'search_query',
      createdAt: row.created_at,
      sessionId: row.session_id,
      query: (season || '').toLowerCase().trim(),
      resultCount
    };
  }

  if (title === 'EVENT:whatsapp_click') {
    let payload = {};
    if (Array.isArray(liked) && liked[0] && typeof liked[0] === 'object') {
      payload = liked[0];
    }
    return {
      type: 'whatsapp_click',
      createdAt: row.created_at,
      sessionId: row.session_id,
      perfume: season || payload.perfume_name || 'Unknown Perfume',
      seller: payload.seller_name || 'Unknown Seller',
      format: (payload.format || 'retail').toLowerCase(),
      price: payload.price || null
    };
  }

  return null;
}

/**
 * Compute comprehensive analytics metrics for a date range and optional seller filter
 */
export async function getSellerDashboardMetrics({
  preset = '30d',
  customStart = null,
  customEnd = null,
  selectedSeller = 'all',
  forceRefresh = false
} = {}) {
  const rawRows = await fetchTelemetryRows(forceRefresh);
  const filteredRows = filterRowsByDate(rawRows, preset, customStart, customEnd);

  // Group events
  const visits = [];
  const searches = [];
  const leads = [];
  const uniqueSessions = new Set();
  const allKnownSellers = new Set([
    'FragFever',
    'AAR Fragrances',
    'Enigma Perfumes',
    'Second Theory',
    'Apex Aroma',
    'Whiff Culture',
    'Sovereign Scents',
    'Aromatic Rabbit',
    'RP Decants',
    'GRYV Scents',
    'Blue Wings'
  ]);

  for (const row of filteredRows) {
    if (row.session_id) uniqueSessions.add(row.session_id);
    const parsed = parseTelemetryRow(row);
    if (!parsed) continue;

    if (parsed.type === 'session_visit') {
      visits.push(parsed);
    } else if (parsed.type === 'search_query') {
      if (parsed.query && parsed.query.length >= 2) {
        searches.push(parsed);
      }
    } else if (parsed.type === 'whatsapp_click') {
      leads.push(parsed);
      if (parsed.seller && parsed.seller !== 'Unknown Seller') {
        allKnownSellers.add(parsed.seller);
      }
    }
  }

  // Filter leads if specific seller selected
  const activeLeads = selectedSeller === 'all'
    ? leads
    : leads.filter(l => l.seller.toLowerCase() === selectedSeller.toLowerCase() || l.seller.toLowerCase().includes(selectedSeller.toLowerCase()));

  // 1. Top Search Queries (What Buyers Are Looking For)
  const searchCounts = {};
  for (const s of searches) {
    searchCounts[s.query] = (searchCounts[s.query] || 0) + 1;
  }
  const topSearches = Object.entries(searchCounts)
    .map(([query, count]) => ({
      query,
      count,
      share: searches.length > 0 ? ((count / searches.length) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  // 2. WhatsApp Leads by Seller Breakdown
  const sellerLeadCounts = {};
  for (const l of leads) {
    const sName = l.seller || 'Unspecified';
    sellerLeadCounts[sName] = (sellerLeadCounts[sName] || 0) + 1;
  }
  const topSellers = Object.entries(sellerLeadCounts)
    .map(([seller, count]) => ({
      seller,
      leads: count,
      share: leads.length > 0 ? ((count / leads.length) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.leads - a.leads);

  // 3. Top Demanded Perfumes (What Shoppers Click to Buy)
  const perfumeDemandCounts = {};
  for (const l of activeLeads) {
    const pName = l.perfume || 'Unknown';
    perfumeDemandCounts[pName] = (perfumeDemandCounts[pName] || 0) + 1;
  }
  const topDemandedPerfumes = Object.entries(perfumeDemandCounts)
    .map(([name, count]) => ({
      name,
      leads: count,
      share: activeLeads.length > 0 ? ((count / activeLeads.length) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 30);

  // 4. Bottle vs Decant Split
  let bottleCount = 0;
  let decantCount = 0;
  for (const l of activeLeads) {
    if (l.format === 'decant') decantCount++;
    else bottleCount++;
  }
  const totalLeadsCount = activeLeads.length;
  const bottlePercentage = totalLeadsCount > 0 ? ((bottleCount / totalLeadsCount) * 100).toFixed(1) : '80.0';
  const decantPercentage = totalLeadsCount > 0 ? ((decantCount / totalLeadsCount) * 100).toFixed(1) : '20.0';

  // 5. Daily Activity Velocity Trend (Day by Day)
  const dayMap = {};
  const addDay = (dateStr, type) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    const dayKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dayMap[dayKey]) {
      dayMap[dayKey] = { date: dayKey, rawDate: d, searches: 0, leads: 0, visits: 0 };
    }
    if (type === 'search') dayMap[dayKey].searches++;
    if (type === 'lead') dayMap[dayKey].leads++;
    if (type === 'visit') dayMap[dayKey].visits++;
  };

  searches.forEach(s => addDay(s.createdAt, 'search'));
  activeLeads.forEach(l => addDay(l.createdAt, 'lead'));
  visits.forEach(v => addDay(v.createdAt, 'visit'));

  const dailyTrends = Object.values(dayMap)
    .sort((a, b) => a.rawDate - b.rawDate)
    .slice(-15); // Last 15 active days

  // 6. Traffic Acquisition Channels
  const sourceCounts = {};
  for (const v of visits) {
    const src = v.source || 'direct';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  }
  const trafficSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source: source === 'reddit' ? 'Reddit (r/DesiFragranceAddicts)' : source,
      count,
      share: visits.length > 0 ? ((count / visits.length) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.count - a.count);

  // 7. Overall Conversion Rate
  const totalShoppers = uniqueSessions.size || 1;
  const conversionRate = totalShoppers > 0 ? ((leads.length / totalShoppers) * 100).toFixed(2) : '0.00';

  return {
    dateRange: preset,
    totalVisitors: uniqueSessions.size,
    totalVisits: visits.length,
    totalSearches: searches.length,
    totalLeads: leads.length,
    selectedSellerLeads: activeLeads.length,
    conversionRate,
    bottlePercentage,
    decantPercentage,
    formatBreakdown: { bottleCount, decantCount },
    dailyTrends,
    topSearches,
    topSellers,
    topDemandedPerfumes,
    trafficSources,
    sellersList: Array.from(allKnownSellers).sort()
  };
}
