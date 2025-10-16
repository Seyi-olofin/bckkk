// GSAP Animations - Centralized file for all page animations
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // === HOMEPAGE ANIMATIONS ===
    // Hero slider animations
    gsap.from(".hero-slide.active .hero-content", {
      opacity: 0,
      y: 50,
      duration: 1.2,
      ease: "power3.out"
    });

    // About section animations
    gsap.from(".about-left", {
      scrollTrigger: {
        trigger: ".about-section",
        start: "top 80%"
      },
      x: -100,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });

    gsap.from(".about-right .img-wrapper img", {
      scrollTrigger: {
        trigger: ".about-right",
        start: "top 80%"
      },
      x: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.3,
      ease: "power3.out"
    });

    // Services section animations
    gsap.from(".services-subheading", {
      scrollTrigger: {
        trigger: ".services-section",
        start: "top 80%"
      },
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out"
    });

    gsap.from(".services-section h2", {
      scrollTrigger: {
        trigger: ".services-section",
        start: "top 80%"
      },
      opacity: 0,
      y: 50,
      duration: 1,
      delay: 0.2,
      ease: "power3.out"
    });

    gsap.from(".service-card", {
      scrollTrigger: {
        trigger: ".services-section",
        start: "top 75%"
      },
      opacity: 0,
      y: 50,
      stagger: 0.1,
      duration: 1,
      ease: "power3.out"
    });

    // Why choose us section
    gsap.from(".why-left", {
      scrollTrigger: {
        trigger: ".why-choose-section",
        start: "top 80%"
      },
      opacity: 0,
      x: -100,
      duration: 1,
      ease: "power3.out"
    });

    gsap.from(".experience-card", {
      scrollTrigger: {
        trigger: ".why-choose-section",
        start: "top 80%"
      },
      opacity: 0,
      x: 100,
      duration: 1,
      ease: "power3.out"
    });

    // Video section
    gsap.from(".video-overlay h2", {
      scrollTrigger: {
        trigger: ".video-section",
        start: "top 80%"
      },
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out"
    });

    // CTA section
    gsap.from(".about-cta", {
      scrollTrigger: {
        trigger: ".about-cta",
        start: "top 90%"
      },
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });

    // === SERVICE PAGES ANIMATIONS ===
    // Hero animations for service pages
    gsap.from(".services-hero .hero-content", {
      opacity: 0,
      y: 50,
      duration: 1.2,
      ease: "power3.out"
    });

    // Service details section
    gsap.from(".service-details .section-title", {
      scrollTrigger: {
        trigger: ".service-details .section-title",
        start: "top 80%"
      },
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out"
    });

    gsap.from(".details-paragraph", {
      scrollTrigger: {
        trigger: ".details-paragraph",
        start: "top 85%"
      },
      opacity: 0,
      y: 40,
      delay: 0.3,
      duration: 1,
      ease: "power3.out"
    });

    // Mineral cards animations
    gsap.from(".mineral-card", {
      scrollTrigger: {
        trigger: ".minerals-grid",
        start: "top 80%"
      },
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out"
    });

    // Facts section animations
    gsap.from(".facts-left", {
      scrollTrigger: {
        trigger: ".facts-section",
        start: "top 80%"
      },
      opacity: 0,
      x: -50,
      duration: 1,
      ease: "power3.out"
    });

    gsap.from(".facts-right", {
      scrollTrigger: {
        trigger: ".facts-section",
        start: "top 80%"
      },
      opacity: 0,
      x: 50,
      duration: 1,
      ease: "power3.out"
    });

    // Counter animations for stat numbers
    gsap.utils.toArray(".stat-number").forEach((num) => {
      if (num) {
        let target = +num.dataset.target;
        gsap.fromTo(num,
          { innerText: 0 },
          {
            innerText: target,
            duration: 2,
            ease: "power3.out",
            snap: { innerText: 1 },
            scrollTrigger: {
              trigger: num,
              start: "top 80%"
            }
          }
        );
      }
    });

    // CTA animations
    gsap.from(".cta-container", {
      scrollTrigger: {
        trigger: ".cta-section",
        start: "top 85%"
      },
      opacity: 0,
      y: 50,
      duration: 1.2,
      ease: "power3.out"
    });

    // === GENERAL ANIMATIONS ===
    // Hover effects for CTA contacts
    const ctaContacts = document.querySelectorAll(".cta-contact");
    ctaContacts.forEach(contact => {
      contact.addEventListener("mouseenter", () => {
        gsap.to(contact, { scale: 1.05, duration: 0.2 });
      });
      contact.addEventListener("mouseleave", () => {
        gsap.to(contact, { scale: 1, duration: 0.2 });
      });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      });
    });

  } else {
    console.warn('GSAP or ScrollTrigger not loaded');
  }
});