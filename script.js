const cardsContainer = document.getElementById("cardsContainer");
const statusMsg = document.getElementById("statusMsg");
const searchInput = document.getElementById("searchInput");

let coinsData = [];
let favoriteCoins = JSON.parse(localStorage.getItem("favoriteCoins")) || [];

async function fetchCoins() {
  statusMsg.textContent = "⚙️ Fetching data...";
  const currency = 'usd'; // فقط دولار
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=50&page=1&sparkline=false`);
    const data = await res.json();
    coinsData = data;
    renderCards(coinsData);
    statusMsg.textContent = "✅ Data loaded!";
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "❌ Failed to fetch data.";
  }
}

async function fetchCoinChart(coinId) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`);
    const data = await res.json();
    return data.prices.map(item => item[1]);
  } catch (err) {
    console.error(err);
    return [];
  }
}

function toggleFavorite(coinId) {
  if (favoriteCoins.includes(coinId)) {
    favoriteCoins = favoriteCoins.filter(id => id !== coinId);
  } else {
    favoriteCoins.push(coinId);
  }
  localStorage.setItem("favoriteCoins", JSON.stringify(favoriteCoins));
  renderCards(coinsData);
}

async function renderCards(data) {
  cardsContainer.innerHTML = "";

  for (let i = 0; i < data.length; i++) {
    const coin = data[i];
    const card = document.createElement("div");
    card.classList.add("card");

    // Header
    const cardHeader = document.createElement("div");
    cardHeader.classList.add("card-header");

    const coinInfo = document.createElement("div");
    coinInfo.classList.add("coin-info");
    coinInfo.innerHTML = `<span class="rank">#${i + 1}</span><img src="${coin.image}" class="coin-img"><span class="coin-name">${coin.name} (${coin.symbol.toUpperCase()})</span>`;

    const star = document.createElement("div");
    star.classList.add("star");
    star.innerHTML = `<i class="fa-solid fa-star ${favoriteCoins.includes(coin.id) ? 'favorited' : ''}"></i>`;
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(coin.id);
    });

    cardHeader.appendChild(coinInfo);
    cardHeader.appendChild(star);

    // Price
    const price = document.createElement("div");
    price.classList.add("price");
    price.innerHTML = `USD ${coin.current_price.toLocaleString()} <span class="${coin.price_change_percentage_24h>=0?'change-up':'change-down'}">${coin.price_change_percentage_24h.toFixed(2)}%</span>`;

    // Market data
    const marketData = document.createElement("div");
    marketData.classList.add("market-data");
    marketData.innerHTML = `<span>Market Cap: USD ${coin.market_cap.toLocaleString()}</span> <span>Volume: USD ${coin.total_volume.toLocaleString()}</span>`;

    // Chart
    const chartDiv = document.createElement("div");
    chartDiv.classList.add("chart-cell");
    const canvas = document.createElement("canvas");
    chartDiv.appendChild(canvas);

    // Append all to card
    card.appendChild(cardHeader);
    card.appendChild(price);
    card.appendChild(marketData);
    card.appendChild(chartDiv);
    cardsContainer.appendChild(card);

    const chartData = await fetchCoinChart(coin.id);
    new Chart(canvas.getContext("2d"), {
      type: 'line',
      data: {
        labels: chartData.map((_, idx) => idx + 1),
        datasets: [{
          data: chartData,
          borderColor: '#4a90e2',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  }
}

// Search
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = coinsData.filter(coin => coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query));
  renderCards(filtered);
});

// Auto-refresh every 60s
setInterval(fetchCoins, 60000);

fetchCoins();
