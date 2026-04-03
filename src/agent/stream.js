/**
 * TradingView Agent — Real-time Stream Watcher
 * Polls TradingView for live data changes and emits events.
 * Use for alerts, monitoring, and live dashboards.
 */
import { data, chart, alerts, health } from '../mcp/client.js';

const DEFAULT_INTERVAL = 5000; // ms

/**
 * Watch the chart for changes and call handler on each tick.
 * 
 * @param {object} opts
 * @param {number}   opts.interval   - Poll interval in ms (default: 5000)
 * @param {string[]} opts.watch      - What to watch: ['quote', 'studies', 'levels', 'all']
 * @param {Function} opts.onTick     - Called with { quote, studies, levels } each interval
 * @param {Function} opts.onAlert    - Called when a price alert condition is met
 * @param {Function} opts.onError    - Called on errors
 * @returns {Function} stop          - Call to stop watching
 */
export function watchChart(opts = {}) {
  const {
    interval = DEFAULT_INTERVAL,
    watch = ['quote', 'studies'],
    onTick = () => {},
    onAlert = null,
    onError = console.error,
  } = opts;

  let running = true;
  let prevQuote = null;
  const userAlerts = [];

  async function tick() {
    if (!running) return;

    try {
      const result = {};

      if (watch.includes('quote') || watch.includes('all')) {
        result.quote = await data.quoteGet();
      }

      if (watch.includes('studies') || watch.includes('all')) {
        result.studies = await data.getStudyValues();
      }

      if (watch.includes('levels') || watch.includes('all')) {
        result.lines = await data.getPineLines();
        result.labels = await data.getPineLabels();
      }

      result.timestamp = new Date().toISOString();

      // Check user-defined alerts
      if (onAlert && result.quote) {
        const price = result.quote.last;
        for (const alert of userAlerts) {
          if (alert.condition(price, result)) {
            onAlert({ alert, price, result });
          }
        }
      }

      onTick(result);

      // Detect significant price changes
      if (prevQuote && result.quote) {
        const changePct = Math.abs((result.quote.last - prevQuote.last) / prevQuote.last * 100);
        if (changePct > 0.5) {
          result.significant_move = {
            from: prevQuote.last,
            to: result.quote.last,
            change_pct: changePct.toFixed(2),
          };
        }
      }
      prevQuote = result.quote;

    } catch (err) {
      onError(err);
    }

    if (running) {
      setTimeout(tick, interval);
    }
  }

  // Start
  tick();

  return {
    stop: () => { running = false; },
    addAlert: (condition, label) => {
      userAlerts.push({ condition, label, id: Date.now() });
    },
    removeAlert: (id) => {
      const idx = userAlerts.findIndex(a => a.id === id);
      if (idx !== -1) userAlerts.splice(idx, 1);
    },
  };
}

/**
 * One-shot multi-symbol scanner.
 * Scans an array of symbols and returns a ranked summary.
 */
export async function scanSymbols(symbols, opts = {}) {
  const { timeframe = null } = opts;
  const results = [];

  for (const symbol of symbols) {
    try {
      // Switch to symbol
      const { chart: chartCtl } = await import('../mcp/client.js');
      await chartCtl.setSymbol(symbol);
      if (timeframe) await chartCtl.setTimeframe(timeframe);

      // Wait for chart to load
      await new Promise(r => setTimeout(r, 800));

      // Gather data
      const [quote, studies, ohlcv] = await Promise.all([
        data.quoteGet(),
        data.getStudyValues(),
        data.getOhlcv({ summary: true }),
      ]);

      results.push({
        symbol,
        price: quote.last,
        change_pct: quote.change_percent,
        volume: quote.volume,
        studies,
        ohlcv,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      results.push({ symbol, error: err.message });
    }
  }

  // Rank by absolute change %
  results.sort((a, b) => {
    const aChange = Math.abs(a.change_pct || 0);
    const bChange = Math.abs(b.change_pct || 0);
    return bChange - aChange;
  });

  return results;
}

/**
 * Watch for Pine Script indicator signal changes.
 * Useful for automating "alert me when RSI crosses 70" style monitoring.
 */
export function watchIndicator(studyName, opts = {}) {
  const {
    interval = 3000,
    threshold = null,
    condition = null,
    onSignal = () => {},
    onError = console.error,
  } = opts;

  let running = true;
  let prevValues = null;

  async function tick() {
    if (!running) return;

    try {
      const result = await data.getStudyValues({ study_filter: studyName });
      const values = result.values || {};

      if (prevValues !== null) {
        // Check for crossover/crossunder or threshold breach
        for (const [key, val] of Object.entries(values)) {
          const prev = prevValues[key];
          if (prev === undefined) continue;

          let triggered = false;
          let type = null;

          if (threshold !== null) {
            if (prev < threshold && val >= threshold) {
              triggered = true; type = 'cross_above';
            } else if (prev > threshold && val <= threshold) {
              triggered = true; type = 'cross_below';
            }
          }

          if (condition && condition(val, prev, key)) {
            triggered = true; type = 'condition_met';
          }

          if (triggered) {
            onSignal({ study: studyName, key, value: val, prev, type, timestamp: new Date().toISOString() });
          }
        }
      }

      prevValues = values;
    } catch (err) {
      onError(err);
    }

    if (running) setTimeout(tick, interval);
  }

  tick();
  return { stop: () => { running = false; } };
}
