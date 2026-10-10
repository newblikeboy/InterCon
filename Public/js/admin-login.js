(() => {
  const form = document.querySelector("[data-admin-login]");
  const status = document.querySelector("[data-login-status]");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    status.textContent = "Signing in…";
    try {
      const response = await fetch("/api/auth/login", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not sign in");
      const access = await fetch("/api/admin/me", { credentials: "include" });
      if (!access.ok) throw new Error("This account does not have platform administrator access.");
      form.elements.password.value = "";
      window.location.replace("/admin");
    } catch (error) { status.textContent = error.message; status.classList.add("error"); }
    finally { submit.disabled = false; }
  });
})();
