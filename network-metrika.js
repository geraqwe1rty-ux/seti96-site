// Informational pages without a service-specific tracker use the same saved choice as the landing page.
(() => {
  const {choice, allow} = document.currentScript.dataset;
  if (choice) {
    try { if (localStorage.getItem(choice) !== allow) return; }
    catch { return; }
  }
  const id = 111900032;
  if (!window.ym) {
    const queue = function () { (queue.a ||= []).push(arguments); };
    queue.l = Date.now();
    window.ym = queue;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + id;
    document.head.append(script);
  }
  window.ym(id, 'init', {trackLinks:true, accurateTrackBounce:true, webvisor:false});
})();
