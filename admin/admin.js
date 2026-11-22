'use strict';
const owner = 'renatspaceprince';
const repo = '/repos/' + owner + '/r.s.portfolio-2026';
const branch = 'gh-pages';
const prefix = 'const portfolioContent = ';
const $ = id => document.getElementById(id);
let token = '', data, base, selected, service, mode = 'shoots', dirty = false;
let photos = {}, urls = {}, saved = Promise.resolve(), drag = null;
const db = new Promise((resolve,reject) => {
  const req = indexedDB.open('rs-portfolio-2026-editor',1);
  req.onupgradeneeded = () => req.result.createObjectStore('draft');
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
async function storage(action, value) {
  const tx = (await db).transaction('draft',action === 'get' ? 'readonly' : 'readwrite');
  const store = tx.objectStore('draft');
  const req = action === 'get' ? store.get('current') : action === 'put' ? store.put(value,'current') : store.delete('current');
  return new Promise((resolve,reject) => {
    tx.oncomplete = () => resolve(req.result);
    tx.onabort = tx.onerror = () => reject(tx.error || Error('Ошибка сохранения черновика'));
  });
}
function status(text) { $('status').textContent = text; }
function change() {
  dirty = true;
  $('publish').disabled = false;
  status('Черновик · изменения ещё не опубликованы');
  saved = saved.catch(()=>{}).then(()=>storage('put',{data,base,photos}));
  saved.catch(()=>status('Браузеру не удалось сохранить черновик. Оставьте вкладку открытой до публикации.'));
}
async function api(path, method = 'GET', body) {
  const res = await fetch('https://api.github.com'+path,{method,cache:'no-store',
    headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'},
    body:body === undefined ? undefined : JSON.stringify(body)});
  const result = await res.json();
  if (!res.ok) throw Error(res.status === 401 ? 'GitHub отклонил токен. Проверьте срок действия.' : 'GitHub '+res.status+' · '+result.message);
  return result;
}
function unbase64(s) { return new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0))); }
function toBase64(bytes) {
  let s = '';
  for(let i=0;i<bytes.length;i+=8192) s+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(s);
}
const head = async () => (await api(repo+'/git/ref/heads/'+branch)).object.sha;
$('auth').onsubmit = async e => {
  e.preventDefault();
  $('auth').querySelector('button').disabled=true;
  token=$('token').value.trim(); $('token').value='';
  try {
    const user=await api('/user');
    if(user.login.toLowerCase()!==owner) throw Error('Войдите как '+owner+'.');
    const info=await api(repo);
    if(!info.permissions?.push) throw Error('Для этого репозитория нужен доступ на запись.');
    const current=await head();
    const file=await api(repo+'/contents/content.js?ref='+current);
    const raw=unbase64(file.content);
    if(!raw.startsWith(prefix)) throw Error('Не удалось прочитать данные сайта.');
    data=JSON.parse(raw.slice(prefix.length).trim().replace(/;$/,''));
    base=current;
    const draft=await storage('get');
    if(draft && draft.base!==base && !confirm('Есть черновик от предыдущей версии. Загрузить свежую версию и удалить старый черновик?')) throw Error('Вход отменён. Черновик сохранён.');
    if(draft && draft.base===base){({data,photos}=draft);dirty=true;}
    else if(draft) await storage('delete');
    selected=data.shoots[0]?.id;service=Object.keys(data.conditions)[0];
    $('login').hidden=true;$('workspace').hidden=false;
    render();status(dirty?'Черновик восстановлен':'Открыта опубликованная версия');
  } catch(err){token='';status(err.message);}
  finally{$('auth').querySelector('button').disabled=false;}
};
$('logout').onclick=async()=>{try{await saved;location.reload();}catch{status('Не удалось сохранить черновик. Вкладка открыта.');}};
function el(tag,text,parent) {
  const n=document.createElement(tag);
  if(text!=null)n.textContent=text;
  if(parent)parent.append(n);
  return n;
}
function button(parent,text,fn,disabled=false) {
  const b=el('button',text,parent);b.type='button';b.onclick=fn;b.disabled=disabled;return b;
}
function field(parent,label,value,set,multi=false) {
  const l=el('label',label,parent),input=el(multi?'textarea':'input',null,l);
  input.value=value??'';input.oninput=()=>{set(input.value);change();};return input;
}
function controls(parent){const n=el('div',null,parent);n.className='controls';return n;}
function move(arr,from,to){if(to!==from && to>=0 && to<arr.length)arr.splice(to,0,arr.splice(from,1)[0]);}
function ordered(node,kind,index,onMove){
  node.draggable=true;
  node.ondragstart=e=>{drag={kind,index};e.dataTransfer.setData('text/plain',kind);};
  node.ondragend=()=>{drag=null;};
  node.ondragover=e=>{if(drag?.kind===kind)e.preventDefault();};
  node.ondrop=e=>{e.preventDefault();if(drag?.kind===kind)onMove(drag.index,index);drag=null;};
}
function reorderShoots(from,to){
  move(data.shoots,from,to);
  data.allOrder=data.shoots.map(s=>s.id);
  change();render();
}
let query = '';
const folded = new Set();
async function asWebP(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const longSide = Math.max(bitmap.width, bitmap.height);
    const targetBytes = 600_000;
    if (file.type === 'image/webp' && longSide <= 2400 && file.size <= targetBytes) {
      const header = await file.slice(0, 12).text();
      if (header.startsWith('RIFF') && header.endsWith('WEBP')) return file;
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw Error('Недостаточно памяти для обработки фотографии.');
    let result;
    for (const limit of [2400, 1920, 1500]) {
      const scale = Math.min(1, limit / longSide);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      if (result && width === canvas.width && height === canvas.height) continue;
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap, 0, 0, width, height);
      for (const quality of [0.88, 0.82]) {
        result = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
        if (result?.type !== 'image/webp') {
          throw Error('Браузер не смог создать WebP. Откройте панель в Arc или Chrome.');
        }
        if (result.size <= targetBytes) return result;
      }
    }
    return result;
  } finally {
    bitmap.close();
  }
}
function imageUrl(file) {
  if (photos[file] && !urls[file]) urls[file] = URL.createObjectURL(photos[file]);
  return urls[file] || '../assets/' + encodeURIComponent(file);
}
function openEditor() {
  render();
  if (matchMedia('(max-width: 760px)').matches) $('edit').scrollIntoView({block:'start'});
}
function frameDrag(card, handle, index, reorder) {
  handle.onpointerdown = event => {
    if (event.button !== 0) return;
    handle.setPointerCapture(event.pointerId);
    card.classList.add('moving');
    let target;
    function track(e) {
      if (e.clientY > innerHeight - 64) window.scrollBy(0, 24);
      if (e.clientY < 64) window.scrollBy(0, -24);
      target?.classList.remove('target');
      target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-frame]');
      target?.classList.add('target');
    }
    function finish(e) {
      handle.onpointermove = handle.onpointerup = handle.onpointercancel = handle.onlostpointercapture = null;
      target?.classList.remove('target');card.classList.remove('moving');
      if (e.type === 'pointerup' && target && target !== card) reorder(index,Number(target.dataset.frame));
    }
    handle.onpointermove = track;
    handle.onpointerup = handle.onpointercancel = handle.onlostpointercapture = finish;
  };
  handle.onkeydown = e => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next=index+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);
    if (!card.parentNode.children[next]) return;
    reorder(index,next);
    document.querySelector('[data-frame="'+next+'"] .grip')?.focus();
  };
}
function drawMenu() {
  const menu=$('menu');menu.replaceChildren();
  if(mode==='price'){
    el('h2','Виды съёмок',menu);
    for(const [id,s] of Object.entries(data.conditions)){
      const b=button(menu,s.title.join(' '),()=>{service=id;openEditor();});
      b.setAttribute('aria-pressed',id===service);
    }
    return;
  }
  el('h2','Съёмки',menu);
  const search=el('input',null,menu); search.type='search';search.placeholder='Поиск съёмки или категории';search.ariaLabel=search.placeholder;search.value=query;
  button(menu,'+ Новая съёмка',()=>{
    const s={id:crypto.randomUUID(),category:Object.keys(data.categories)[0],name:'Новая съёмка',cover:'',frames:[]};
    data.shoots.push(s);data.allOrder.push(s.id);selected=s.id;query='';folded.delete(s.category);change();openEditor();
  });
  const groups=el('div',null,menu);
  function filter() {
    groups.replaceChildren();
    const term=query.trim().toLocaleLowerCase('ru');
    for (const [id,label] of Object.entries(data.categories)) {
      const matches=data.shoots.filter(s=>s.category===id && (label+' '+s.name).toLocaleLowerCase('ru').includes(term));
      if (!matches.length) continue;
      const section=el('details',null,groups);section.open=!!term || !folded.has(id);
      section.ontoggle=()=>{if (!term && section.isConnected) section.open?folded.delete(id):folded.add(id);};
      const summary=el('summary',label,section);el('small',String(matches.length),summary);
      for (const s of matches) {
        const b=button(section,'',()=>{selected=s.id;openEditor();});
        if(s.cover){const img=el('img',null,b);img.alt='';img.src=imageUrl(s.cover);}
        el('span',s.name||'Без названия',b);b.setAttribute('aria-pressed',s.id===selected);
        ordered(b,'shoot',data.shoots.indexOf(s),reorderShoots);
      }
    }
    if(!groups.children.length)el('p',term?'Съёмок по этому запросу нет.':'Добавьте первую съёмку.',groups);
  }
  search.oninput=()=>{query=search.value;filter();};
  filter();
}
function render() {
  drawMenu();const panel=$('edit');panel.replaceChildren();
  $('publish').disabled=!dirty;
  $('shootTab').setAttribute('aria-pressed',mode==='shoots');$('priceTab').setAttribute('aria-pressed',mode==='price');
  if(mode==='price'){drawPrice(panel);return;}
  const index=data.shoots.findIndex(s=>s.id===selected),s=data.shoots[index];
  if(!s)return;
  const title=el('h2',s.name,panel);
  field(panel,'Название в списке',s.name,v=>{s.name=v;title.textContent=v||'Без названия';drawMenu();});
  const l=el('label','Категория',panel),select=el('select',null,l);
  for(const [key,label] of Object.entries(data.categories)){const o=el('option',label,select);o.value=key;}
  select.value=s.category;select.onchange=()=>{s.category=select.value;folded.delete(s.category);change();drawMenu();};
  const tools=controls(panel);
  button(tools,'+ Категория',()=>{const name=prompt('Название новой категории')?.trim();if(!name)return;
    const key='cat-'+crypto.randomUUID();data.categories[key]=name;s.category=key;change();render();});
  button(tools,'Съёмку выше',()=>reorderShoots(index,index-1),index===0);
  button(tools,'Съёмку ниже',()=>reorderShoots(index,index+1),index===data.shoots.length-1);
  button(tools,'Удалить съёмку',()=>{if(!confirm('Убрать съёмку из портфолио при следующей публикации?'))return;
    data.shoots.splice(index,1);data.allOrder=data.allOrder.filter(id=>id!==s.id);selected=data.shoots[0]?.id;change();render();});
  const frames=s.frames??[s.cover];
  el('h3','Фотографии',panel);
  const drop=el('label',null,panel);drop.className='drop';el('strong','Добавить фотографии',drop);el('small','Перетащите файлы сюда или выберите на устройстве',drop);const upload=el('input',null,drop);upload.type='file';upload.multiple=true;upload.accept='image/jpeg,image/png,image/webp';upload.setAttribute('aria-label','Добавить фотографии');
  upload.onchange=()=>addFiles([...upload.files]);
  drop.ondragover=e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();drop.classList.add('over');}};
  drop.ondragleave=()=>drop.classList.remove('over');
  drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');if(e.dataTransfer.files.length)addFiles([...e.dataTransfer.files]);};
  async function addFiles(files){$('workspace').inert=true;
    try{for(const f of files){
      const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[f.type];
      if(!ext || f.size>25*1024*1024)throw Error('Выберите JPEG, PNG или WebP до 25 МБ на фотографию.');
      status('Подготовка WebP · '+f.name);
      const webp=await asWebP(f);
      const key=crypto.randomUUID()+'.webp';photos[key]=webp;frames.push(key);s.frames=frames;if(!s.cover)s.cover=key;change();
    }}catch(e){status(e.message);}finally{$('workspace').inert=false;render();}
  };
  const grid=el('div',null,panel);grid.className='grid';
  function reorder(from,to){move(frames,from,to);s.frames=frames;change();render();}
  frames.forEach((file,i)=>{
    const card=el('div',null,grid);card.className='card';card.dataset.frame=i;
    const img=el('img',null,card);img.draggable=false;img.alt='Кадр '+(i+1);
    img.src=imageUrl(file);
    el('small',(i+1)+(file===s.cover?' · Обложка':''),card);
    const c=controls(card);
    const handle=button(card,'⠿',()=>{});handle.className='grip';
    handle.ariaLabel='Перетащить кадр '+(i+1);handle.title='Перетащите кадр или используйте клавиши со стрелками';
    frameDrag(card,handle,i,reorder);
    ordered(img,'frame',i,reorder);
    button(c,'Обложка',()=>{s.cover=file;change();render();},file===s.cover);
    button(c,'Убрать',()=>{frames.splice(i,1);s.frames=frames;if(!frames.includes(s.cover))s.cover=frames[0]||'';change();render();});
  });
}
function drawPrice(panel){
  const s=data.conditions[service];el('h2',s.title.join(' '),panel);
  el('h3','Название и стоимость',panel);
  field(panel,'Заголовок · каждая строка отдельно',s.title.join('\n'),v=>{s.title=v.split('\n');drawMenu();},true);
  field(panel,'Стоимость и вводный текст',s.intro,v=>s.intro=v,true);
  el('h3','Условия съёмки',panel);
  s.sections.forEach((pair,i)=>{
    const n=el('details',null,panel);n.className='block';n.open=i===0||!pair[0];const heading=el('summary',pair[0]||'Новый блок',n);
    field(n,'Подзаголовок',pair[0],v=>{pair[0]=v;heading.textContent=v||'Новый блок';});
    field(n,'Описание',pair[1],v=>pair[1]=v,true);
    button(n,'Удалить блок',()=>{s.sections.splice(i,1);change();render();});
  });
  button(panel,'+ Блок прайса',()=>{s.sections.push(['','']);change();render();});
  el('h3','Примечание',panel);
  field(panel,'Заголовок примечания',s.footerTitle,v=>s.footerTitle=v||null);
  field(panel,'Примечание · пустая строка разделяет абзацы',s.footer.join('\n\n'),v=>s.footer=v.split('\n\n'),true);
}
$('shootTab').onclick=()=>{mode='shoots';render();};
$('priceTab').onclick=()=>{mode='price';render();};
$('publish').onclick=async()=>{
  $('workspace').inert=true;
  try{
    for(const s of data.shoots)if(!s.name.trim()||!s.cover)throw Error('Добавьте название и фотографию для каждой съёмки.');
    if(Object.values(data.conditions).some(s=>!s.title.join('').trim()))throw Error('Заполните заголовок каждого раздела прайса.');
    await saved.catch(()=>{});
    if(await head()!==base)throw Error('На сайте появилась другая версия. Публикация остановлена, чтобы сохранить чужие изменения.');
    const parent=await api(repo+'/git/commits/'+base);
    const entries=[];
    const used=new Set(data.shoots.flatMap(s=>[s.cover,...(s.frames||[])]));
    const files=Object.entries(photos).filter(([name])=>used.has(name));
    for(const [i,[name,file]] of files.entries()){
      status('Загрузка фотографии '+(i+1)+' из '+files.length);
      const blob=await api(repo+'/git/blobs','POST',{content:toBase64(new Uint8Array(await file.arrayBuffer())),encoding:'base64'});
      entries.push({path:'assets/'+name,type:'blob',mode:'100644',sha:blob.sha});
    }
    status('Сохранение версии в GitHub…');
    entries.push({path:'content.js',type:'blob',mode:'100644',content:prefix+JSON.stringify(data,null,2)+';\n'});
    const tree=await api(repo+'/git/trees','POST',{base_tree:parent.tree.sha,tree:entries});
    const commit=await api(repo+'/git/commits','POST',{message:'Обновить портфолио и прайс',tree:tree.sha,parents:[base]});
    await api(repo+'/git/refs/heads/'+branch,'PATCH',{sha:commit.sha,force:false});
    base=commit.sha;dirty=false;await storage('delete');
    // Keep object URLs available while Pages is building this version.
    photos={};$('publish').disabled=true;
    status('Версия сохранена в GitHub. GitHub Pages обновит сайт после сборки.');
  }catch(err){status(err.message);}finally{$('workspace').inert=false;}
};
