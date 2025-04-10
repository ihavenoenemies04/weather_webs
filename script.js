// DOM Elements
let apiKey = "6d6041256fe6fdc59c29e14298f22bfb";
let cityInput = document.getElementById("cityInput");
let getWeatherBtn = document.getElementById("getWeatherBtn");
let weatherResult = document.getElementById("weatherResult");
let getLocationBtn = document.getElementById("getLocationBtn");
let openSettingsBtn = document.querySelector(".settings-button");
let closeSettingsBtn = document.getElementById("closeSettingsBtn");
let settingsModal = document.getElementById("settingsModal");
let lightThemeBtn = document.getElementById("lightThemeBtn");
let darkThemeBtn = document.getElementById("darkThemeBtn");
let pinkThemeBtn = document.getElementById("pinkThemeBtn");
let homeTab = document.getElementById("homeTab");
let continentsTab = document.getElementById("continentsTab");
let mapTab = document.getElementById("mapTab");
let favoritesTab = document.getElementById("favoritesTab");
let homeContent = document.getElementById("homeContent");
let continentsContent = document.getElementById("continentsContent");
let mapContent = document.getElementById("mapContent");
let favoritesContent = document.getElementById("favoritesContent");
let mapWeatherResult = document.getElementById("mapWeatherResult");
let installBtn = document.getElementById("installBtn");
let favoritesContainer = document.getElementById("favoritesContainer");
let addCurrentToFavorites = document.getElementById("addCurrentToFavorites");
let deferredPrompt;
let map;
let marker;

// PWA Installation Handling
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted install');
        } else {
            console.log('User dismissed install');
        }
        deferredPrompt = null;
        installBtn.style.display = 'none';
    }
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    installBtn.style.display = 'none';
    deferredPrompt = null;
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Mobile Touch Handling
document.addEventListener('DOMContentLoaded', function() {
    // Prevent zooming on double-tap
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // Touch feedback for buttons
    const buttons = document.querySelectorAll('button, .tab-button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('active-touch');
        }, { passive: true });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('active-touch');
        }, { passive: true });
    });
    
    // Prevent scrolling when interacting with elements
    const interactiveElements = document.querySelectorAll('input, button, .tab-button, .city-name');
    interactiveElements.forEach(el => {
        el.addEventListener('touchstart', function(e) {
            if (e.target === this) {
                e.preventDefault();
            }
        }, { passive: false });
    });
});

// Check if running as PWA
window.addEventListener('load', () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Running as PWA');
        installBtn.style.display = 'none';
    }
});

// Utility Functions
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'sun',
        '01n': 'moon',
        '02d': 'cloud-sun',
        '02n': 'cloud-moon',
        '03d': 'cloud',
        '03n': 'cloud',
        '04d': 'cloud',
        '04n': 'cloud',
        '09d': 'cloud-rain',
        '09n': 'cloud-rain',
        '10d': 'cloud-sun-rain',
        '10n': 'cloud-moon-rain',
        '11d': 'bolt',
        '11n': 'bolt',
        '13d': 'snowflake',
        '13n': 'snowflake',
        '50d': 'smog',
        '50n': 'smog'
    };
    return iconMap[iconCode] || 'question';
}

// Tab switching
homeTab.addEventListener("click", () => {
    switchTab(homeTab, homeContent);
});

continentsTab.addEventListener("click", () => {
    switchTab(continentsTab, continentsContent);
    loadContinentWeather();
});

mapTab.addEventListener("click", () => {
    switchTab(mapTab, mapContent);
    initMap();
});

favoritesTab.addEventListener("click", () => {
    switchTab(favoritesTab, favoritesContent);
    loadFavorites();
});

function switchTab(activeTab, activeContent) {
    [homeTab, continentsTab, mapTab, favoritesTab].forEach(tab => tab.classList.remove("active"));
    [homeContent, continentsContent, mapContent, favoritesContent].forEach(content => content.classList.remove("active"));
    
    activeTab.classList.add("active");
    activeContent.classList.add("active");
    cleanupMap();
}

// Settings modal
openSettingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "flex";
});

closeSettingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
        settingsModal.style.display = "none";
    }
});

// Theme switching
lightThemeBtn.addEventListener("click", () => {
    document.body.className = "";
    document.body.style.backgroundImage = "var(--light-theme-bg)";
    settingsModal.style.display = "none";
});

darkThemeBtn.addEventListener("click", () => {
    document.body.className = "dark-theme";
    document.body.style.backgroundImage = "var(--dark-theme-bg)";
    settingsModal.style.display = "none";
});

pinkThemeBtn.addEventListener("click", () => {
    document.body.className = "pink-theme";
    document.body.style.backgroundImage = "var(--pink-theme-bg)";
    settingsModal.style.display = "none";
});

// Map functions
function initMap() {
    if (!map) {
        map = L.map('map').setView([50.45, 30.52], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        map.on('click', function(e) {
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker(e.latlng, {
                icon: L.divIcon({
                    className: 'custom-marker-icon',
                    iconSize: [20, 20]
                })
            }).addTo(map);
            getWeatherByCoords(e.latlng.lat, e.latlng.lng, mapWeatherResult);
        });
    }
}

function cleanupMap() {
    if (map) {
        map.remove();
        map = null;
    }
    if (marker) {
        marker = null;
    }
    mapWeatherResult.innerHTML = '';
}

// Favorites functions
function saveFavorites(favorites) {
    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('weatherFavorites')) || [];
}

async function loadFavorites() {
    const favorites = getFavorites();
    favoritesContainer.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<p class="no-favorites">Немає збережених місць</p>';
        return;
    }
    
    for (const favorite of favorites) {
        const favoriteElement = document.createElement('div');
        favoriteElement.className = 'favorite-item';
        favoriteElement.innerHTML = `
            <div class="favorite-info">
                <h3>${favorite.name}</h3>
                <button class="remove-favorite" data-id="${favorite.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="favorite-weather" id="favorite-${favorite.id}">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Завантаження даних...</p>
                </div>
            </div>
        `;
        favoritesContainer.appendChild(favoriteElement);
        
        // Load weather for this favorite
        if (favorite.coords) {
            getWeatherByCoords(favorite.coords.lat, favorite.coords.lon, document.getElementById(`favorite-${favorite.id}`));
        } else {
            getWeather(favorite.name, document.getElementById(`favorite-${favorite.id}`));
        }
        
        // Add event listener for remove button
        favoriteElement.querySelector('.remove-favorite').addEventListener('click', () => {
            removeFavorite(favorite.id);
        });
    }
}

function addFavorite(name, coords = null) {
    const favorites = getFavorites();
    const id = Date.now().toString();
    
    favorites.push({
        id,
        name,
        coords
    });
    
    saveFavorites(favorites);
    loadFavorites();
}

function removeFavorite(id) {
    let favorites = getFavorites();
    favorites = favorites.filter(fav => fav.id !== id);
    saveFavorites(favorites);
    loadFavorites();
}

// Add current location to favorites
addCurrentToFavorites.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                // Reverse geocoding to get city name
                fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            const cityName = data[0].name;
                            addFavorite(cityName, { lat: latitude, lon: longitude });
                        } else {
                            addFavorite(`Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, { lat: latitude, lon: longitude });
                        }
                    })
                    .catch(() => {
                        addFavorite(`Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, { lat: latitude, lon: longitude });
                    });
            },
            (error) => {
                alert("Не вдалося отримати ваше місцезнаходження");
            }
        );
    } else {
        alert("Геолокація не підтримується вашим браузером");
    }
});

// Weather functions
async function getWeatherByCoords(lat, lon, targetElement = weatherResult) {
    targetElement.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Завантаження даних...</p>
        </div>
    `;

    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=uk`;
    let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=uk`;

    try {
        let [currentResponse, forecastResponse] = await Promise.all([
            fetch(url),
            fetch(forecastUrl)
        ]);
        
        let currentData = await currentResponse.json();
        let forecastData = await forecastResponse.json();

        if (currentData.cod === 200) {
            let weatherHTML = `
                <div class="weather-display">
                    <p><span class="city-name interactive">${currentData.name}</span></p>
                    <p><i class="fas fa-temperature-three-quarters"></i> Температура: ${currentData.main.temp}°C</p>
                    <p><i class="fas fa-${getWeatherIcon(currentData.weather[0].icon)}"></i> Погода: ${currentData.weather[0].description}</p>
                    <p><i class="fas fa-droplet"></i> Вологість: ${currentData.main.humidity}%</p>
                    <p><i class="fas fa-wind"></i> Вітер: ${currentData.wind.speed} м/с</p>
                    <div class="forecast-expandable">
                        <div class="forecast-tooltip">
                            <h4><i class="fas fa-calendar-days"></i> Прогноз на 7 днів</h4>
                            ${generateForecastHTML(forecastData)}
                        </div>
                    </div>
                </div>
            `;
            targetElement.innerHTML = weatherHTML;
            
            const cityNameElement = targetElement.querySelector('.city-name.interactive');
            if (cityNameElement) {
                cityNameElement.addEventListener('click', function() {
                    const tooltip = this.closest('.weather-display').querySelector('.forecast-tooltip');
                    tooltip.classList.toggle('visible');
                });
            }
        } else {
            targetElement.innerHTML = '';
            alert(`Помилка: ${currentData.message || "Дані не знайдено"}`);
        }
    } catch (error) {
        console.error("Помилка:", error);
        targetElement.innerHTML = '';
        alert("Помилка отримання даних. Будь ласка, спробуйте ще раз.");
    }
}

function generateForecastHTML(forecastData) {
    if (forecastData.cod !== "200") return "<p><i class='fas fa-cloud-question'></i> Прогноз недоступний</p>";
    
    let dailyForecasts = {};
    let forecastHTML = '';
    
    forecastData.list.forEach(item => {
        let date = new Date(item.dt * 1000);
        let dateString = date.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' });
        
        if (!dailyForecasts[dateString]) {
            dailyForecasts[dateString] = {
                temp_min: item.main.temp_min,
                temp_max: item.main.temp_max,
                weather: item.weather[0].description,
                icon: item.weather[0].icon
            };
        } else {
            if (item.main.temp_min < dailyForecasts[dateString].temp_min) {
                dailyForecasts[dateString].temp_min = item.main.temp_min;
            }
            if (item.main.temp_max > dailyForecasts[dateString].temp_max) {
                dailyForecasts[dateString].temp_max = item.main.temp_max;
            }
        }
    });

    let dayCount = 0;
    for (let [date, forecast] of Object.entries(dailyForecasts)) {
        if (dayCount >= 7) break;
        
        forecastHTML += `
            <div class="forecast-day">
                <span class="forecast-date">${date}</span>
                <span class="forecast-desc">
                    <i class="fas fa-${getWeatherIcon(forecast.icon)}"></i> ${forecast.weather}
                </span>
                <span class="forecast-temp">${Math.round(forecast.temp_min)}°/${Math.round(forecast.temp_max)}°</span>
            </div>
        `;
        dayCount++;
    }
    
    return forecastHTML;
}

getLocationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        if (mapContent.classList.contains("active")) {
            mapWeatherResult.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Отримання геолокації...</p>
                </div>
            `;
        } else {
            weatherResult.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Отримання геолокації...</p>
                </div>
            `;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                let latitude = position.coords.latitude;
                let longitude = position.coords.longitude;
                
                if (mapContent.classList.contains("active") && map) {
                    map.setView([latitude, longitude], 12);
                    if (marker) {
                        map.removeLayer(marker);
                    }
                    marker = L.marker([latitude, longitude], {
                        icon: L.divIcon({
                            className: 'custom-marker-icon',
                            iconSize: [20, 20]
                        })
                    }).addTo(map);
                }
                
                getWeatherByCoords(latitude, longitude, 
                    mapContent.classList.contains("active") ? mapWeatherResult : weatherResult);
            },
            (error) => {
                console.error("Помилка", error);
                if (mapContent.classList.contains("active")) {
                    mapWeatherResult.innerHTML = '';
                } else {
                    weatherResult.innerHTML = '';
                }
                alert("Не вдалося отримати ваше місцезнаходження. Будь ласка, перевірте дозволи для геолокації.");
            }
        );
    } else {
        alert("Геолокація не підтримується вашим браузером");
    }
});

getWeatherBtn.addEventListener("click", () => {
    let city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    } else {
        alert("Будь ласка, введіть назву міста");
    }
});

async function getWeather(city, targetElement = weatherResult) {
    targetElement.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Завантаження даних...</p>
        </div>
    `;

    let url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=uk`;
    let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=uk`;

    try {
        let [currentResponse, forecastResponse] = await Promise.all([
            fetch(url),
            fetch(forecastUrl)
        ]);
        
        let currentData = await currentResponse.json();
        let forecastData = await forecastResponse.json();

        if (currentData.cod === 200) {
            let weatherHTML = `
                <div class="weather-display">
                    <p><span class="city-name interactive">${currentData.name}</span></p>
                    <p><i class="fas fa-temperature-three-quarters"></i> Температура: ${currentData.main.temp}°C</p>
                    <p><i class="fas fa-${getWeatherIcon(currentData.weather[0].icon)}"></i> Погода: ${currentData.weather[0].description}</p>
                    <p><i class="fas fa-droplet"></i> Вологість: ${currentData.main.humidity}%</p>
                    <p><i class="fas fa-wind"></i> Вітер: ${currentData.wind.speed} м/с</p>
                    <div class="forecast-expandable">
                        <div class="forecast-tooltip">
                            <h4><i class="fas fa-calendar-days"></i> Прогноз на 7 днів</h4>
                            ${generateForecastHTML(forecastData)}
                        </div>
                    </div>
                </div>
            `;
            targetElement.innerHTML = weatherHTML;
            
            const cityNameElement = targetElement.querySelector('.city-name.interactive');
            if (cityNameElement) {
                cityNameElement.addEventListener('click', function() {
                    const tooltip = this.closest('.weather-display').querySelector('.forecast-tooltip');
                    tooltip.classList.toggle('visible');
                });
            }
        } else {
            targetElement.innerHTML = '';
            alert(`Помилка: ${currentData.message || "Місто не знайдено"}`);
        }
    } catch (error) {
        console.error("Помилка:", error);
        targetElement.innerHTML = '';
        alert("Помилка отримання даних. Будь ласка, спробуйте ще раз.");
    }
}

// Continent weather loading
async function loadContinentWeather() {
    const continents = {
        'eu': ['London', 'Berlin'],
        'as': ['Tokyo', 'Delhi'],
        'na': ['New York', 'Los Angeles'],
        'af': ['Cairo', 'Lagos'],
        'oc': ['Sydney', 'Melbourne'],
        'sa': ['São Paulo', 'Buenos Aires']
    };

    for (const [continentId, cities] of Object.entries(continents)) {
        for (const city of cities) {
            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=uk`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.cod === 200) {
                    const cityElement = document.querySelector(`#${continentId} .city-info[data-city="${city}"]`);
                    cityElement.innerHTML = `
                        <p><strong><i class="fas fa-city"></i> ${data.name}</strong></p>
                        <p><i class="fas fa-temperature-three-quarters"></i> Темп: ${Math.round(data.main.temp)}°C</p>
                        <p><i class="fas fa-${getWeatherIcon(data.weather[0].icon)}"></i> ${data.weather[0].description}</p>
                    `;
                } else {
                    const cityElement = document.querySelector(`#${continentId} .city-info[data-city="${city}"]`);
                    cityElement.innerHTML = `<div class="error-message"><i class="fas fa-triangle-exclamation"></i> ${city}: Дані недоступні</div>`;
                }
            } catch (error) {
                console.error(`Error loading weather for ${city}:`, error);
                const cityElement = document.querySelector(`#${continentId} .city-info[data-city="${city}"]`);
                cityElement.innerHTML = `<div class="error-message"><i class="fas fa-triangle-exclamation"></i> ${city}: Помилка завантаження</div>`;
            }
        }
    }
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
    loadContinentWeather();
    loadFavorites();
});