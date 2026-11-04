export const isAkciaHost = req => String(req.hostname || '').toLowerCase() === 'akcia.seti96.ru';

export function createAkciaHandler({staticMiddleware,bookingHandler}) {
  return function akcia(req, res, next) {
    if (!isAkciaHost(req)) return next();
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if(req.path==='/api/booking' && req.method==='POST' && bookingHandler) return bookingHandler(req,res,next);
    if (!['GET','HEAD'].includes(req.method)) return res.status(405).set('Allow','GET, HEAD').json({error:'Method not allowed'});
    if (req.path === '/health') return res.json({ok:true,site:'akcia',release:'akcia-20261104-booking-v2'});
    return staticMiddleware(req, res, () => res.status(404).type('text/plain').send('Страница не найдена'));
  };
}
