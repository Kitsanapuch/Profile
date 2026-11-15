/* Sticky section indicator for the isolated motion preview. */
(() => {
  const nav = document.querySelector('.nav');
  const label = document.getElementById('navCurrent');
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"], .mobile-menu a[href^="#"]'));
  if (!nav || !label || !links.length) return;

  const available = new Set(links.map(link => link.getAttribute('href').slice(1)));
  const mainIds = ['home', 'studio-focus', 'education', 'experience', 'activities', 'projects', 'papers', 'contact'];
  const mainSections = mainIds.map(id => ({ id, node: document.getElementById(id) })).filter(item => item.node);
  let activeId = '';
  let manualId = '';
  let frame = 0;

  function currentHash() {
    try { return decodeURIComponent(location.hash.slice(1)); }
    catch (_) { return ''; }
  }

  function navId(id) {
    return id === 'education' ? 'about' : id;
  }

  function setActive(id) {
    id = available.has(id) ? id : 'home';
    if (id === activeId) return;
    activeId = id;
    nav.dataset.current = id;
    const matching = links.find(link => link.getAttribute('href') === `#${id}`);
    label.textContent = matching ? matching.textContent.trim() : id;
    links.forEach(link => {
      const selected = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function currentSection() {
    const probe = nav.getBoundingClientRect().height + Math.min(120, window.innerHeight * .17);
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 6) return 'contact';
    for (const item of mainSections) {
      const rect = item.node.getBoundingClientRect();
      if (rect.top <= probe && rect.bottom > probe) return navId(item.id);
    }
    const skills = document.getElementById('skills');
    if (skills) {
      const rect = skills.getBoundingClientRect();
      if (rect.top <= probe && rect.bottom > probe) return 'skills';
    }
    const about = document.getElementById('about');
    if (about) {
      const rect = about.getBoundingClientRect();
      if (rect.top <= probe && rect.bottom > probe) return 'about';
    }
    let closest = 'home';
    for (const item of mainSections) {
      if (item.node.getBoundingClientRect().top <= probe) closest = navId(item.id);
    }
    return closest;
  }

  function sync() {
    frame = 0;
    if (!manualId) setActive(currentSection());
  }
  function queue() {
    if (!frame) frame = requestAnimationFrame(sync);
  }
  function releaseManual() {
    if (!manualId) return;
    manualId = '';
    queue();
  }

  links.forEach(link => link.addEventListener('click', () => {
    manualId = link.getAttribute('href').slice(1);
    setActive(manualId);
  }));
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  window.addEventListener('wheel', releaseManual, { passive: true });
  window.addEventListener('touchstart', releaseManual, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) releaseManual();
  });
  window.addEventListener('hashchange', () => {
    const id = currentHash();
    if (available.has(id)) {
      manualId = id;
      setActive(id);
    } else {
      manualId = '';
      queue();
    }
  });

  const initial = currentHash();
  if (available.has(initial)) {
    manualId = initial;
    setActive(initial);
  } else {
    setActive(currentSection());
  }
  queue();
})();
