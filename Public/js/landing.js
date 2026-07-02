const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const authModal = document.querySelector("[data-auth-modal]");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authForms = document.querySelectorAll("[data-auth-form]");
const openAuthButtons = document.querySelectorAll("[data-open-auth]");
const closeAuthButtons = document.querySelectorAll("[data-close-auth]");
const yearNode = document.querySelector("[data-year]");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 20);
}

function setAuthMode(mode) {
  authTabs.forEach((tab) => {
    const active = tab.dataset.authTab === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  authForms.forEach((form) => {
    form.classList.toggle("active", form.dataset.authForm === mode);
    const message = form.querySelector("[data-form-message]");
    if (message) {
      message.textContent = "";
      message.classList.remove("error");
    }
  });
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  authModal.hidden = false;
  document.body.classList.add("modal-open");
  const firstInput = authModal.querySelector(".auth-form.active input, .auth-form.active select");
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 50);
  }
}

function closeAuth() {
  authModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function closeNav() {
  header.classList.remove("menu-open");
  document.body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function setFormMessage(form, message, isError = false) {
  const messageNode = form.querySelector("[data-form-message]");
  if (!messageNode) return;
  messageNode.textContent = message;
  messageNode.classList.toggle("error", isError);
}

navToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("menu-open");
  document.body.classList.toggle("nav-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a, button")) {
    closeNav();
  }
});

document.addEventListener("click", (event) => {
  const menuIsOpen = header.classList.contains("menu-open");
  const clickedInsideNav = nav.contains(event.target);
  const clickedToggle = navToggle.contains(event.target);

  if (menuIsOpen && !clickedInsideNav && !clickedToggle) {
    closeNav();
  }
});

openAuthButtons.forEach((button) => {
  button.addEventListener("click", () => openAuth(button.dataset.openAuth));
});

closeAuthButtons.forEach((button) => {
  button.addEventListener("click", closeAuth);
});

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.authTab));
});

authForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const isSignup = form.dataset.authForm === "signup";
    const submitButton = form.querySelector("button[type='submit']");
    const formData = Object.fromEntries(new FormData(form).entries());

    setFormMessage(form, "");
    submitButton.disabled = true;
    submitButton.textContent = isSignup ? "Creating account..." : "Logging in...";

    try {
      const response = await fetch(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setFormMessage(form, data.message || "Success");
      window.location.href = "/customer";
    } catch (error) {
      setFormMessage(form, error.message, true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = isSignup ? "Request solution plan" : "Login";
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !authModal.hidden) {
    closeAuth();
  }
  if (event.key === "Escape" && header.classList.contains("menu-open")) {
    closeNav();
  }
});

window.addEventListener("scroll", updateHeader, { passive: true });
yearNode.textContent = new Date().getFullYear();
updateHeader();

/* ============================================================
   Premium interactions — scroll reveal + 3D tilt
   ============================================================ */
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 3D tilt follows the pointer (skipped for reduced motion / touch).
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      el.addEventListener("mousemove", (event) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--ry", (px * 10).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-py * 10).toFixed(2) + "deg");
      });
      el.addEventListener("mouseleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  if (reduceMotion) return;

  const revealSelector = [
    ".section-heading",
    ".channel-card",
    ".service-card",
    ".step-card",
    ".testimonial-card",
    ".price-card",
    ".stat",
    ".logos-row",
    ".hero-copy",
    ".showcase-copy",
    ".dashboard-preview",
    ".cta-inner",
    ".faq-list details"
  ].join(",");

  const revealEls = Array.from(document.querySelectorAll(revealSelector));
  revealEls.forEach((el) => el.classList.add("reveal"));

  // Stagger cards within each grid for a cascading entrance.
  document
    .querySelectorAll(".channels-grid, .service-grid, .steps-grid, .testimonial-grid, .pricing-grid, .stats-band")
    .forEach((grid) => {
      Array.from(grid.children).forEach((child, index) => {
        child.style.setProperty("--reveal-delay", index * 70 + "ms");
      });
    });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }
})();
