// Configuration Firebase REST
const DB_URL = "https://iottp1-default-rtdb.firebaseio.com";
const API_KEY = "AIzaSyAFWo8akikhYXDu_VPfsjORb7t44SUaMIg";

let led1State = false;
let led2State = false;

// Initialisation du graphique Chart.js
const ctx = document.getElementById('iotChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Température (°C)', borderColor: '#f97316', data: [], fill: false, tension: 0.3 },
      { label: 'Humidité (%)', borderColor: '#3b82f6', data: [], fill: false, tension: 0.3 }
    ]
  },
  options: { responsive: true, maintainAspectRatio: false }
});

// Fonction pour récupérer les données Firebase via l'API REST
async function fetchData() {
  try {
    const response = await fetch(`${DB_URL}/.json?auth=${API_KEY}`);
    if (!response.ok) throw new Error("Erreur réseau");

    const data = await response.json();
    if (!data) return;

    // Mise à jour de l'état des LEDs
    led1State = !!data.Led_1;
    led2State = !!data.Led_2;
    updateLedUI('led1-text', 'btn-led1', led1State);
    updateLedUI('led2-text', 'btn-led2', led2State);

    // Mise à jour de la Température et de l'Humidité
    if (data.Temperature !== undefined) {
      document.getElementById('temp').innerText = data.Temperature;
    }
    if (data.Humidite !== undefined) {
      document.getElementById('hum').innerText = data.Humidite;
    }

    // Mise à jour du graphique
    const now = new Date().toLocaleTimeString();
    if (chart.data.labels.length > 10) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
      chart.data.datasets[1].data.shift();
    }
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(data.Temperature || 0);
    chart.data.datasets[1].data.push(data.Humidite || 0);
    chart.update();

    // Indicateur de statut
    const statusEl = document.getElementById('status');
    statusEl.innerText = "Connecté à Firebase";
    statusEl.className = "px-4 py-2 rounded-full text-xs font-semibold bg-green-100 text-green-800";

  } catch (error) {
    console.error("Erreur Firebase:", error);
    const statusEl = document.getElementById('status');
    statusEl.innerText = "Erreur de connexion";
    statusEl.className = "px-4 py-2 rounded-full text-xs font-semibold bg-red-100 text-red-800";
  }
}

// Fonction pour modifier l'état des LEDs dans Firebase
async function toggleLed(ledKey) {
  const currentState = (ledKey === 'Led_1') ? led1State : led2State;
  const newState = !currentState;

  try {
    await fetch(`${DB_URL}/${ledKey}.json?auth=${API_KEY}`, {
      method: 'PUT',
      body: JSON.stringify(newState),
      headers: { 'Content-Type': 'application/json' }
    });
    fetchData(); // Rafraîchir immédiatement
  } catch (err) {
    console.error("Échec de la commande LED:", err);
  }
}

// Mettre à jour le style visuel des boutons de LED
function updateLedUI(textId, btnId, state) {
  const textEl = document.getElementById(textId);
  const btnEl = document.getElementById(btnId);

  if (state) {
    textEl.innerText = "ALLUMÉE (ON)";
    textEl.className = "text-sm font-bold text-green-600";
    btnEl.className = "px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition shadow";
  } else {
    textEl.innerText = "ÉTEINTE (OFF)";
    textEl.className = "text-sm font-bold text-red-500";
    btnEl.className = "px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition";
  }
}

// Rafraîchissement automatique toutes les 2 secondes
setInterval(fetchData, 2000);
fetchData();