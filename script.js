document.addEventListener("DOMContentLoaded", () => {

  // Update cart badge across the site from localStorage
  window.updateGlobalCartBadge = function() {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((s,i) => s + (i.quantity||0), 0);
      document.querySelectorAll('.cart-badge').forEach(el => {
        if (count > 0) {
          el.style.display = 'flex';
          el.textContent = count;
        } else {
          // hide if zero
          el.style.display = 'none';
        }
      });
    } catch (e) {
      console.warn('Could not update cart badge', e);
    }
  };

  // Run once at load to sync badges
  window.updateGlobalCartBadge();



  // ===== MOBILE DROPDOWN LOGIC =====
  document.querySelectorAll(".dropdown > a").forEach(link => {
    link.addEventListener("click", e => {
      if (window.innerWidth <= 992) { // mobile breakpoint
        e.preventDefault();           // prevent default link jump
        link.parentElement.classList.toggle("active"); // toggle submenu
      }
    });
  });

  // ===== HERO SLIDER =====
  const slides = document.querySelectorAll('.hero-slide');
  const prevBtn = document.querySelector('.arrow.left');
  const nextBtn = document.querySelector('.arrow.right');
  let current = 0;

  // Animate slide content
  function animateSlide(slide) {
    const tl = gsap.timeline();
    tl.fromTo(slide.querySelector('.tagline'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
      .fromTo(slide.querySelector('h1'), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' })
      .fromTo(slide.querySelector('.subtext'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
      .fromTo(slide.querySelector('.hero-buttons'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
  }

  // Show slide by index
  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.remove('active');
      gsap.set(slide.querySelectorAll('.tagline, h1, .subtext, .hero-buttons'), { opacity: 0, y: 40 });
      if (i === index) {
        slide.classList.add('active');
        animateSlide(slide);
      }
    });
  }

  // Arrow navigation - only if buttons exist
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      current = (current - 1 + slides.length) % slides.length;
      showSlide(current);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      current = (current + 1) % slides.length;
      showSlide(current);
    });
  }

  // Auto-slide
  let slideInterval = setInterval(() => {
    current = (current + 1) % slides.length;
    showSlide(current);
  }, 7000);

  // Pause auto-slide on hover - only if slider exists
  const slider = document.querySelector('.hero-slider');
  if (slider) {
    slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
    slider.addEventListener('mouseleave', () => {
      slideInterval = setInterval(() => {
        current = (current + 1) % slides.length;
        showSlide(current);
      }, 7000);
    });
  }

  // Initial display
  showSlide(current);
});




document.addEventListener("DOMContentLoaded", () => {
  const revealElements = document.querySelectorAll(".about-left, .about-right img, .about-cta");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
      }
    });
  }, { threshold: 0.2 });

  revealElements.forEach(el => {
    observer.observe(el);
  });
});





// Scroll buttons - only if they exist
const scrollWrapper = document.querySelector('.services-cards');
const scrollLeftBtn = document.querySelector('.scroll-btn.left');
const scrollRightBtn = document.querySelector('.scroll-btn.right');

if (scrollLeftBtn && scrollWrapper) {
  scrollLeftBtn.addEventListener('click', () => {
    scrollWrapper.scrollBy({ left: -320, behavior: 'smooth' });
  });
}

if (scrollRightBtn && scrollWrapper) {
  scrollRightBtn.addEventListener('click', () => {
    scrollWrapper.scrollBy({ left: 320, behavior: 'smooth' });
  });
}

// Scroll arrows for mobile
const scrollLeftArrow = document.querySelector('.scroll-arrow-left');
const scrollRightArrow = document.querySelector('.scroll-arrow-right');

if (scrollLeftArrow && scrollRightArrow) {
  scrollLeftArrow.addEventListener('click', () => {
    scrollWrapper.scrollBy({ left: -320, behavior: 'smooth' });
  });

  scrollRightArrow.addEventListener('click', () => {
    scrollWrapper.scrollBy({ left: 320, behavior: 'smooth' });
  });
}

// Animate services cards on scroll
gsap.from(".services-cards .service-card", {
  scrollTrigger: {
    trigger: ".services-section",
    start: "top 80%",
  },
  y: 50,
  opacity: 0,
  duration: 1,
  ease: "power3.out"
});




gsap.registerPlugin(ScrollTrigger);

// Fade in paragraphs one by one
gsap.from(".why-content p", {
  scrollTrigger: {
    trigger: ".why-choose-section",
    start: "top 80%",
  },
  y: 30,
  opacity: 0,
  duration: 0.8,
  stagger: 0.25,
  ease: "power2.out"
});

// Animate heading slightly from left
gsap.from(".why-choose-section .section-title", {
  scrollTrigger: {
    trigger: ".why-choose-section",
    start: "top 90%",
  },
  x: -50,
  opacity: 0,
  duration: 0.8,
  ease: "power2.out"
});

// Animate discover link
gsap.from(".discover-link", {
  scrollTrigger: {
    trigger: ".why-choose-section",
    start: "top 85%",
  },
  y: 20,
  opacity: 0,
  duration: 0.6,
  ease: "power2.out"
});


gsap.from(".site-footer .footer-section", {
  duration: 1,
  y: 50,
  opacity: 0,
  stagger: 0.2,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".site-footer",
    start: "top 80%"
  }
});

gsap.from(".footer-bottom", {
  duration: 1,
  opacity: 0,
  y: 20,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".site-footer",
    start: "top 80%"
  }
});

// Animate all footer headers on scroll
gsap.from(".footer-section h4", {
  scrollTrigger: {
    trigger: ".site-footer",
    start: "top 80%",
  },
  x: -50,
  opacity: 0,
  duration: 1,
  stagger: 0.2
});




gsap.from(".experience-card", {
  scrollTrigger: {
    trigger: ".experience-card",
    start: "top 80%"
  },
  y: 50,
  opacity: 0,
  duration: 0.8,
  ease: "power3.out"
});

gsap.from(".icon-item", {
  scrollTrigger: {
    trigger: ".experience-card",
    start: "top 80%"
  },
  y: 30,
  opacity: 0,
  duration: 0.6,
  stagger: 0.2,
  ease: "power3.out"
});



// JS for hover play - only if video exists
const video = document.getElementById('company-video');

if (video && video.parentElement) {
  video.parentElement.addEventListener('mouseenter', () => {
    video.play();
  });

  video.parentElement.addEventListener('mouseleave', () => {
    video.pause();
  });
}


// GSAP Animations
document.addEventListener("DOMContentLoaded", () => {
  gsap.from(".about-hero h1", { y: 50, opacity: 0, duration: 1, ease: "power3.out" });
  gsap.from(".about-hero p", { y: 20, opacity: 0, duration: 1, delay: 0.5, ease: "power3.out" });

  gsap.utils.toArray(".about-section").forEach((section, i) => {
    gsap.from(section, {
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
      },
      y: 50,
      opacity: 0,
      duration: 1,
      delay: i * 0.2,
      ease: "power3.out"
    });
  });
});



// Make sure GSAP and ScrollTrigger are loaded
gsap.registerPlugin(ScrollTrigger);

gsap.from(".profile-logo", {
  scrollTrigger: {
    trigger: "#company-profile",
    start: "top 80%",
  },
  x: -150,
  opacity: 0,
  scale: 0.5,
  duration: 1.2,
  ease: "back.out(1.2)"
});

gsap.from(".profile-info", {
  scrollTrigger: {
    trigger: "#company-profile",
    start: "top 80%",
  },
  x: 150,
  opacity: 0,
  duration: 1.2,
  ease: "power3.out"
});

gsap.from(".profile-divider", {
  scrollTrigger: {
    trigger: "#company-profile",
    start: "top 80%",
  },
  scaleY: 0,
  transformOrigin: "top center",
  duration: 1,
  ease: "power3.out"
});


gsap.registerPlugin(ScrollTrigger);

gsap.from(".team-member", {
  scrollTrigger: {
    trigger: ".team-section",
    start: "top 80%",
    toggleActions: "play none none none"
  },
  opacity: 0,
  y: 50,
  stagger: 0.2,
  duration: 1,
  ease: "power3.out"
});





gsap.registerPlugin(ScrollTrigger);

// Animate section fade in and content slide up
gsap.from(".capabilities-container", {
  scrollTrigger: {
    trigger: "#capabilities",
    start: "top 80%",
  },
  y: 50,
  opacity: 0,
  duration: 1,
  ease: "power3.out"
});

// Animate image shimmer separately if needed
gsap.from(".capabilities-image img", {
  scrollTrigger: {
    trigger: ".capabilities-image",
    start: "top 90%",
  },
  scale: 0.95,
  opacity: 0,
  duration: 1,
  ease: "power3.out"
});



gsap.registerPlugin(ScrollTrigger);

// Fade in the whole capabilities section
gsap.from("#capabilities", {
  scrollTrigger: "#capabilities",
  opacity: 0,
  y: 50,
  duration: 1.2,
  ease: "power3.out"
});

// Fade in text separately
gsap.from(".capabilities-text", {
  scrollTrigger: ".capabilities-text",
  opacity: 0,
  y: 30,
  duration: 1,
  delay: 0.3,
  ease: "power3.out"
});



  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".about-section-container", {
    scrollTrigger: {
      trigger: ".about-section-container",
      start: "top 80%", // starts anim when section is 80% in viewport
      toggleActions: "play none none none"
    },
    y: 100,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out"
  });





document.addEventListener("DOMContentLoaded", () => {
  // Guard against multiple initializations if this script is included more than once
  if (window.__folsmeNavInitialized) return;
  window.__folsmeNavInitialized = true;

  // Load dynamic content for pages that need it
  loadDynamicContent();

  const hamburger = document.getElementById("folsme-hamburger");
  const navMenu = document.getElementById("folsme-menu");
  const closeBtn = document.getElementById("folsme-close");
  const dropdownToggles = document.querySelectorAll(".folsme-toggle");

  // Create backdrop element once and attach to body
  let backdrop = document.getElementById('nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  // === HAMBURGER TOGGLE ===
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
    document.body.classList.toggle("no-scroll", navMenu.classList.contains("active"));
    backdrop.classList.toggle('nav-backdrop-visible', navMenu.classList.contains('active'));

    // 🧹 When menu closes, reset all dropdowns
    if (!navMenu.classList.contains("active")) {
      document.querySelectorAll(".folsme-dropdown.open").forEach(d => {
        d.classList.remove("open");
        const caret = d.querySelector(".caret");
        if (caret) caret.classList.remove("rotate");
      });
    }
  });

  // === CLOSE BUTTON ===
  closeBtn.addEventListener("click", () => {
    navMenu.classList.remove("active");
    hamburger.classList.remove("active");
    document.body.classList.remove("no-scroll");
    backdrop.classList.remove('nav-backdrop-visible');

    // 🧹 Also close all dropdowns
    document.querySelectorAll(".folsme-dropdown.open").forEach(d => {
      d.classList.remove("open");
      const caret = d.querySelector(".caret");
      if (caret) caret.classList.remove("rotate");
    });
  });

  // === DROPDOWN TOGGLE (Mobile Only) ===
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener("click", e => {
      if (window.innerWidth <= 992) {
        e.preventDefault();
        const parent = toggle.closest(".folsme-dropdown");
        const caret = toggle.querySelector(".caret");

        // Close other open dropdowns before opening new one
        document.querySelectorAll(".folsme-dropdown.open").forEach(d => {
          if (d !== parent) {
            d.classList.remove("open");
            const otherCaret = d.querySelector(".caret");
            if (otherCaret) otherCaret.classList.remove("rotate");
          }
        });

        // Toggle current dropdown
        parent.classList.toggle("open");
        if (caret) caret.classList.toggle("rotate");
      }
    });
  });

  // Close menu when clicking outside (on backdrop)
  backdrop.addEventListener('click', () => {
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.classList.remove('no-scroll');
    backdrop.classList.remove('nav-backdrop-visible');

    document.querySelectorAll('.folsme-dropdown.open').forEach(d => {
      d.classList.remove('open');
      const caret = d.querySelector('.caret');
      if (caret) caret.classList.remove('rotate');
    });
  });

  // Ensure menu is closed when resizing to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 992 && navMenu.classList.contains('active')) {
      navMenu.classList.remove('active');
      hamburger.classList.remove('active');
      document.body.classList.remove('no-scroll');
      backdrop.classList.remove('nav-backdrop-visible');
    }
  });

  // === ACTIVE LINK HIGHLIGHT ===
  const current = window.location.pathname.split("/").pop();
  document.querySelectorAll("#folsme-menu a").forEach(a => {
    if (a.getAttribute("href") === current) {
      a.classList.add("active");
    }
  });

  // Load dynamic content for pages that need it
  async function loadDynamicContent() {
    // Load products for generators page
    if (document.querySelector('.generators-grid')) {
      await loadProducts();
    }

    // Load minerals for mining page
    if (document.querySelector('.minerals-grid')) {
      await loadMinerals();
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch('https://folsme-bck.onrender.com/api/products');
      const data = await response.json();

      if (data.success) {
        const grid = document.querySelector('.generators-grid');
        if (grid) {
          grid.innerHTML = data.products.map(product => `
            <div class="generator-card">
              <div class="generator-image">
                <img src="${product.images && product.images[0] || 'images/placeholder.jpg'}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
              </div>
              <div class="generator-info">
                <h3 class="generator-name">${product.name}</h3>
                <p class="generator-price">₦${((product.price_cents || 0) / 100).toFixed(2)}</p>
                <p class="generator-description">${product.description || 'High-quality generator'}</p>
                <button class="btn btn-primary" onclick="addToCart(${JSON.stringify(product).replace(/"/g, '"')})">
                  Add to Cart
                </button>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  async function loadMinerals() {
    try {
      const response = await fetch('https://folsme-bck.onrender.com/api/minerals');
      const data = await response.json();

      if (data.success) {
        const grid = document.querySelector('.minerals-grid');
        if (grid) {
          grid.innerHTML = data.minerals.map(mineral => `
            <div class="mineral-card">
              <div class="mineral-image">
                <img src="${mineral.image}" alt="${mineral.name}" onerror="this.src='images/placeholder.jpg'">
              </div>
              <div class="mineral-info">
                <h3 class="mineral-name">${mineral.name}</h3>
                <p class="mineral-price">₦${mineral.price.toLocaleString()}</p>
                <p class="mineral-description">${mineral.description}</p>
                <div class="mineral-specs">
                  ${mineral.specs.map(spec => `<span class="spec-tag">${spec}</span>`).join('')}
                </div>
                <button class="btn btn-primary mineral-buy-btn" onclick="openMineralModal('${mineral.id}')">
                  Buy Now
                </button>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Failed to load minerals:', error);
    }
  }

  // Make functions globally available
  window.loadProducts = loadProducts;
  window.loadMinerals = loadMinerals;

  // Cart functionality
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
  }

  function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    showNotification(`${product.name} added to cart!`, 'success');
  }

  // Notification system
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // Make cart functions globally available
  window.addToCart = addToCart;
  window.showNotification = showNotification;
  window.updateCartBadge = updateCartBadge;

  // Initialize cart badge on page load
  updateCartBadge();
});
