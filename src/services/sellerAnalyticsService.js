/**
 * sellerAnalyticsService.js
 * 
 * Aggregates live buyer search demand and WhatsApp conversion telemetry for sellers.
 * Focuses strictly on:
 * - What people are searching for & their WhatsApp click conversion
 * - Decant vs Full Bottle market demand split
 * - Which specific bottles buyers are clicking on most
 * - Which specific decants buyers are clicking on most
 */

import { supabase } from '../lib/supabaseClient.js';

let cachedAllLogs = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 45000; // 45s in-memory cache

/**
 * Fetch all raw telemetry rows (paginated to bypass Supabase 1,000-row limit)
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
      console.warn('[FragDashboard] Supabase client is unconfigured.');
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
      if (page > 20) break;
    }

    cachedAllLogs = allRows;
    lastFetchTime = Date.now();
    return allRows;
  } catch (err) {
    console.error('[FragDashboard] Error loading telemetry:', err);
    return cachedAllLogs || [];
  }
}

/**
 * Filter telemetry rows by timeline preset or custom date range
 */
function filterRowsByDate(rows, preset = '30d', customStart = null, customEnd = null) {
  const now = new Date();
  let startTime = null;
  let endTime = new Date(now.getTime() + 86400000); // include current day buffer

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
 * Compute demand intelligence metrics for sellers
 */
export async function getSellerDemandMetrics({
  preset = '30d',
  customStart = null,
  customEnd = null,
  forceRefresh = false
} = {}) {
  const rawRows = await fetchTelemetryRows(forceRefresh);
  const filteredRows = filterRowsByDate(rawRows, preset, customStart, customEnd);

  const sessionSearches = new Map();
  const sessionClicks = new Map();
  const searchMap = new Map();
  const bottleClicks = [];
  const decantClicks = [];
  let totalSearchesCount = 0;

  for (const r of filteredRows) {
    const title = (r.umbrella_title || '').trim();
    const payload = Array.isArray(r.liked_perfumes) && r.liked_perfumes[0] ? r.liked_perfumes[0] : {};
    const sess = r.session_id || 'anon';

    if (title === 'EVENT:search_query') {
      const q = (payload.query || r.umbrella_season || '').toLowerCase().trim();
      if (q && q.length >= 2 && !q.startsWith('anchor:')) {
        totalSearchesCount++;
        if (!sessionSearches.has(sess)) sessionSearches.set(sess, new Set());
        sessionSearches.get(sess).add(q);

        if (!searchMap.has(q)) {
          searchMap.set(q, {
            query: q,
            searches: 0,
            sessions: new Set(),
            zeroResultCount: 0
          });
        }
        const entry = searchMap.get(q);
        entry.searches++;
        entry.sessions.add(sess);
        if (payload.results_count === 0) entry.zeroResultCount++;
      }
    } else if (title === 'EVENT:whatsapp_click') {
      const format = (payload.format || r.umbrella_season || 'bottle').toLowerCase().trim();
      const name = payload.name || payload.perfume_name || 'Unknown Fragrance';
      const brand = payload.brand || '';
      const price = payload.price || null;
      const clickObj = {
        name,
        brand,
        format,
        price,
        session: sess,
        createdAt: r.created_at
      };

      if (!sessionClicks.has(sess)) sessionClicks.set(sess, []);
      sessionClicks.get(sess).push(clickObj);

      if (format.includes('decant')) {
        decantClicks.push(clickObj);
      } else {
        bottleClicks.push(clickObj);
      }
    }
  }

  const totalWhatsAppClicks = bottleClicks.length + decantClicks.length;

  // 1. Decant vs Full Bottle Split
  const bottlePercentage = totalWhatsAppClicks > 0
    ? ((bottleClicks.length / totalWhatsAppClicks) * 100).toFixed(1)
    : '80.0';
  const decantPercentage = totalWhatsAppClicks > 0
    ? ((decantClicks.length / totalWhatsAppClicks) * 100).toFixed(1)
    : '20.0';

  // 2. What People Are Searching For & WhatsApp Conversion
  const searchInsights = [];
  for (const [q, data] of searchMap.entries()) {
    let whatsappClicksFromSearchers = 0;
    for (const sess of data.sessions) {
      if (sessionClicks.has(sess)) {
        whatsappClicksFromSearchers += sessionClicks.get(sess).length;
      }
    }
    const convertingShoppers = Array.from(data.sessions).filter(s => sessionClicks.has(s)).length;
    const conversionRate = data.sessions.size > 0
      ? ((convertingShoppers / data.sessions.size) * 100).toFixed(1)
      : '0.0';

    searchInsights.push({
      query: q,
      searches: data.searches,
      uniqueShoppers: data.sessions.size,
      whatsappClicks: whatsappClicksFromSearchers,
      conversionRate: parseFloat(conversionRate),
      unmetDemand: data.zeroResultCount > 0,
      share: totalSearchesCount > 0 ? ((data.searches / totalSearchesCount) * 100).toFixed(1) : '0.0'
    });
  }

  // Sort by search volume descending
  searchInsights.sort((a, b) => b.searches - a.searches);

  // 3. Top Clicked Full Bottles
  const bottleFreq = new Map();
  for (const b of bottleClicks) {
    const key = b.brand && !b.name.toLowerCase().includes(b.brand.toLowerCase())
      ? `${b.brand} ${b.name}`
      : b.name;
    if (!bottleFreq.has(key)) {
      bottleFreq.set(key, { name: key, brand: b.brand, clicks: 0, prices: [] });
    }
    const e = bottleFreq.get(key);
    e.clicks++;
    if (b.price) e.prices.push(b.price);
  }

  const topBottles = Array.from(bottleFreq.values())
    .map(b => ({
      name: b.name,
      brand: b.brand,
      clicks: b.clicks,
      share: bottleClicks.length > 0 ? ((b.clicks / bottleClicks.length) * 100).toFixed(1) : '0.0',
      avgPrice: b.prices.length > 0 ? Math.round(b.prices.reduce((acc, curr) => acc + curr, 0) / b.prices.length) : null
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 40);

  // 4. Top Clicked Decants
  const decantFreq = new Map();
  for (const d of decantClicks) {
    const key = d.brand && !d.name.toLowerCase().includes(d.brand.toLowerCase())
      ? `${d.brand} ${d.name}`
      : d.name;
    if (!decantFreq.has(key)) {
      decantFreq.set(key, { name: key, brand: d.brand, clicks: 0, prices: [] });
    }
    const e = decantFreq.get(key);
    e.clicks++;
    if (d.price) e.prices.push(d.price);
  }

  const topDecants = Array.from(decantFreq.values())
    .map(d => ({
      name: d.name,
      brand: d.brand,
      clicks: d.clicks,
      share: decantClicks.length > 0 ? ((d.clicks / decantClicks.length) * 100).toFixed(1) : '0.0',
      avgPrice: d.prices.length > 0 ? Math.round(d.prices.reduce((acc, curr) => acc + curr, 0) / d.prices.length) : null
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 30);

  // 5. Daily Search & Click Velocity
  const dayMap = {};
  const addDay = (dateStr, type) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    const dayKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dayMap[dayKey]) {
      dayMap[dayKey] = { date: dayKey, rawDate: d, searches: 0, clicks: 0 };
    }
    if (type === 'search') dayMap[dayKey].searches++;
    if (type === 'click') dayMap[dayKey].clicks++;
  };

  filteredRows.forEach(r => {
    const title = (r.umbrella_title || '').trim();
    if (title === 'EVENT:search_query') addDay(r.created_at, 'search');
    if (title === 'EVENT:whatsapp_click') addDay(r.created_at, 'click');
  });

  const dailyVelocity = Object.values(dayMap)
    .sort((a, b) => a.rawDate - b.rawDate)
    .slice(-14);

  return {
    dateRange: preset,
    totalSearches: totalSearchesCount,
    totalWhatsAppClicks,
    totalBottleClicks: bottleClicks.length,
    totalDecantClicks: decantClicks.length,
    bottlePercentage,
    decantPercentage,
    searchInsights,
    topBottles,
    topDecants,
    dailyVelocity
  };
}
