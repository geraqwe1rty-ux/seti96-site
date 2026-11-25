export const METRIKA_ID = 113687988;
export const ANALYTICS_CHOICE_KEY = 'seti96-promo-analytics-v1';
type Goal = 'promo_lead_start' | 'promo_lead_success' | 'promo_lead_error' | 'promo_town_select';
type Ym = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };
declare global { interface Window { ym?: Ym } }
let enabled = false;
const countedLeads = new Set<string>();

export function setAnalyticsEnabled(value: boolean) {
  if (typeof window === 'undefined' || value === enabled) return;
  if (!value) {
    enabled = false;
    try { for (const id of [METRIKA_ID, 111900032]) window.ym?.(id, 'destruct'); } catch { /* Analytics never blocks booking. */ }
    return;
  }
  enabled = true;
  try {
    if (!window.ym) {
      const queue: Ym = (...args: unknown[]) => { (queue.a ||= []).push(args); };
      queue.l = Date.now();
      window.ym = queue;
    }
    if (!document.getElementById('seti96-metrika')) {
      const script = document.createElement('script');
      script.id = 'seti96-metrika'; script.async = true;
      script.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
      document.head.appendChild(script);
    }
    window.ym(METRIKA_ID, 'init', {
      ssr: true, clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true,
      params: { campaign: 'teplo-800-2026-11', site: 'promo' },
    });
    window.ym(111900032, 'init', {trackLinks:true, accurateTrackBounce:true, webvisor:false});
  } catch { enabled = false; }
}

export function trackPromoGoal(goal: Goal, town?: string) {
  if (!enabled || typeof window === 'undefined') return false;
  // Only an allowlisted locality and static campaign labels reach analytics.
  const locality = ['rassokha', 'verkhnee-dubrovo', 'aramil', 'kosulino'].includes(town || '') ? town : undefined;
  try {
    for (const id of [METRIKA_ID, 111900032]) window.ym?.(id, 'reachGoal', goal, {
      campaign: 'teplo-800-2026-11', form: 'promo_booking', ...(locality ? { locality } : {}),
    });
    return typeof window.ym === 'function';
  } catch { return false; }
}

export function trackSavedLead(requestId: string, town: string) {
  if (countedLeads.has(requestId)) return;
  if (trackPromoGoal('promo_lead_success', town)) countedLeads.add(requestId);
}
