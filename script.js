(() => {
  'use strict';

  /* ==========================================================================
     GALLERY DATA
     ==========================================================================
     A lista de ficheiros é explícita porque algumas fotografias têm nomes
     originais (e não apenas 1.webp, 2.webp, 3.webp...). Assim a galeria
     carrega somente imagens que existem no projeto.
     ========================================================================== */
  const GALLERY_DATA = [
    {
      id: 'portas-janelas',
      label: 'Portas & Janelas',
      icon: 'fa-door-open',
      folder: 'img/portas-janelas',
      files: ['1.webp', '2.webp', '3.webp', '4.webp', '5.webp', '6.webp', '7.webp', '8.webp', '9.webp', '10.webp'],
      caption: 'Porta e janela de alumínio com perfil decorativo'
    },
    {
      id: 'guarda-corpos',
      label: 'Guarda-Corpos',
      icon: 'fa-arrow-up-right-dots',
      folder: 'img/guarda-corpos',
      files: ['1.webp', '2.webp', '3.webp', '4.webp', '5.webp', '6.webp', '7.webp', '8.webp', '9.webp', '10.webp', '11.webp', '12.webp', '13.webp', '14.webp', '15.webp'],
      caption: 'Guarda-corpo em vidro temperado'
    },
    {
      id: 'corrimaos',
      label: 'Corrimãos',
      icon: 'fa-stairs',
      folder: 'img/corrimaos',
      files:  ['1.webp', '2.webp', '3.webp', '4.webp', '5.webp', '6.webp', '7.webp', '8.webp', '9.webp', '10.webp', '11.webp', '12.webp', '13.webp', '14.webp', '15.webp', '16.webp'],
      caption: 'Corrimão em vidro temperado / inox'
    },
    {
      id: 'boxes-banho',
      label: 'Boxes de Banho',
      icon: 'fa-shower',
      folder: 'img/boxes-banho',
      files: ['1.webp', '2.webp', '3.webp', '4.webp'],
      caption: 'Box de banho em vidro temperado'
    },
    {
      id: 'equipa',
      label: 'Equipa em Obra',
      icon: 'fa-people-group',
      folder: 'img/equipa',
      files: ['1.webp', '2.webp'],
      caption: 'Equipa SJL em trabalho de instalação'
    }
  ];

  /* -------------------- Header scroll state -------------------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* -------------------- Mobile nav toggle -------------------- */
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  const closeNav = () => {
    mainNav.classList.remove('is-open');
    header.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    header.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeNav();
  });

  /* -------------------- Scroll reveal -------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = Array.from(el.parentElement ? el.parentElement.children : []).indexOf(el);
          setTimeout(() => el.classList.add('is-visible'), Math.min(delay, 6) * 70);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* -------------------- Animated counters -------------------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window && counters.length) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => counterIO.observe(el));
  } else {
    counters.forEach(el => { el.textContent = el.getAttribute('data-count'); });
  }

  /* -------------------- Gallery: build items from GALLERY_DATA -------------------- */
  const mosaic = document.getElementById('gallery-mosaic');
  const galleryEmpty = document.getElementById('gallery-empty');
  const galleryControls = document.getElementById('gallery-controls');
  const galleryProgress = document.getElementById('gallery-progress');
  const galleryMore = document.getElementById('gallery-more');
  const galleryMoreCount = galleryMore ? galleryMore.querySelector('.gallery-more-count') : null;
  const filterButtons = document.querySelectorAll('.filter-chip');
  const GALLERY_PAGE_SIZE = 4;
  let flatItems = []; // { src, caption, categoryId, categoryLabel, categoryIcon }
  let activeFilter = 'all';
  let visibleLimit = GALLERY_PAGE_SIZE;
  let galleryRenderToken = 0;
  let galleryTransitionTimer = null;

  const updateGalleryControls = (matchingCount, visibleCount) => {
    if (!galleryControls) return;
    const remainingCount = Math.max(0, matchingCount - visibleCount);
    galleryControls.hidden = matchingCount === 0;
    if (galleryProgress) {
      galleryProgress.textContent = matchingCount
        ? `A mostrar ${visibleCount} de ${matchingCount} imagens`
        : '';
    }
    if (galleryMore) {
      galleryMore.hidden = remainingCount === 0;
      const nextCount = Math.min(GALLERY_PAGE_SIZE, remainingCount);
      if (galleryMoreCount) galleryMoreCount.textContent = String(nextCount);
      galleryMore.setAttribute('aria-label', `Mostrar mais ${nextCount} imagens`);
    }
  };

  const buildGallery = () => {
    if (!mosaic) return;
    const fragment = document.createDocumentFragment();
    flatItems = [];

    GALLERY_DATA.forEach(cat => {
      cat.files.forEach(file => {
        const src = `${cat.folder}/${file}`;
        const item = {
          src,
          caption: cat.caption,
          categoryId: cat.id,
          categoryLabel: cat.label,
          categoryIcon: cat.icon
        };
        flatItems.push(item);

        const btn = document.createElement('button');
        btn.className = 'mosaic-item';
        btn.dataset.category = cat.id;
        btn.dataset.index = String(flatItems.length - 1);
        btn.innerHTML = `
          <img src="${src}" alt="${cat.label} — SJL Caixilharia" loading="lazy">
          <span class="mosaic-category"><i class="fa-solid ${cat.icon}"></i> ${cat.label}</span>
          <span class="mosaic-label"><i class="fa-solid fa-expand"></i> Ver imagem</span>
        `;
        fragment.appendChild(btn);
      });
    });

    mosaic.innerHTML = '';
    if (!flatItems.length) {
      mosaic.hidden = true;
      if (galleryEmpty) galleryEmpty.hidden = false;
      if (galleryControls) galleryControls.hidden = true;
      return;
    }
    mosaic.hidden = false;
    if (galleryEmpty) galleryEmpty.hidden = true;
    mosaic.appendChild(fragment);

    mosaic.querySelectorAll('.mosaic-item').forEach(btn => {
      btn.addEventListener('click', () => {
        openLightbox(parseInt(btn.dataset.index, 10));
      });
    });

    applyFilter(activeFilter);
  };

  const applyFilter = (filterId, animateExit = false) => {
    if (!mosaic) return;
    const items = Array.from(mosaic.querySelectorAll('.mosaic-item'));
    const matchingItems = items.filter(el => filterId === 'all' || el.dataset.category === filterId);
    const renderToken = ++galleryRenderToken;

    clearTimeout(galleryTransitionTimer);
    const render = () => {
      if (renderToken !== galleryRenderToken) return;
      let visibleCount = 0;

      items.forEach(el => {
        const matchesFilter = filterId === 'all' || el.dataset.category === filterId;
        const show = matchesFilter && visibleCount < visibleLimit;

        el.classList.remove('is-visible');
        el.classList.toggle('is-hidden', !show);
        if (show) {
          el.dataset.mosaicLayout = String((visibleCount % 8) + 1);
          el.style.transitionDelay = `${Math.min(visibleCount, 7) * 45}ms`;
          visibleCount++;
        } else {
          el.style.transitionDelay = '';
        }
      });

      mosaic.dataset.visibleCount = String(visibleCount);
      mosaic.classList.remove('is-changing');
      requestAnimationFrame(() => {
        if (renderToken !== galleryRenderToken) return;
        items.forEach(el => {
          if (!el.classList.contains('is-hidden')) el.classList.add('is-visible');
        });
      });

      const hasMatches = matchingItems.length > 0;
      if (galleryEmpty) galleryEmpty.hidden = hasMatches;
      mosaic.hidden = !hasMatches;
      updateGalleryControls(matchingItems.length, visibleCount);
    };

    if (animateExit && mosaic.querySelector('.mosaic-item.is-visible')) {
      mosaic.classList.add('is-changing');
      galleryTransitionTimer = setTimeout(render, 160);
    } else {
      render();
    }
  };

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeFilter = btn.dataset.filter;
      visibleLimit = GALLERY_PAGE_SIZE;
      applyFilter(activeFilter, true);
    });
  });

  if (galleryMore) {
    galleryMore.addEventListener('click', () => {
      visibleLimit += GALLERY_PAGE_SIZE;
      applyFilter(activeFilter);
    });
  }

  buildGallery();

  /* -------------------- Lightbox gallery -------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCount = document.getElementById('lightbox-count');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  let lastFocused = null;
  let currentIndex = 0;

  const visibleIndices = () => {
    if (!mosaic) return flatItems.map((_, i) => i);
    return Array.from(mosaic.querySelectorAll('.mosaic-item:not(.is-hidden)'))
      .map(el => parseInt(el.dataset.index, 10));
  };

  const renderLightbox = (index) => {
    const item = flatItems[index];
    if (!item) return;
    currentIndex = index;
    lightboxImg.src = item.src;
    lightboxImg.alt = `${item.categoryLabel} — ${item.caption}`;
    lightboxCaption.innerHTML = `<i class="fa-solid ${item.categoryIcon}"></i> ${item.categoryLabel} — ${item.caption}`;
    if (lightboxCount) {
      const order = visibleIndices();
      const pos = order.indexOf(index) + 1;
      lightboxCount.textContent = order.length ? `${pos} / ${order.length}` : '';
    }
  };

  const openLightbox = (index) => {
    if (!lightbox) return;
    renderLightbox(index);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    lightboxClose.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  };

  const step = (dir) => {
    const order = visibleIndices();
    if (!order.length) return;
    const pos = order.indexOf(currentIndex);
    const nextPos = pos === -1 ? 0 : (pos + dir + order.length) % order.length;
    renderLightbox(order[nextPos]);
  };

  if (lightbox) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => step(-1));
    lightboxNext.addEventListener('click', () => step(1));
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });

    // Swipe support (mobile)
    let touchStartX = null;
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
      touchStartX = null;
    }, { passive: true });
  }

  /* -------------------- Footer year -------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------- Contact form -> WhatsApp -------------------- */
  const contactForm = document.getElementById('contact-form');

  const showToast = (message, icon) => {
    let toast = document.querySelector('.form-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'form-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('is-visible'), 3600);
  };

  const setFieldError = (row, hasError) => {
    if (!row) return;
    row.classList.toggle('has-error', hasError);
  };

  if (contactForm) {
    const nomeInput = document.getElementById('f-nome');
    const telInput = document.getElementById('f-telefone');
    const servicoSelect = document.getElementById('f-servico');
    const mensagemInput = document.getElementById('f-mensagem');

    // clear error state as the user types/selects
    [nomeInput, telInput, servicoSelect].forEach(field => {
      const evt = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(evt, () => setFieldError(field.closest('.form-row'), false));
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = nomeInput.value.trim();
      const telefone = telInput.value.trim();
      const servico = servicoSelect.value;
      const mensagem = mensagemInput.value.trim();

      let valid = true;
      if (!nome) { setFieldError(nomeInput.closest('.form-row'), true); valid = false; }
      if (!telefone || telefone.replace(/\D/g, '').length < 9) { setFieldError(telInput.closest('.form-row'), true); valid = false; }
      if (!servico) { setFieldError(servicoSelect.closest('.form-row'), true); valid = false; }

      if (!valid) {
        showToast('Preencha os campos obrigatórios.', 'fa-triangle-exclamation');
        return;
      }

      const lines = [
        `Olá, sou ${nome}.`,
        `Contacto: ${telefone}`,
        `Serviço pretendido: ${servico}`,
      ];
      if (mensagem) lines.push(`Mensagem: ${mensagem}`);
      lines.push('Gostaria de pedir um orçamento.');

      const text = encodeURIComponent(lines.join('\n'));
      const url = `https://wa.me/244974013108?text=${text}`;

      showToast('A abrir o WhatsApp...', 'fa-circle-check');
      window.open(url, '_blank', 'noopener');
      contactForm.reset();
    });
  }

})();
