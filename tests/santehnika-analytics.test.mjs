import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../santehnika-static/index.html',import.meta.url),'utf8');
const init=html.match(/<script>\s*(window\.seti96StartAnalytics[\s\S]*?)<\/script>/)[1];
const app=readFileSync(new URL('../santehnika-static/app-v3.js',import.meta.url),'utf8');
function fixture(choice=null){
 const node=(extra={})=>({hidden:false,dataset:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn},querySelectorAll(){return []},querySelector(){return node()},setAttribute(){},focus(){},...extra});
 const phone=node(),form=node({elements:{phone}}),success=node(),error=node(),submit=node();
 form.querySelector=()=>submit;
 const consent=[node({dataset:{analytics:'yes'}}),node({dataset:{analytics:'no'}})];
 const anchors=[node({dataset:{task:'test'}}),node(),node()];
 form.elements.task={value:''}; form.elements.clientType={value:''};
 const scripts=[],placeholder={parentNode:{insertBefore(s){scripts.push(s)}}};
 const nodes={'#lead-form':form,'#form-error':error,'.success':success,'.cookie-notice':node(),'.cookie-settings':node(),'#mobile-menu':node(),'.menu-button':node(),'#another-request':node()};
 const document={scripts,querySelector:s=>nodes[s],querySelectorAll:s=>s==='[data-analytics]'?consent:s==='a[href="#request"]'?anchors:[],addEventListener(){},createElement:()=>({}),getElementsByTagName:()=>[placeholder]};
 const window={},context=vm.createContext({window,document,URLSearchParams,location:{search:''},localStorage:{getItem:()=>choice,setItem(){}},Date});
 vm.runInContext(init,context);vm.runInContext(app,context);
 const calls=()=>Array.from(window.ym?.a||[],a=>Array.from(a));
 return {window,scripts,consent,anchors,calls};
}
test('analytics waits for consent, and all request anchors are tracked only after consent',()=>{
 const f=fixture();assert.equal(f.scripts.length,0);assert.equal(f.window.ym,undefined);
 f.anchors[1].listeners.click();assert.equal(f.window.ym,undefined);
 f.consent[0].listeners.click();assert.equal(f.scripts.length,1);
 assert.equal(f.scripts[0].src,'https://mc.yandex.ru/metrika/tag.js?id=111937544');
 f.anchors.forEach(a=>a.listeners.click());
 assert.equal(f.calls().filter(a=>a[1]==='init').length,1);
 assert.equal(f.calls().filter(a=>a[2]==='request_open').length,3);
 f.consent[1].listeners.click();const before=f.calls().length;f.anchors[1].listeners.click();assert.equal(f.calls().length,before);
 f.consent[0].listeners.click();assert.equal(f.scripts.length,1);assert.equal(f.calls().filter(a=>a[1]==='init').length,2);
});
test('persisted refusal does not load Metrica; persisted consent starts exactly one counter',()=>{
 assert.equal(fixture('no').scripts.length,0);
 const f=fixture('yes');assert.equal(f.scripts.length,1);assert.equal(f.calls().filter(a=>a[1]==='init'&&a[0]===111937544).length,1);
});
