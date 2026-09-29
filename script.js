import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWhRig_nRZiHZaHemAnozjDW7aA8IeRmc",
  authDomain: "jo-routes-96b40.firebaseapp.com",
  databaseURL: "https://jo-routes-96b40-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jo-routes-96b40",
  storageBucket: "jo-routes-96b40.firebasestorage.app",
  messagingSenderId: "862569448555",
  appId: "1:862569448555:web:17fc14899bb716aca75d2e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

console.log("Connected with Firebase done correctly !");

const destinationsRef = ref(db, 'destinations');

onValue(destinationsRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const destinationsArray = Array.isArray(data) ? data : Object.values(data);
    console.log("data from firebase :", destinationsArray);
    
    renderDestinations(destinationsArray);
  }
});
//function needs testing for all .html pages
function renderDestinations(items) {
  const container = document.getElementById('destinationsGrid');
  if (!container) return;

  container.innerHTML = '';

  const topSixDestinations = items.slice(0, 6);

  topSixDestinations.forEach(item => {
    const title = item.name || item.title || 'Destination';
    const description = item.description || 'Discover this amazing place in Jordan.';
    const location = item.location || item.governorate || 'Jordan';
    const category = Array.isArray(item.categories) ? item.categories[0] : (item.category || 'Explore');
    const image = item.image || item.imageUrl || '';

    const cardHTML = `
      <article class="destination-card">
        <div class="card-image">
          <img src="${image}" alt="${title}">
          <span class="card-tag">${category}</span>
        </div>
        <div class="card-content">
          <h3>${title}</h3>
          <p>${description}</p>
          <div class="card-meta">
            <span>${location}</span>
            <span>★★★★★</span>
          </div>
        </div>
      </article>
    `;

    container.innerHTML += cardHTML;
  });
}