const portalMenu = document.querySelector("[data-portal-menu]");
const portalSidebar = document.querySelector("[data-portal-sidebar]");
const portalNavLinks = document.querySelectorAll(".portal-nav a");

function closePortalMenu() {
  document.body.classList.remove("portal-menu-open");
  portalMenu.setAttribute("aria-expanded", "false");
}

portalMenu.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("portal-menu-open");
  portalMenu.setAttribute("aria-expanded", String(isOpen));
});

portalNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    portalNavLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    closePortalMenu();
  });
});

document.addEventListener("click", (event) => {
  if (!document.body.classList.contains("portal-menu-open")) return;
  const clickedInsideSidebar = portalSidebar.contains(event.target);
  const clickedMenu = portalMenu.contains(event.target);

  if (!clickedInsideSidebar && !clickedMenu) {
    closePortalMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("portal-menu-open")) {
    closePortalMenu();
  }
});
