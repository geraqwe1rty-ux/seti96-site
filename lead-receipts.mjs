import {randomBytes} from 'node:crypto';

// A thank-you page exists only after a successful server save. The opaque,
// host-bound receipt is consumed once, so refresh and direct visits aren't goals.
export function createLeadReceipts({now=Date.now}={}){
  const tickets=new Map(),byLead=new Map();
  const prune=()=>{for(const [token,t] of tickets){if(t.expires<now()){tickets.delete(token);byLead.delete(t.key);}}};
  function attach(req,res,next){
    const send=res.json.bind(res);
    res.json=data=>{
      if(data?.ok===true&&data.saved===true&&typeof data.id==='string'&&['confirmed','queued'].includes(data.delivery)){
        prune();
        const host=String(req.hostname).toLowerCase(),key=host+':'+data.id;
        let token=byLead.get(key),ticket=tickets.get(token);
        if(!ticket){
          token=randomBytes(24).toString('hex');
          ticket={key,host,used:false,expires:now()+86400000,kind:host==='teplo.seti96.ru'?'thermal':req.body?.placement==='one-screen'?'landing':'main',delivery:data.delivery};
          tickets.set(token,ticket);byLead.set(key,token);
        }
        if(!ticket.used){
          const secure=!['localhost','127.0.0.1'].includes(host)?'; Secure':'';
          res.set('Set-Cookie',`seti96_receipt=${token}; Path=/spasibo; Max-Age=900; HttpOnly; SameSite=Lax${secure}`);
          data={...data,thankYouUrl:'/spasibo'};
        }
      }
      return send(data);
    };
    next();
  }
  function consume(req){
    prune();
    const token=String(req.headers?.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('seti96_receipt='))?.slice(15);
    const ticket=tickets.get(token);
    if(!ticket||ticket.used||ticket.host!==String(req.hostname).toLowerCase())return null;
    ticket.used=true;
    return {kind:ticket.kind,delivery:ticket.delivery};
  }
  return {attach,consume};
}
