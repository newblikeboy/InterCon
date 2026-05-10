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
    const message = form.querySelector("[data-form-message]");
    const isSignup = form.dataset.authForm === "signup";
    const submitButton = form.querySelector("button[type='submit']");
    const formData = Object.fromEntries(new FormData(form).entries());

    message.textContent = "";
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

      message.textContent = data.message || "Success";
      window.location.href = "/customer";
    } catch (error) {
      message.textContent = error.message;
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
