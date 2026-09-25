'use strict';
const catalog={拉麵:[['豚骨拉麵',78],['粟米紫菜拉麵',83],['極上拉麵',93],['丸京拉麵',100],['真・叉燒拉麵',108]],小食:[['餃子',35],['大阪風餃子',42],['七味炸雞',38],['香蔥沙律炸雞',42],['吉列炸蠔',35],['大阪風炸蠔',42]],飲品:[['元祖波子汽水',18],['招財貓梳打',18],['信州青提梳打',22],['綠茶',18],['烏龍茶',18],['靜岡蜜瓜梳打',22],['完熟桃梳打',22],['信州蘋果梳打',22],['富士柚子梳打',22]],午市優惠:[['午市可樂',0],['午市 Coke Zero',0],['午市忌廉',0],['午市雪碧',0],['午市綠茶',10],['午市烏龍茶',10]],配料:[], '限定／自訂':[]};
const extras=[['真・叉燒（3枚）',23],['叉燒（3枚）',15],['炙燒腩肉（4枚）',25],['半熟蛋',10],['粟米',10],['紫菜',10],['味筍',10],['京蔥',7],['加麵',15]];
catalog.配料=extras;
function apply78Rule(items,enabled){return items.map(x=>({...x,autoFixed:!!(enabled&&x.isRamen&&x.price===7800&&!x.free),fixed:!!(x.fixed||(enabled&&x.isRamen&&x.price===7800&&!x.free))}));}
function allocate(items,paid){
 if(!Number.isSafeInteger(paid)||paid<0)throw Error('請輸入有效嘅實付總額。');
 if(!items.length)throw Error('請先加入餐點。');
 if(items.some(x=>!Number.isSafeInteger(x.price)||x.price<0))throw Error('項目價錢無效。');
 const fixed=items.reduce((s,x)=>s+(x.fixed?x.price:0),0),remaining=paid-fixed,weights=items.reduce((s,x)=>s+(x.fixed?0:x.price),0);
 if(remaining<0)throw Error('實付總額少過照原價項目合計，請檢查金額或取消照原價。');
 if(weights===0&&remaining!==0)throw Error('冇可分攤嘅金額：請加入有價錢嘅分攤項目，或將實付總額設為照原價合計。');
 const result=items.map(x=>x.fixed?x.price:weights?Math.floor(remaining*x.price/weights):0);
 let left=paid-result.reduce((a,b)=>a+b,0);
 const priority=items.map((x,i)=>({i,remainder:x.fixed?-1:weights?(remaining*x.price)%weights:0})).filter(x=>!items[x.i].fixed).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
 for(let i=0;i<left;i++)result[priority[i].i]++;
 return result;
}
function splitSide(item,count,names){
 if(!Number.isInteger(count)||count<1||count>50)throw Error('分食人數要係 1 至 50 嘅整數。');
 if(count===1)return [item];
 if(names.length!==count||names.some(n=>!n.trim()))throw Error('請填齊 '+count+' 位分食者嘅名字，用逗號分隔。');
 names=names.map(n=>n.trim());
 if(names.some(n=>n.length>40))throw Error('每位名字最多 40 個字。');
 if(new Set(names).size!==count)throw Error('分食者名字唔可以重複；同名請加編號。');
 const base=Math.floor(item.price/count),extra=item.price%count;
 return names.map((person,i)=>({...item,person,price:base+(i<extra?1:0),name:item.name+'（'+count+' 人分・第 '+(i+1)+' 份）',isRamen:false}));
}
if(typeof module!=='undefined')module.exports={allocate,apply78Rule,splitSide};
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id),money=n=>'$'+(n/100).toFixed(2),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let category='拉麵',selected=0,orders=[];
const cents=v=>{if(!/^\d+(\.\d{1,2})?$/.test(String(v)))throw Error('請輸入有效價錢（最多兩位小數）。');const n=Math.round(Number(v)*100);if(!Number.isSafeInteger(n)||n>100000000)throw Error('價錢太大，請檢查。');return n;};
function renderMenu(){ $('categories').innerHTML=Object.keys(catalog).map(c=>`<button type="button" class="${c===category?'active':''}" aria-pressed="${c===category}" data-cat="${c}">${c}</button>`).join('');$('menuItems').innerHTML=catalog[category].map((x,i)=>`<button type="button" class="card ${i===selected?'selected':''}" aria-pressed="${i===selected}" data-item="${i}"><span>${x[0]}</span><strong>$${x[1]}</strong></button>`).join('');$('sideSharing').hidden=category!=='小食';$('ramenOptions').hidden=category!=='拉麵';$('customFields').hidden=category!=='限定／自訂';$('lunchNote').hidden=category!=='午市優惠';updateAdd();}
$('extras').innerHTML=extras.map((x,i)=>`<div class="extraChoice"><label><input type="checkbox" data-extra="${i}">${x[0]} +$${x[1]}</label><label><input type="checkbox" data-free-extra="${i}" disabled>免費</label></div>`).join('');
function draft(){let price,name;if(category==='限定／自訂'){name=$('customName').value.trim();if(!name)throw Error('請填寫項目名稱。');price=$('free').checked?0:cents($('customPrice').value);}else{[name,price]=catalog[category][selected];price*=100;if(category==='拉麵'){const soup=$('soup');price+=soup.value==='custom'?cents($('soupCustom').value):Number(soup.value)*100;name=soup.selectedOptions[0].text.split(' ')[0]+' '+name;const opts=[];for(const [id,label] of [['noOnion','走蔥'],['noBamboo','走筍'],['noEgg','走蛋']])if($(id).checked)opts.push(label);if($('noEgg').checked)price-=1000;document.querySelectorAll('[data-extra]:checked').forEach(e=>{const x=extras[+e.dataset.extra];const free=document.querySelector('[data-free-extra="'+e.dataset.extra+'"]').checked;price+=free?0:x[1]*100;opts.push(x[0]+(free?'（免費）':''));});if(opts.length)name+=' · '+opts.join('、');}}const free=$('free').checked;if(free){price=0;name+='（免費）';}return {name,price,free,isRamen:category==='拉麵'||(category==='限定／自訂'&&$('customRamen').checked),person:$('person').value.trim(),fixed:free?false:$('fixed').checked};}
function updateAdd(){try{$('add').textContent='加入清單 · '+money(draft().price);}catch{$('add').textContent='加入清單';}}
$('categories').onclick=e=>{const b=e.target.closest('[data-cat]');if(b){category=b.dataset.cat;selected=0;renderMenu();$('formError').textContent='';}};
$('menuItems').onclick=e=>{const b=e.target.closest('[data-item]');if(b){selected=+b.dataset.item;renderMenu();}};
$('orderForm').oninput=()=>{$('shareNames').hidden=Number($('shareCount').value)<=1;document.querySelectorAll('[data-extra]').forEach(e=>{const f=document.querySelector('[data-free-extra="'+e.dataset.extra+'"]');f.disabled=!e.checked;if(!e.checked)f.checked=false;});$('fixed').disabled=$('free').checked;$('soupCustomLabel').hidden=$('soup').value!=='custom';updateAdd();};
$('orderForm').onsubmit=e=>{e.preventDefault();try{const item=draft();const added=category==='小食'?splitSide(item,Number($('shareCount').value),$('sharePeople').value.split(/[,，、\n]/)): [item];orders.push(...added);$('formError').textContent='';$('person').value='';$('free').checked=false;$('fixed').disabled=false;document.querySelectorAll('[data-free-extra]').forEach(e=>{e.checked=false;});render();updateAdd();}catch(err){$('formError').textContent=err.message;}};
$('orders').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){orders.splice(+b.dataset.remove,1);render();}};
$('orders').onchange=e=>{if(e.target.dataset.fixed!==undefined){orders[+e.target.dataset.fixed].fixed=e.target.checked;renderResults();}};
$('paid').oninput=renderResults;
$('exclude78').onchange=render;
const billedOrders=()=>apply78Rule(orders,$('exclude78').checked);
function render(){ $('count').textContent=orders.length+' 項';$('orders').innerHTML=orders.length?billedOrders().map((x,i)=>`<div class="row"><div class="info"><strong>${escape(x.person||'餐點 '+(i+1))}</strong><span>${escape(x.name)}</span><div class="checks"><label><input type="checkbox" data-fixed="${i}" ${x.fixed?'checked':''} ${x.free||x.autoFixed?'disabled':''}>照原價${x.autoFixed?'（$78 規則）':''}</label></div></div><span class="rowPrice">${money(x.price)}</span><button type="button" data-remove="${i}" aria-label="移除第 ${i+1} 項">移除</button></div>`).join(''):'<div class="empty">喺餐牌揀餐點，加入今餐清單。</div>';renderResults();}
function renderResults(){const calculated=billedOrders();const sum=orders.reduce((s,x)=>s+x.price,0);let html=`<div class="totals"><span>餐點計價合計（免費項目 $0）</span><strong>${money(sum)}</strong></div>`;if(!$('paid').value){$('results').innerHTML=html;return;}try{const paid=cents($('paid').value),payments=allocate(calculated,paid);[false,true].forEach(f=>{const list=calculated.map((x,i)=>({...x,i})).filter(x=>x.fixed===f);if(!list.length)return;html+=`<div class="resultGroup"><h3>${f?'照原價':'按比例分攤'}</h3>`+list.map(x=>`<div class="resultLine"><span>${escape(x.person||'餐點 '+(x.i+1))} · ${escape(x.name)}</span><strong>${money(payments[x.i])}</strong></div>`).join('')+'</div>';});const shareBase=calculated.reduce((sum,x)=>sum+(x.fixed?0:x.price),0);const people=new Map();orders.forEach((x,i)=>{const key=x.person?'name:'+x.person:'item:'+i;const prev=people.get(key)||{name:x.person||'餐點 '+(i+1),amount:0,items:[],weight:0,fixedAmount:0};prev.amount+=payments[i];if(calculated[i].fixed)prev.fixedAmount+=x.price;else prev.weight+=x.price;prev.items.push(x.name);people.set(key,prev);});html+='<div class="resultGroup"><h3>每位應付</h3><p class="muted">分攤比例＝個人參與分攤餐點原價 ÷ 全部分攤餐點原價；照原價及免費項目唔佔比例。百分比四捨五入至兩位小數。</p>'+[...people.values()].map(x=>`<div class="totals"><div style="min-width:0;overflow-wrap:anywhere"><span>${escape(x.name)}</span><div class="muted">${x.weight>0&&shareBase>0?`分攤 ${(x.weight/shareBase*100).toFixed(2)}%${x.fixedAmount>0?` · 另加照原價 ${money(x.fixedAmount)}`:''}`:x.fixedAmount>0?'照原價 · 唔參與分攤':'免費 · 分攤 0.00%'}</div><div class="muted">${x.items.map(item=>`<div>${escape(item)}</div>`).join('')}</div></div><strong style="white-space:nowrap">${money(x.amount)}</strong></div>`).join('')+'</div>';html+=`<div class="totals total"><span>應收總數</span><span>${money(paid)}</span></div>`;if(paid>sum)html+='<p class="muted">實付高過原價，多出嘅金額已由參與分攤項目按比例分配。</p>';}catch(err){html+=`<p class="error" role="alert">${escape(err.message)}</p>`;}$('results').innerHTML=html;}
renderMenu();render();
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_split_bill',description:'Read current ordered items and calculated payments in HKD cents.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(){return {items:billedOrders(),payments:allocate(billedOrders(),cents($('paid').value))};}})).catch(()=>{});}catch{}}
}
