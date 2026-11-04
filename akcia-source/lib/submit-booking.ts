export async function submitBooking(endpoint: string, payload: Record<string, unknown>, fetchImpl: typeof fetch = fetch) {
  const fallback='Не удалось связаться с сервером. Данные остались в форме. Проверьте интернет и нажмите «Записаться» ещё раз.';
  for(let attempt=0;attempt<2;attempt++) {
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    let response: Response;
    let body: {ok?:boolean;error?:string;reference?:string};
    try {
      response=await fetchImpl(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      body=await response.json();
    } catch {
      if(attempt===0) continue;
      throw new Error(fallback);
    } finally {clearTimeout(timeout);}
    if(response.ok && body?.ok===true) return body;
    if(response.status>=500 && attempt===0) continue;
    throw new Error(typeof body?.error==='string'?body.error:fallback);
  }
  throw new Error(fallback);
}
