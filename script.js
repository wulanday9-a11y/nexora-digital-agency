const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  const setMenuOpen = (isOpen) => {
    navLinks.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    menuToggle.textContent = isOpen ? "×" : "☰";
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setMenuOpen(false);
    });
  });

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  navLinks.querySelectorAll("a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });
}

const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const financeCard = document.querySelector(".finance-ui[data-fx-endpoint]");
if (financeCard) {
  const rateEndpoint = financeCard.dataset.fxEndpoint.trim();
  const rateDisplay = document.querySelector("#eur-usd-rate");
  const conversionDisplay = document.querySelector("#eur-usd-conversion");
  const statusDisplay = document.querySelector("#fx-status");
  const updatedDisplay = document.querySelector("#fx-updated");
  const changeDisplay = document.querySelector("#fx-change");
  const rateLine = document.querySelector("#eur-usd-line");
  const ratePoint = document.querySelector("#eur-usd-point");
  const rateHistory = [];
  let isUpdating = false;

  const setFeedError = (message) => {
    statusDisplay.textContent = message;
    statusDisplay.closest(".live-indicator").classList.add("is-error");
    updatedDisplay.textContent = "Check feed setup";
  };

  const drawRateHistory = () => {
    if (rateHistory.length === 0) {
      rateLine.setAttribute("d", "");
      ratePoint.classList.remove("visible");
      return;
    }

    const values = rateHistory.map(({ price }) => price);
    const lowest = Math.min(...values);
    const highest = Math.max(...values);
    const range = highest - lowest;
    const points = rateHistory.length === 1
      ? [{ x: 0, y: 40 }, { x: 320, y: 40 }]
      : rateHistory.map(({ price }, index) => {
          const x = (index / (rateHistory.length - 1)) * 320;
          const y = range === 0 ? 40 : 70 - ((price - lowest) / range) * 58;
          return { x, y };
        });

    rateLine.setAttribute("d", points.map(({ x, y }, index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" "));
    rateLine.removeAttribute("data-drawing");
    void rateLine.getBoundingClientRect();
    rateLine.setAttribute("data-drawing", "true");
    ratePoint.setAttribute("cx", points.at(-1).x.toFixed(1));
    ratePoint.setAttribute("cy", points.at(-1).y.toFixed(1));
    ratePoint.classList.add("visible");
  };

  const updateExchangeRate = async () => {
    if (isUpdating) return;
    isUpdating = true;
    statusDisplay.closest(".live-indicator").classList.remove("is-error");
    statusDisplay.textContent = "UPDATING";

    try {
      const response = await fetch(rateEndpoint, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`FX endpoint returned ${response.status}`);
      }

      const quote = await response.json();
      const price = Number(quote.price);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("FX endpoint returned an invalid EUR/USD price");
      }

      const previous = rateHistory.at(-1);
      rateHistory.push({ price, time: Date.now() });
      if (rateHistory.length > 30) rateHistory.shift();
      rateDisplay.textContent = price.toFixed(5);
      conversionDisplay.textContent = `${price.toFixed(5)} USD`;
      const marketTime = new Date(quote.timestamp);
      updatedDisplay.textContent = Number.isNaN(marketTime.getTime())
        ? "Updated just now"
        : `Updated ${marketTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      if (previous) {
        const change = ((price - previous.price) / previous.price) * 100;
        changeDisplay.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(3)}%`;
        changeDisplay.classList.toggle("is-up", change > 0);
        changeDisplay.classList.toggle("is-down", change < 0);
      }

      drawRateHistory();
      statusDisplay.textContent = "LIVE";
    } catch (error) {
      console.error("Unable to update the EUR/USD rate", error);
      setFeedError("FEED UNAVAILABLE");
    } finally {
      isUpdating = false;
    }
  };

  if (!rateEndpoint) {
    setFeedError("WORKER URL REQUIRED");
  } else {
    updateExchangeRate();
    window.setInterval(updateExchangeRate, 60_000);
  }
}
