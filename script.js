const tableBody = document.querySelector("#cryptoTable tbody");
const statusMsg = document.getElementById("statusMsg");
const searchInput = document.getElementById("searchInput");
const currencySelect = document.getElementById("currencySelect");

let coinsData = [];
let favoriteCoins = JSON.parse(localStorage.getItem("favoriteCoins")) || [];

// جلب بيانات العملات
async function fetchCoins() {
  statusMsg.textContent = "⚙️ Fetching data...";
  const currency = currencySelect.value;
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=50&page=1&sparkline=false`);
    const data = await res.json();
    coinsData = data;
    renderTable(coinsData);
    statusMsg.textContent = "✅ Data loaded!";
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "❌ Failed to fetch data.";
  }
}

// جلب بيانات الـ 7 أيام لكل عملة
async function fetchCoinChart(coinId, currency) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=7&interval=daily`);
    const data = await res.json();
    return data.prices.map(item => item[1]);
  } catch (err) {
    console.error(err);
    return [];
  }
}

// حفظ المفضلة
function toggleFavorite(coinId) {
  if (favoriteCoins.includes(coinId)) {
    favoriteCoins = favoriteCoins.filter(id => id !== coinId);
  } else {
    favoriteCoins.push(coinId);
  }
  localStorage.setItem("favoriteCoins", JSON.stringify(favoriteCoins));
  renderTable(coinsData);
}

// عرض الجدول
async function renderTable(data) {
  tableBody.innerHTML = "";
  const currency = currencySelect.value;

  for (let i = 0; i < data.length; i++) {
    const coin = data[i];
    const tr = document.createElement("tr");

    const tdChart = document.createElement("td");
    tdChart.classList.add("chart-cell");
    const canvas = document.createElement("canvas");
    tdChart.appendChild(canvas);

    const tdStar = document.createElement("td");
    tdStar.classList.add("star");
    tdStar.innerHTML = `<i class="fa-solid fa-star ${favoriteCoins.includes(coin.id) ? 'favorited' : ''}"></i>`;
    tdStar.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(coin.id);
    });

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><img src="${coin.image}" alt="${coin.name}" class="coin-img">${coin.name} (${coin.symbol.toUpperCase()})</td>
      <td>${currency.toUpperCase()} ${coin.current_price.toLocaleString()}</td>
      <td class="${coin.price_change_percentage_24h >=0 ? 'price-up' : 'price-down'}">${coin.price_change_percentage_24h.toFixed(2)}%</td>
      <td>${currency.toUpperCase()} ${coin.market_cap.toLocaleString()}</td>
      <td>${currency.toUpperCase()} ${coin.total_volume.toLocaleString()}</td>
    `;

    tr.appendChild(tdChart);
    tr.appendChild(tdStar);
    tableBody.appendChild(tr);

    // Chart 7 أيام
    const chartData = await fetchCoinChart(coin.id, currency);
    new Chart(canvas.getContext("2d"), {
      type: 'line',
      data: {
        labels: chartData.map((_, idx) => idx + 1),
        datasets: [{
          data: chartData,
          borderColor: '#00ffc6',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          tension: 0.2
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  }
}

// 🔹 Search filter
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = coinsData.filter(coin => coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query));
  renderTable(filtered);
});

// 🔹 Change currency
currencySelect.addEventListener("change", fetchCoins);

// 🔹 Auto-refresh every 60s
setInterval(fetchCoins, 60000);

fetchCoins();
