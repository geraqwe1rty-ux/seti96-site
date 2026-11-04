'use client';
import { useEffect, useRef, useState } from 'react';
import { ANALYTICS_CHOICE_KEY, setAnalyticsEnabled } from '../lib/analytics';

export default function AnalyticsChoice() {
  const [open, setOpen] = useState(false);
  const allowButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let choice: string | null = null;
    try { choice = localStorage.getItem(ANALYTICS_CHOICE_KEY); } catch { /* Choice still works for this visit. */ }
    setAnalyticsEnabled(choice === 'yes');
    setOpen(choice !== 'yes' && choice !== 'no');
  }, []);
  function choose(allow: boolean) {
    try { localStorage.setItem(ANALYTICS_CHOICE_KEY, allow ? 'yes' : 'no'); } catch { /* Optional storage. */ }
    setAnalyticsEnabled(allow); setOpen(false);
  }
  return <>
    <button type="button" className="analytics-settings" onClick={() => { setOpen(true); requestAnimationFrame(() => allowButton.current?.focus()); }}>Настройки cookie</button>
    {open && <aside className="analytics-notice" aria-label="Настройки аналитики">
      <p>Используем Яндекс.Метрику, чтобы понимать, как работает сайт. Разрешите аналитические cookie? <a href="https://teplo.seti96.ru/policy" target="_blank" rel="noreferrer">Подробнее</a></p>
      <div><button ref={allowButton} type="button" className="cookie-allow" onClick={() => choose(true)}>Разрешить</button><button type="button" onClick={() => choose(false)}>Без аналитики</button></div>
    </aside>}
  </>;
}
