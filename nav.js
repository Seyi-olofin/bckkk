// Navigation functionality - Robust implementation for all pages
(function() {
  'use strict';

  let hamburger, navMenu, closeBtn, dropdownToggles;

  function initNavigation() {
    hamburger = document.getElementById("folsme-hamburger");
    navMenu = document.getElementById("folsme-menu");
    closeBtn = document.getElementById("folsme-close");
    dropdownToggles = document.querySelectorAll(".folsme-toggle");

    console.log("Initializing navigation. Elements found:", {
      hamburger: !!hamburger,
      navMenu: !!navMenu,
      closeBtn: !!closeBtn,
      dropdownToggles: dropdownToggles.length
    });

    if (!hamburger || !navMenu) {
      console.error("Critical navigation elements not found. Retrying in 100ms...");
      setTimeout(initNavigation, 100);
      return;
    }

    setupHamburgerMenu();
    setupDropdownToggles();
    setupCloseButton();
    setupKeyboardNavigation();
    setupOutsideClick();
  }

  function setupHamburgerMenu() {
    // Function to toggle menu
    const toggleMenu = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const isActive = navMenu.classList.contains("active");

      if (isActive) {
        // Close menu
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
        document.body.classList.remove("no-scroll");
        document.documentElement.classList.remove("no-scroll");

        // Reset all dropdowns
        document.querySelectorAll(".folsme-dropdown.open").forEach(d => {
          d.classList.remove("open");
          const caret = d.querySelector(".caret");
          if (caret) caret.classList.remove("rotate");
          const submenu = d.querySelector(".folsme-submenu");
          if (submenu) {
            submenu.style.display = "none";
          }
        });
      } else {
        // Open menu
        hamburger.classList.add("active");
        navMenu.classList.add("active");
        document.body.classList.add("no-scroll");
        document.documentElement.classList.add("no-scroll");
      }
    };

    // Click event
    hamburger.addEventListener("click", toggleMenu);

    // Touch event for mobile devices
    hamburger.addEventListener("touchstart", (e) => {
      e.preventDefault();
      toggleMenu();
    }, { passive: false });

    // Additional fallback - ensure hamburger is clickable
    hamburger.style.cursor = "pointer";
    hamburger.style.userSelect = "none";
    hamburger.setAttribute("aria-label", "Toggle navigation menu");
    hamburger.setAttribute("role", "button");
  }

  function setupCloseButton() {
    if (!closeBtn) return;

    const closeMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();

      navMenu.classList.remove("active");
      hamburger.classList.remove("active");
      document.body.classList.remove("no-scroll");
      document.documentElement.classList.remove("no-scroll");

      // 🧹 Also close all dropdowns
      document.querySelectorAll(".folsme-dropdown.open").forEach(d => {
        d.classList.remove("open");
        const caret = d.querySelector(".caret");
        if (caret) caret.classList.remove("rotate");
        // Also hide submenu on close button click
        const submenu = d.querySelector(".folsme-submenu");
        if (submenu) {
          submenu.style.display = "none";
        }
      });
    };

    closeBtn.addEventListener("click", closeMenu);
    // Add touch event for mobile devices
    closeBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      closeMenu(e);
    }, { passive: false });
  }

  function setupDropdownToggles() {
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener("click", e => {
        if (window.innerWidth <= 992) {
          e.preventDefault();
          e.stopPropagation();

          const parent = toggle.closest(".folsme-dropdown");
          const caret = toggle.querySelector(".caret");

          // Close other open dropdowns before opening new one
          document.querySelectorAll(".folsme-dropdown.open").forEach(d => {
            if (d !== parent) {
              d.classList.remove("open");
              const otherCaret = d.querySelector(".caret");
              if (otherCaret) otherCaret.classList.remove("rotate");
              // Hide other submenus
              const otherSubmenu = d.querySelector(".folsme-submenu");
              if (otherSubmenu) {
                otherSubmenu.style.display = "none";
              }
            }
          });

          // Toggle current dropdown
          parent.classList.toggle("open");
          if (caret) caret.classList.toggle("rotate");

          // Force submenu visibility for mobile
          const submenu = parent.querySelector(".folsme-submenu");
          if (submenu) {
            if (parent.classList.contains("open")) {
              submenu.style.display = "block";
            } else {
              submenu.style.display = "none";
            }
          }
        }
      });

      // Add touch event for mobile devices
      toggle.addEventListener("touchstart", (e) => {
        if (window.innerWidth <= 992) {
          e.preventDefault();
          toggle.click();
        }
      }, { passive: false });
    });
  }

  function setupKeyboardNavigation() {
    // === ESC KEY TO CLOSE MENU ===
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
        hamburger.classList.remove("active");
        document.body.classList.remove("no-scroll");
        document.documentElement.classList.remove("no-scroll");
      }
    });
  }

  function setupOutsideClick() {
    // === CLICK OUTSIDE TO CLOSE MENU ===
    document.addEventListener("click", (e) => {
      if (navMenu && hamburger && navMenu.classList.contains("active")) {
        // Don't close if clicking on dropdown toggle or submenu items
        if (e.target.closest(".folsme-toggle") || e.target.closest(".folsme-submenu")) {
          return;
        }

        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
          navMenu.classList.remove("active");
          hamburger.classList.remove("active");
          document.body.classList.remove("no-scroll");
          document.documentElement.classList.remove("no-scroll");
        }
      }
    });

    // === TOUCH OUTSIDE TO CLOSE MENU (Mobile) ===
    document.addEventListener("touchstart", (e) => {
      if (navMenu && hamburger && navMenu.classList.contains("active")) {
        // Don't close if touching dropdown toggle or submenu items
        if (e.target.closest(".folsme-toggle") || e.target.closest(".folsme-submenu")) {
          return;
        }

        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
          navMenu.classList.remove("active");
          hamburger.classList.remove("active");
          document.body.classList.remove("no-scroll");
          document.documentElement.classList.remove("no-scroll");
        }
      }
    }, { passive: false });
  }

  // === DESKTOP DROPDOWN HOVER ===
  const dropdowns = document.querySelectorAll(".folsme-dropdown");
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector(".folsme-toggle");
    const submenu = dropdown.querySelector(".folsme-submenu");

    if (toggle && submenu) {
      // Mouse enter - show dropdown
      dropdown.addEventListener("mouseenter", () => {
        if (window.innerWidth > 992) {
          dropdown.classList.add("open");
        }
      });

      // Mouse leave - hide dropdown
      dropdown.addEventListener("mouseleave", () => {
        if (window.innerWidth > 992) {
          dropdown.classList.remove("open");
        }
      });
    }
  });

  // === ACTIVE LINK HIGHLIGHT ===
  const current = window.location.pathname.split("/").pop();
  document.querySelectorAll("#folsme-menu a").forEach(a => {
    if (a.getAttribute("href") === current) {
      a.classList.add("active");
    }
  });

  // === CLOSE MENU ON LINK CLICK (Mobile) ===
  document.querySelectorAll("#folsme-menu a").forEach(link => {
    link.addEventListener("click", (e) => {
      // Don't close if it's a dropdown toggle link or submenu item
      if (link.classList.contains("folsme-toggle") || link.closest(".folsme-submenu")) {
        // For submenu links, close the menu after navigation
        if (link.closest(".folsme-submenu") && window.innerWidth <= 992) {
          setTimeout(() => {
            navMenu.classList.remove("active");
            hamburger.classList.remove("active");
            document.body.classList.remove("no-scroll");
            document.documentElement.classList.remove("no-scroll");
          }, 300); // Small delay to allow navigation
        }
        return; // Let the dropdown toggle handle this
      }

      if (window.innerWidth <= 992) {
        navMenu.classList.remove("active");
        hamburger.classList.remove("active");
        document.body.classList.remove("no-scroll");
        document.documentElement.classList.remove("no-scroll");
      }
    });
  });

  // Initialize navigation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();