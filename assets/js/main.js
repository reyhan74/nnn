// Simple SPA loader + dark mode + load articles from JSON
(async function(){
  // helper to fetch files
  async function loadFile(path){ return (await fetch(path)).text(); }

  // mount header, footer, and default content
  document.getElementById('header').innerHTML = await loadFile('header.html');
  document.getElementById('footer').innerHTML = await loadFile('footer.html');

  // set year in footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // load components
  const routes = {
    home: 'content/home.html',
    artikel: 'content/artikel.html',
    tentang: 'content/tentang.html'
  };

  // render route
  async function navigate(name, id){
    const container = document.getElementById('content');
    container.innerHTML = await loadFile(routes[name] || routes.home);

    // if home, load artikel preview
    if(name === 'home' || name === 'artikel'){
      await loadArticles(name, id);
    }

    // update active nav
    document.querySelectorAll('.nav-link').forEach(el=>{
      el.classList.toggle('active', el.getAttribute('data-link')===name);
    });

    // scroll to artikel section if triggered from CTA
    if(name === 'home' && id === 'artikel'){
      const el = document.querySelector('[data-scroll="artikel"]');
      if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }

  // load articles from JSON and render list or detail
  async function loadArticles(routeName, detailId){
    const res = await fetch('data/artikel.json');
    const data = await res.json();

    if(routeName === 'home'){
      const listEl = document.getElementById('artikelList');
      listEl.innerHTML = '';
      data.slice(0,3).forEach(a=>{
        const col = document.createElement('div');
        col.className = 'col-md-4';
        col.innerHTML = `
          <div class="card article-card shadow-sm border-0">
            <img src="${a.image}" alt="${a.title}">
            <div class="card-body">
              <h5 class="fw-bold">${a.title}</h5>
              <p class="text-muted small mb-2">${a.date}</p>
              <p class="mb-3">${a.excerpt}</p>
              <a href="#" class="btn btn-outline-primary" data-article="${a.id}">Baca Selengkapnya</a>
            </div>
          </div>`;
        listEl.appendChild(col);
      });

      // add click for detail
      document.querySelectorAll('[data-article]').forEach(btn=>{
        btn.addEventListener('click', e=>{
          e.preventDefault();
          const id = btn.getAttribute('data-article');
          navigate('artikel', id);
          history.pushState({route:'artikel', id}, '', `#artikel/${id}`);
        });
      });
    } else if(routeName === 'artikel') {
      // if detailId provided: show detail; else show listing
      if(detailId){
        const art = data.find(x=>x.id===detailId);
        if(art){
          document.getElementById('artikelDetail').innerHTML = `
            <article class="card p-3">
              <img src="${art.image}" class="img-fluid rounded mb-3" alt="${art.title}">
              <h1 class="mb-1">${art.title}</h1>
              <p class="text-muted small mb-3">${art.date}</p>
              <div>${art.content}</div>
              <a href="#" class="btn btn-link mt-3" id="backToList">&larr; Kembali ke daftar</a>
            </article>
          `;
          document.getElementById('backToList').addEventListener('click', e=>{
            e.preventDefault();
            navigate('artikel');
            history.pushState({route:'artikel'}, '', '#artikel');
          });
        } else {
          document.getElementById('artikelDetail').innerHTML = '<p>Artikel tidak ditemukan.</p>';
        }
      } else {
        // render listing all
        const listArea = document.getElementById('artikelDetail');
        listArea.innerHTML = `<div class="row g-4"></div>`;
        const row = listArea.querySelector('.row');
        data.forEach(a=>{
          const col = document.createElement('div');
          col.className = 'col-md-6';
          col.innerHTML = `
            <div class="card article-card h-100">
              <div class="row g-0">
                <div class="col-4">
                  <img src="${a.image}" class="img-fluid h-100" style="object-fit:cover;">
                </div>
                <div class="col-8">
                  <div class="card-body">
                    <h5 class="fw-bold mb-1">${a.title}</h5>
                    <p class="text-muted small mb-2">${a.date}</p>
                    <p class="mb-2">${a.excerpt}</p>
                    <a href="#" class="stretched-link" data-article="${a.id}">Baca Selengkapnya</a>
                  </div>
                </div>
              </div>
            </div>
          `;
          row.appendChild(col);
        });

        document.querySelectorAll('[data-article]').forEach(btn=>{
          btn.addEventListener('click', e=>{
            e.preventDefault();
            const id = btn.getAttribute('data-article');
            navigate('artikel', id);
            history.pushState({route:'artikel', id}, '', `#artikel/${id}`);
          });
        });
      }
    }
  }

  // initial route: check hash
  function parseHash(){
    const h = location.hash.replace('#','');
    if(!h) return {route:'home'};
    const parts = h.split('/');
    return {route: parts[0]||'home', id: parts[1]||null};
  }

  // navigation link bindings (delegated)
  document.addEventListener('click', function(e){
    const link = e.target.closest('[data-link]');
    if(link){
      e.preventDefault();
      const name = link.getAttribute('data-link');
      navigate(name);
      history.pushState({route:name}, '', `#${name}`);
    }
  });

  // dark mode toggle
  const applyTheme = (isDark)=>{
    document.documentElement.classList.toggle('dark', isDark);
    const icon = document.getElementById('toggleIcon');
    if(icon) icon.textContent = isDark ? '☀️' : '🌙';
  };
  // init from localStorage
  const stored = localStorage.getItem('darkMode') === 'true';
  applyTheme(stored);

  // bind toggle (button is in header, loaded earlier)
  document.getElementById('darkToggle').addEventListener('click', ()=>{
    const now = !document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', now);
    applyTheme(now);
  });

  // handle back/forward
  window.addEventListener('popstate', ()=>{
    const {route, id} = parseHash();
    navigate(route || 'home', id);
  });

  // navigate initial
  const hh = parseHash();
  await navigate(hh.route || 'home', hh.id);

})();
