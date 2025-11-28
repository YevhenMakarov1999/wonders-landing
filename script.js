/***********************
 * Stations
 ***********************/
const STATIONS = [
    "Zermatt Bus Terminal","Interlaken Ost Bus Station","Grindelwald Bus Terminal","Lauterbrunnen Bahnhof","Lucerne Bahnhofquai",
    "Chamonix-Mont-Blanc Sud (France, near Swiss border)","Geneva Bus Station","Bern PostAuto Terminal","Gstaad Bus Station",
    "St. Moritz Bahnhof PostAuto","Verbier Village","Davos Platz Postautohaltestelle","Andermatt Gotthardpass","Täsch Bahnhof (Shuttle to Zermatt)","Flims Dorf Post",
    "Chamonix Sud Bus Station","Annecy Gare Routière","Grenoble Gare Routière","Nice Airport (Bus to Alps)","Bourg-Saint-Maurice Gare Routière",
    "Morzine Gare Routière","Les Gets Gare Routière","Val d'Isère Centre","Courchevel 1850","Megève Place du Village",
    "Aosta Autostazione","Bolzano Autostazione","Trento Autostazione","Cortina d'Ampezzo Autostazione","Bormio Bus Station",
    "Livigno Centro","Merano Autostazione","Sestriere Bus Stop","Ortisei (St. Ulrich) Autostazione","Canazei Piazza Marconi",
    "Innsbruck Hauptbahnhof Bus Terminal","Salzburg Süd Busbahnhof","Mayrhofen Bahnhof","Lech am Arlberg Postamt","Kitzbühel Hahnenkammbahn",
    "Ischgl Seilbahn","Zell am See Postplatz","Bad Gastein Bahnhof","St. Anton am Arlberg Bahnhof","Sölden Postamt",
    "Garmisch-Partenkirchen Bahnhof (Bus Station)","Berchtesgaden Busbahnhof","Oberstdorf Busbahnhof","Füssen Bahnhof (Bus Station)","Mittenwald Bahnhof (Bus Station)",
    "Bled Bus Station","Bohinj Jezero","Kranjska Gora Avtobusna Postaja"
];

/***********************
 * Burger menu
 ***********************/
(() => {
    const burgerBtn  = document.getElementById('burger-icon');
    const burgerMenu = document.getElementById('burger-menu');
    if (!burgerBtn || !burgerMenu) return;

    const TRANSITION_MS = 200;

    const openMenu = () => {

        burgerMenu.classList.remove('hidden');
        requestAnimationFrame(() => burgerMenu.classList.add('open'));
        document.body.classList.add('no-scroll');
        burgerBtn.classList.add('active');
        burgerBtn.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
        burgerMenu.classList.remove('open');

        const onEnd = () => {
            burgerMenu.classList.add('hidden');
            burgerMenu.removeEventListener('transitionend', onEnd);
        };

        burgerMenu.addEventListener('transitionend', onEnd);
        setTimeout(onEnd, TRANSITION_MS + 20);

        document.body.classList.remove('no-scroll');
        burgerBtn.classList.remove('active');
        burgerBtn.setAttribute('aria-expanded', 'false');
    };

    const isOpen = () => burgerMenu.classList.contains('open');


    burgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen() ? closeMenu() : openMenu();
    });


    burgerMenu.addEventListener('click', (e) => {
        e.stopPropagation();

        if (e.target.closest('a')) closeMenu();
    });

    // клик вне меню — закрыть
    document.addEventListener('click', (e) => {
        if (isOpen() && !burgerMenu.contains(e.target) && !burgerBtn.contains(e.target)) {
            closeMenu();
        }
    });

    // ESC — закрыть
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) closeMenu();
    });
})();

/***********************
 * Autocomplete
 ***********************/
function makeAutocomplete(inputId, listId){
    const input = document.getElementById(inputId);
    const list  = document.getElementById(listId);
    if(!input || !list) return;

    function render(q){
        q = (q||'').toLowerCase();
        const filtered = q ? STATIONS.filter(s => s.toLowerCase().includes(q)) : STATIONS;
        list.innerHTML = '';
        if (!filtered.length){
            const li = document.createElement('li');
            li.textContent = 'Not found';
            li.className = 'not-found';
            list.appendChild(li);
            return;
        }
        const frag = document.createDocumentFragment();
        filtered.slice(0,100).forEach(s=>{
            const li = document.createElement('li');
            li.textContent = s;
            frag.appendChild(li);
        });
        list.appendChild(frag);
    }

    input.addEventListener('focus', ()=>{ list.classList.remove('hidden'); render(input.value); });
    input.addEventListener('input', e => render(e.target.value));

    input.addEventListener('blur', ()=> setTimeout(()=> list.classList.add('hidden'), 120));

    list.addEventListener('mousedown', e=>{
        const li = e.target.closest('li'); if(!li) return;
        input.value = li.textContent;
        list.classList.add('hidden');
    });
}
makeAutocomplete('departure-input','departure-list');
makeAutocomplete('arrival-input','arrival-list');

/***********************
 * Passengers
 ***********************/
(() => {
    const dec = document.getElementById('dec-pass');
    const inc = document.getElementById('inc-pass');
    const out = document.getElementById('passengers');
    if(!dec || !inc || !out) return;

    let v = 1;
    const sync = ()=>{
        out.textContent = String(v);
        dec.disabled = v<=1;
        inc.disabled = v>=12;
    };
    dec.addEventListener('click', ()=>{ if(v>1){ v--; sync(); }});
    inc.addEventListener('click', ()=>{ if(v<12){ v++; sync(); }});
    sync();
})();

/***********************
* POPUP CALENDAR
***********************/
(() => {
    // элементы интерфейса
    const departBtn = document.getElementById('depart-btn');
    const returnBtn = document.getElementById('return-btn');
    const departOut = document.getElementById('depart-output');
    const returnOut = document.getElementById('return-output');

    const cal = document.querySelector('.date-field .calendar'); // календарь лежит в первом .date-field
    if (!departBtn || !cal) return;

    const leftHeader  = document.getElementById('left-month-year');
    const rightHeader = document.getElementById('right-month-year');
    const prevBtn     = document.getElementById('prev-month-btn');
    const nextBtn     = document.getElementById('next-month-btn');
    const currDatesEl = document.getElementById('curr-month-dates');
    const nextDatesEl = document.getElementById('next-month-dates');

    // состояние
    let activeBtn = null;
    let activeOut = null;
    let viewDate  = new Date();
    let selDepart = null;
    let selReturn = null;


    const today0 = (() => { const d=new Date(); d.setHours(0,0,0,0); return d; })();
    const isBefore = (a,b) => a.getTime() < b.getTime();
    const fmt = d => d.toLocaleDateString('en', { day:'numeric', month:'long', year:'numeric' });


    function renderMonth(container, y, m, minAllowedDate){
        container.innerHTML = '';
        const first = new Date(y, m, 1);
        const total = new Date(y, m+1, 0).getDate();


        const lead = (first.getDay() + 6) % 7;
        for (let i=0;i<lead;i++){
            const s = document.createElement('span');
            s.className='empty';
            container.appendChild(s);
        }

        for (let day=1; day<=total; day++){
            const dObj = new Date(y, m, day);
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'date';
            b.textContent = String(day);
            b.dataset.y = y; b.dataset.m = m; b.dataset.d = day;

            // дизейблим прошлые дни и всё, что раньше minAllowedDate
            if (isBefore(dObj, minAllowedDate)) {
                b.disabled = true;
            }
            container.appendChild(b);
        }
    }

    function render(){
        const left  = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const right = new Date(left.getFullYear(), left.getMonth()+1, 1);

        leftHeader.textContent  = left.toLocaleDateString('en', { month:'long', year:'numeric' });
        rightHeader.textContent = right.toLocaleDateString('en', { month:'long', year:'numeric' });



        const minAllowed = (activeBtn === returnBtn && selDepart) ? selDepart : today0;

        renderMonth(currDatesEl, left.getFullYear(),  left.getMonth(),  minAllowed);
        renderMonth(nextDatesEl, right.getFullYear(), right.getMonth(), minAllowed);


        const mark = (date, cont) => {
            if(!date) return;
            const y = +date.getFullYear(), m = +date.getMonth(), d = +date.getDate();
            cont.querySelectorAll('.date').forEach(btn=>{
                if (+btn.dataset.y===y && +btn.dataset.m===m && +btn.dataset.d===d){
                    btn.classList.add('selected');
                }
            });
        };
        mark(selDepart, currDatesEl); mark(selDepart, nextDatesEl);
        mark(selReturn, currDatesEl); mark(selReturn, nextDatesEl);
    }


    render();


    prevBtn.addEventListener('click', ()=>{ viewDate.setMonth(viewDate.getMonth()-1); render(); });
    nextBtn.addEventListener('click', ()=>{ viewDate.setMonth(viewDate.getMonth()+1); render(); });


    function onDateClick(e){
        const btn = e.target.closest('.date'); if(!btn) return;
        if (btn.disabled) return; // не даём выбрать запрещённый день

        const d = new Date(+btn.dataset.y, +btn.dataset.m, +btn.dataset.d);


        if (activeBtn === returnBtn && selDepart && isBefore(d, selDepart)) {
            return; // просто игнорируем
        }


        cal.querySelectorAll('.date.selected').forEach(x=>x.classList.remove('selected'));
        btn.classList.add('selected');

        if (activeBtn === departBtn){
            selDepart = d;

            if (selReturn && isBefore(selReturn, selDepart)) selReturn = null;
        } else if (activeBtn === returnBtn){
            selReturn = d;
        }
    }
    currDatesEl.addEventListener('click', onDateClick);
    nextDatesEl.addEventListener('click', onDateClick);


    function openFor(btn, out){
        activeBtn = btn; activeOut = out || null;

        const field = btn.closest('.field'); if (field) field.appendChild(cal);
        cal.classList.remove('hidden');

        render();
    }

    // кнопки Apply/Reset
    cal.querySelector('.apply-btn').addEventListener('click', ()=>{
        // финальная проверка Return ≥ Depart
        if (activeBtn === returnBtn && selReturn && selDepart && isBefore(selReturn, selDepart)){
            alert('Return date cannot be earlier than Depart.');
            return;
        }
        if (activeBtn === departBtn && selDepart){
            departBtn.textContent = fmt(selDepart);
            if (departOut) departOut.textContent = fmt(selDepart);
        }
        if (activeBtn === returnBtn && selReturn){
            returnBtn.textContent = fmt(selReturn);
            if (returnOut) returnOut.textContent = fmt(selReturn);
        }
        cal.classList.add('hidden');
    });

    cal.querySelector('.reset-btn').addEventListener('click', ()=>{
        if (activeBtn === departBtn){
            selDepart = null;
            departBtn.textContent = 'Depart';
            if(departOut) departOut.textContent='Not selected';
        }
        if (activeBtn === returnBtn){
            selReturn = null;
            returnBtn.textContent = 'Return';
            if(returnOut) returnOut.textContent='Not selected';
        }
        cal.querySelectorAll('.date.selected').forEach(x=>x.classList.remove('selected'));
        render();
    });

    // открыть по клику
    departBtn.addEventListener('click', ()=> openFor(departBtn, departOut));
    returnBtn?.addEventListener('click', ()=>{
        if (returnBtn.hasAttribute('disabled')) return;
        openFor(returnBtn, returnOut);
    });

    // закрыть по Esc/вне
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') cal.classList.add('hidden'); });
    document.addEventListener('mousedown', e=>{
        if (!cal.classList.contains('hidden') && !cal.contains(e.target) && e.target !== activeBtn){
            cal.classList.add('hidden');
        }
    });

    // Round trip / One way
    const one = document.querySelector('input[name="trip"][value="oneway"]');
    const round = document.querySelector('input[name="trip"][value="round"]');
    function toggleReturn(){
        if (!returnBtn) return;
        const enable = !!(round && round.checked);
        if (enable){
            returnBtn.removeAttribute('disabled');
            returnBtn.style.cursor = 'pointer';
            returnBtn.style.opacity = '1';
        } else {
            returnBtn.setAttribute('disabled','');
            returnBtn.style.cursor = 'not-allowed';
            returnBtn.style.opacity = '.6';
            // скрыть календарь, если он открыт под Return
            if (!cal.classList.contains('hidden') && activeBtn === returnBtn) cal.classList.add('hidden');
        }
        //
        render();
    }
    one?.addEventListener('change', toggleReturn);
    round?.addEventListener('change', toggleReturn);
    toggleReturn();
})();
/***********************
 * Form validation
 ***********************/
(() => {
    const form   = document.getElementById('search-form');
    const errors = document.getElementById('errors');
    if(!form) return;
    const fail = msg => { if(errors) errors.textContent = msg; };

    form.addEventListener('submit', e=>{
        e.preventDefault(); if (errors) errors.textContent = '';
        const dep = document.getElementById('departure-input')?.value.trim();
        const arr = document.getElementById('arrival-input')?.value.trim();
        const pax = Number(document.getElementById('passengers')?.textContent || 1);
        const departText = document.getElementById('depart-btn')?.textContent || '';
        const datePicked = /\d/.test(departText);

        if(!dep || !arr) return fail('Fill in both stations.');
        if(dep === arr)  return fail('Stations must be different.');
        if(!datePicked)  return fail('Pick a departure date.');
        if(pax < 1 || pax > 12) return fail('Passengers must be 1–12.');

        window.location.href = './bus-list.html';
    });
})();

/***********************
 * FAQ accordion
 ***********************/
(() => {
    const root  = document.getElementById('faqSection') || document;
    const items = Array.from(root.querySelectorAll('.faq-item'));
    const heads = Array.from(root.querySelectorAll('.faq-head'));

    items.forEach((item, idx) => {
        const btn  = item.querySelector('.faq-head');
        const body = item.querySelector('.faq-body');
        const id   = `faq-body-${idx}`;
        body.id = id;
        btn.setAttribute('aria-controls', id);
        btn.setAttribute('aria-expanded', item.classList.contains('faq-item--open') ? 'true' : 'false');

        if (!item.classList.contains('faq-item--open')) {
            body.style.display = 'none';
        }
        const togg = btn.querySelector('.faq-toggle');
        if (togg) togg.textContent = item.classList.contains('faq-item--open') ? '✕' : '+';
    });

    function closeItem(item) {
        if (!item.classList.contains('faq-item--open')) return;
        item.classList.remove('faq-item--open');
        const btn = item.querySelector('.faq-head');
        const body = item.querySelector('.faq-body');
        const togg = btn.querySelector('.faq-toggle');
        btn.setAttribute('aria-expanded', 'false');
        if (togg) togg.textContent = '+';
        body.style.display = 'none';
    }

    function openItem(item) {
        if (item.classList.contains('faq-item--open')) return;
        items.forEach(closeItem);
        item.classList.add('faq-item--open');
        const btn = item.querySelector('.faq-head');
        const body = item.querySelector('.faq-body');
        const togg = btn.querySelector('.faq-toggle');
        btn.setAttribute('aria-expanded', 'true');
        if (togg) togg.textContent = '✕';
        body.style.display = 'block';
    }

    root.addEventListener('click', (e) => {
        const btn = e.target.closest('.faq-head');
        if (!btn) return;
        const item = btn.closest('.faq-item');
        if (item.classList.contains('faq-item--open')) closeItem(item);
        else openItem(item);
    });

    heads.forEach((btn) => {
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });
})();