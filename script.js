
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase


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


// Global data


let destinations = [];
let guides = [];


// Read Firebase


const destinationsRef = ref(db, "destinations");
const guidesRef = ref(db, "guides");


onValue(destinationsRef, (snapshot) => {
  const data = snapshot.val();

  if (!data) {
    destinations = [];
    console.log("No destinations found.");
    return;
  }

  // Firebase can return either an object or an array
  destinations = Array.isArray(data)
    ? data
    : Object.values(data);

  console.log("Destinations loaded:", destinations);

  // If we are on route page, render it after Firebase loads
  if (document.getElementById("route-plan")) {
    renderRoutePage();
  }

  // Home page
  if (document.getElementById("destinationsGrid")) {
    renderHomeDestinations();
  }
});


onValue(guidesRef, (snapshot) => {
  const data = snapshot.val();

  if (!data) {
    guides = [];
    console.log("No guides found.");
    return;
  }

  guides = Array.isArray(data)
    ? data
    : Object.values(data);

  console.log("Guides loaded:", guides);

  if (document.getElementById("route-plan")) {
    renderRoutePage();
  }
});


// Category normalization

function normalizeCategories(categories) {

  if (!categories) {
    return [];
  }

  let categoryList = [];

  // Normal array
  if (Array.isArray(categories)) {
    categoryList = categories;
  }

  // If Firebase gives an object
  else if (typeof categories === "object") {
    categoryList = Object.values(categories);
  }

  // If category is one string
  else if (typeof categories === "string") {
    categoryList = [categories];
  }

  // Split categories such as:
  // "Nature · Adventure · Hidden Gems"
  return categoryList
    .flatMap(category =>
      String(category).split("·")
    )
    .map(category => category.trim())
    .map(category => {

      // Fix known typo in the Firebase data
      if (category.toLowerCase() === "adventureon") {
        return "Adventure";
      }

      // Make Food & Local Life match Firebase
      if (category.toLowerCase() === "food & local life") {
        return "Food & Local Experiences";
      }

      return category;
    })
    .filter(Boolean);
}


// Category comparison

function hasCategory(item, selectedCategory) {

  const itemCategories = normalizeCategories(item.categories);

  return itemCategories.some(category =>
    category.toLowerCase() === selectedCategory.toLowerCase()
  );
}


// PLAN PAGE

function setupPlanPage() {

  const optionCards = document.querySelectorAll(".option-card");

  if (!optionCards.length) {
    return;
  }

  // Days selection
  

  optionCards.forEach(card => {

    card.addEventListener("click", () => {

      // Remove selected from all
      optionCards.forEach(item => {
        item.classList.remove("selected");
      });

      // Select current
      card.classList.add("selected");

      const selectedDays = card.dataset.days || card.innerText.trim();

      const dayCount = getDayCount(selectedDays);

      localStorage.setItem(
        "joRoutesPreferences",
        JSON.stringify({
          days: selectedDays,
          dayCount: dayCount
        })
      );
    });

  });


  
  // Experience selection


  const experienceCards =
    document.querySelectorAll(".experience-card");

  experienceCards.forEach(card => {

    card.addEventListener("click", () => {

      experienceCards.forEach(item => {
        item.classList.remove("selected");
      });

      card.classList.add("selected");

      const heading = card.querySelector("h3");

      if (!heading) {
        return;
      }

      let category = heading.textContent.trim();

      // Match HTML wording to Firebase
      if (category === "Food & Local Life") {
        category = "Food & Local Experiences";
      }

      const savedPreferences =
        JSON.parse(
          localStorage.getItem("joRoutesPreferences")
        ) || {};

      savedPreferences.category = category;

      localStorage.setItem(
        "joRoutesPreferences",
        JSON.stringify(savedPreferences)
      );

    });

  });

  // Create My Route
  

  const createRouteButton =
    document.querySelector(".dark-button[href='route.html']");

  if (createRouteButton) {

    createRouteButton.addEventListener("click", (event) => {

      const preferences =
        JSON.parse(
          localStorage.getItem("joRoutesPreferences")
        ) || {};

      // Check days
      if (!preferences.days) {

        event.preventDefault();

        alert("Please select the duration of your journey.");

        return;
      }


      // Check category
      if (!preferences.category) {

        event.preventDefault();

        alert("Please select an experience type.");

        return;
      }
      
      // Filter destinations
      

      const filteredDestinations =
        destinations.filter(destination =>
          hasCategory(
            destination,
            preferences.category
          )
        );


      if (filteredDestinations.length === 0) {

        event.preventDefault();

        alert(
          "No destinations were found for this experience."
        );

        return;
      }

      // Choose destinations
      
      const selectedDestinations =
        selectDestinations(
          filteredDestinations,
          preferences.dayCount
        );


      
      // Choose guide from SAME category
      

      const matchingGuides =
        guides.filter(guide =>
          hasCategory(
            guide,
            preferences.category
          )
        );


      
        const selectedGuide =matchingGuides.length? matchingGuides[Math.floor(Math.random() * matchingGuides.length)]: null;


      // Save generated route
      
      const route = {

        id: "route-" + Date.now(),

        days: preferences.days,

        dayCount: preferences.dayCount,

        category: preferences.category,

        destinations: selectedDestinations,

        guide: selectedGuide,

        createdAt: new Date().toISOString()

      };


      localStorage.setItem(
        "joRoutesCurrentRoute",
        JSON.stringify(route)
      );

    });

  }

}

// Convert selected duration

function getDayCount(daysText) {

  const text = String(daysText)
    .toLowerCase()
    .trim();


  if (text.includes("2") && text.includes("3")) {
    return 3;
  }

  if (text.includes("4") && text.includes("5")) {
    return 5;
  }

  if (text.includes("6") && text.includes("7")) {
    return 7;
  }

  if (text.includes("8") && text.includes("10")) {
    return 10;
  }

  if (text.includes("10+")) {
    return 10;
  }


  // If HTML contains a simple number
  const number = parseInt(text);

  return Number.isNaN(number) ? 5 : number;
}


// Select destinations


function selectDestinations(list, numberOfDays) {

  if (!list.length) {
    return [];
  }


  // Shuffle a copy of the list
  const shuffled = [...list].sort(
    () => Math.random() - 0.5
  );


  // Never duplicate a destination
  return shuffled.slice(0, numberOfDays);
}


// ROUTE PAGE


function renderRoutePage() {

  const routePage =
    document.getElementById("route-plan");

  if (!routePage) {
    return;
  }


  const savedRoute =
    localStorage.getItem("joRoutesCurrentRoute");

  if (!savedRoute) {
    return;
  }


  const route = JSON.parse(savedRoute);


  // Wait until both Firebase collections are available
  if (!destinations.length) {
    return;
  }


  // Summary

  const summaryItems =
    routePage.querySelectorAll(".summary-item");


  if (summaryItems.length >= 4) {

    const values = summaryItems;

    if (values[0]) {
      const strong = values[0].querySelector("strong");
      if (strong) {
        strong.textContent = route.days;
      }
    }

    if (values[1]) {
      const strong = values[1].querySelector("strong");
      if (strong) {
        strong.textContent = route.category;
      }
    }

    if (values[2]) {
      const strong = values[2].querySelector("strong");
      if (strong) {
        strong.textContent =
          route.destinations.length;
      }
    }

  }


  
  // Day cards
  

  const dayCards =
    routePage.querySelectorAll(".day-card");


  if (!dayCards.length) {
    return;
  }


  const firstDayCard = dayCards[0];

  // Remove existing cards
  dayCards.forEach(card => card.remove());


  // Find container where cards originally existed
  const leftColumn =
    routePage.querySelector(".route-layout > div");

  if (!leftColumn) {
    return;
  }


  route.destinations.forEach(
    (destination, index) => {

      const card =
        firstDayCard.cloneNode(true);

      card.dataset.destinationId =
        destination.id || "";


      
      // Day number
      

      const dayHeading =
        card.querySelector("h3");

      if (dayHeading) {

        dayHeading.textContent =
          `Day ${index + 1} — ${destination.name}`;
      }


     
      // Image
      

      const image =
        card.querySelector(".day-image img");

      if (image) {

        image.src =
          destination.image || "";

        image.alt =
          destination.name || "Jordan destination";

        image.onerror = () => {
          image.style.display = "none";
        };
      }

      // Description
      

      const paragraphs =
        card.querySelectorAll(".day-content p");

      if (paragraphs.length > 0) {

        paragraphs[0].textContent =
          destination.description || "";
      }


      // Meta information
      

      const meta =
        card.querySelector(".day-meta");


      if (meta) {

        meta.innerHTML = "";


        const duration =
          document.createElement("span");

        duration.textContent =
          `Duration: ${destination.duration || "N/A"}`;


        const cost =
          document.createElement("span");

        cost.textContent =
          `Estimated cost: ${destination.estimatedCost || "N/A"}`;


        const location =
          document.createElement("span");

        location.textContent =
          destination.location || "";


        meta.appendChild(duration);
        meta.appendChild(cost);
        meta.appendChild(location);


        // Google Maps
        if (destination.mapsLink) {

          const maps =
            document.createElement("a");

          maps.href =
            destination.mapsLink;

          maps.target = "_blank";

          maps.rel = "noopener noreferrer";

          maps.textContent =
            "Location on Maps →";

          meta.appendChild(maps);
        }

      }


      leftColumn.appendChild(card);

    }
  );

  // Guide
  
  renderGuide(route.guide);


  
  // Save Route button
  

  setupSaveRouteButton();

}


// GUIDE

function renderGuide(guide) {

  if (!guide) {
    console.log("No matching guide found.");
    return;
  }


  const routePage =
    document.getElementById("route-plan");

  if (!routePage) {
    return;
  }


  // Try to find existing guide section
  
    const guideImage = document.querySelector(".guide-photo img");


  const guideName =
    routePage.querySelector(".guide-name");


  const guideTitle =
    routePage.querySelector(".guide-title");


  if (guideImage) {

    guideImage.src =
      guide.photo || "";

    guideImage.alt =
      guide.name || "Tour guide";
  }


  if (guideName) {
    guideName.textContent =
      guide.name || "";
  }


  if (guideTitle) {

    guideTitle.textContent =
      `${guide.yearsOfExperience || 0} Years Experience`;
  }


  // More general guide card
  const guideInfo =
    routePage.querySelector(".guide-info");

  if (guideInfo) {

    const heading =
      guideInfo.querySelector("h3");

    if (heading) {
      heading.textContent =
        guide.name || "";
    }

    const span =
      guideInfo.querySelector("span");

    if (span) {
      span.textContent =
        `${guide.yearsOfExperience || 0} Years Experience`;
    }
  }


  
  // Guide details
  
  const boxes =
    routePage.querySelectorAll(".guide-box");


  if (boxes.length) {

    boxes.forEach((box, index) => {

      const strong =
        box.querySelector("strong");

      if (!strong) {
        return;
      }


      if (index === 0) {

        strong.textContent =
          guide.location || "N/A";
      }


      if (index === 1) {

        strong.textContent =
          guide.languages
            ? guide.languages.join(", ")
            : "N/A";
      }

    });

  }

  
  // Description

  const description =
    routePage.querySelector(".guide-description");


  if (description) {

    description.textContent =
      guide.shortBio || "";
  }


  
  // Contact
  

  const contact =
    routePage.querySelector(".contact-guide");


  if (contact && guide.contactEmail) {

    contact.href =
      `mailto:${guide.contactEmail}`;

    contact.textContent =
      "Contact Guide";
  }

}

//my update
/*const experienceCards = document.querySelectorAll(".experience-card");

experienceCards.forEach(card => {
    card.addEventListener("click", () => {
        card.classList.toggle("selected");
    });
});*/

// SAVE ROUTE

function setupSaveRouteButton() {

  const buttons =
    document.querySelectorAll(".side-panel .dark-button");


  buttons.forEach(button => {

    if (
      !button.textContent
        .toLowerCase()
        .includes("save route")
    ) {
      return;
    }


    // Avoid adding listener more than once
    if (button.dataset.listenerAdded === "true") {
      return;
    }

    button.dataset.listenerAdded = "true";


    button.addEventListener("click", (event) => {

      event.preventDefault();


      const currentRoute =
        localStorage.getItem(
          "joRoutesCurrentRoute"
        );


      if (!currentRoute) {

        alert("There is no route to save.");

        return;
      }


      const route =
        JSON.parse(currentRoute);


      let savedRoutes =
        JSON.parse(
          localStorage.getItem(
            "joRoutesSaved"
          )
        ) || [];


      // Avoid saving the exact same route twice
      const alreadySaved =
        savedRoutes.some(
          saved =>
            saved.category === route.category &&
            saved.days === route.days
        );


      if (!alreadySaved) {

        savedRoutes.push(route);

        localStorage.setItem(
          "joRoutesSaved",
          JSON.stringify(savedRoutes)
        );

        alert("Route saved successfully!");

      } else {

        alert("This route is already saved.");

      }

    });

  });

}

// MY ROUTES PAGE


function renderMyRoutes() {

  const container =
    document.querySelector(".saved-routes");


  if (!container) {
    return;
  }


  const savedRoutes =
    JSON.parse(
      localStorage.getItem(
        "joRoutesSaved"
      )
    ) || [];


  // No saved routes
  
  if (!savedRoutes.length) {
    container.innerHTML = "";
    return;
}

  
  // There are saved routes
  

  container.innerHTML = "";


  savedRoutes.forEach((route, index) => {

    const card =
      document.createElement("article");

    card.className =
      "saved-route-card";


    const firstDestination =
      route.destinations &&
      route.destinations.length
        ? route.destinations[0]
        : null;


    const image =
      firstDestination?.image ||
      "images/HeroSection_homepage.webp";


    card.innerHTML = `

      <div class="card-image">
        <img
          src="${image}"
          alt="${route.category || "Jordan Route"}"
        >
      </div>

      <div class="card-content">

        <div class="route-label">
          Saved Journey
        </div>

        <h3>
          ${route.category || "Jordan Journey"}
        </h3>

        <p>
          ${route.days || ""} ·
          ${route.destinations?.length || 0}
          destinations
        </p>

        <div class="route-actions">

          <a
            href="#"
            class="dark-button view-route"
            data-index="${index}"
          >
            View Route
          </a>

          <a
            href="#"
            class="secondary-button delete-route"
            data-index="${index}"
          >
            Delete
          </a>

        </div>

      </div>

    `;


    container.appendChild(card);

  });


  // View route
  

  container
    .querySelectorAll(".view-route")
    .forEach(button => {

      button.addEventListener("click", event => {

        event.preventDefault();

        const index =
          Number(button.dataset.index);


        const route =
          savedRoutes[index];


        localStorage.setItem(
          "joRoutesCurrentRoute",
          JSON.stringify(route)
        );


        window.location.href =
          "route.html";

      });

    });

  
  // Delete route
  

  container
    .querySelectorAll(".delete-route")
    .forEach(button => {

      button.addEventListener("click", event => {

        event.preventDefault();


        const index =
          Number(button.dataset.index);


        savedRoutes.splice(index, 1);


        localStorage.setItem(
          "joRoutesSaved",
          JSON.stringify(savedRoutes)
        );


        renderMyRoutes();

      });

    });

}



// HOME PAGE

function renderHomeDestinations() {

  const grid =
    document.getElementById(
      "destinationsGrid"
    );


  if (!grid || !destinations.length) {
    return;
  }


  grid.innerHTML = "";


  destinations
    .slice(0, 6)
    .forEach(destination => {

      const card =
        document.createElement("article");

      card.className =
        "destination-card";


      const categories =
        normalizeCategories(
          destination.categories
        );


      const firstCategory =
        categories.length
          ? categories[0]
          : "Jordan";


      card.innerHTML = `

        <div class="card-image">

          <img
            src="${destination.image || ""}"
            alt="${destination.name || "Jordan destination"}"
          >

          <span class="card-tag">
            ${firstCategory}
          </span>

        </div>

        <div class="card-content">

          <h3>
            ${destination.name || ""}
          </h3>

          <p>
            ${destination.description || ""}
          </p>

          <div class="card-meta">

            <span>
              ${destination.duration || ""}
            </span>

            <span>
              ${destination.estimatedCost || ""}
            </span>

          </div>

        </div>

      `;


      grid.appendChild(card);

    });

}



// Initialize


document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupPlanPage();

    renderMyRoutes();

  }
);

