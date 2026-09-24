const startButton = document.getElementById("start-button");
const locationButton = document.getElementById("location-button");
const cityButton = document.getElementById("city-button");
const saveProfileButton = document.getElementById("save-profile-button");

const availableButton = document.getElementById("available-button");
const discoverButton = document.getElementById("discover-button");

const welcomeScreen = document.getElementById("welcome-screen");
const locationScreen = document.getElementById("location-screen");
const profileScreen = document.getElementById("profile-screen");
const homeScreen = document.getElementById("home-screen");

const nameInput = document.getElementById("name-input");
const ageInput = document.getElementById("age-input");

const profileError = document.getElementById("profile-error");
const homeGreeting = document.getElementById("home-greeting");
const profileSummary = document.getElementById("profile-summary");


// Temporary app state.
// Later this data will be stored in PostgreSQL.
const appState = {
    location: null,
    profile: null,
};


// -------------------------
// Screen navigation
// -------------------------

function showScreen(screen) {
    document.querySelectorAll(".screen").forEach((item) => {
        item.classList.remove("active");
    });

    screen.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
}


// -------------------------
// Welcome
// -------------------------

startButton.addEventListener("click", () => {
    showScreen(locationScreen);
});


// -------------------------
// Location
// -------------------------

locationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        alert("Геолокація не підтримується на цьому пристрої.");
        return;
    }

    locationButton.disabled = true;
    locationButton.textContent = "📍 Визначаємо локацію...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            appState.location = {
                latitude,
                longitude,
            };

            console.log("Location received:", appState.location);

            locationButton.textContent = "✅ Локацію отримано";

            openProfileScreen();
        },

        (error) => {
            console.error("Geolocation error:", error);

            locationButton.disabled = false;
            locationButton.textContent =
                "📍 Використати мою локацію";

            if (error.code === error.PERMISSION_DENIED) {
                alert(
                    "Доступ до геолокації заборонено. " +
                    "Дозволь доступ або обери місто вручну."
                );

                return;
            }

            if (error.code === error.POSITION_UNAVAILABLE) {
                alert(
                    "Не вдалося визначити твою локацію. " +
                    "Спробуй ще раз або обери місто вручну."
                );

                return;
            }

            if (error.code === error.TIMEOUT) {
                alert(
                    "Визначення локації зайняло забагато часу. " +
                    "Спробуй ще раз."
                );

                return;
            }

            alert(
                "Не вдалося визначити локацію. " +
                "Спробуй ще раз або обери місто вручну."
            );
        },

        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
        }
    );
});


// -------------------------
// Manual city
// -------------------------

cityButton.addEventListener("click", () => {
    alert(
        "Ручний вибір міста додамо окремим кроком."
    );
});


// -------------------------
// Profile
// -------------------------

function openProfileScreen() {
    const telegramUser =
        window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (telegramUser?.first_name && !nameInput.value) {
        nameInput.value = telegramUser.first_name;
    }

    profileError.textContent = "";

    showScreen(profileScreen);
}


// -------------------------
// Profile validation
// -------------------------

function validateProfile(name, age) {
    if (!name) {
        return "Вкажи своє ім'я.";
    }

    if (!Number.isInteger(age) || age < 18 || age > 100) {
        return "Вкажи коректний вік від 18 до 100 років.";
    }

    return null;
}


// -------------------------
// Save profile
// -------------------------

saveProfileButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const age = Number(ageInput.value);

    const validationError =
        validateProfile(name, age);

    if (validationError) {
        profileError.textContent = validationError;
        return;
    }

    profileError.textContent = "";

    appState.profile = {
        name,
        age,
    };

    console.log("Profile created:", appState.profile);

    openHomeScreen();
});


// -------------------------
// Home
// -------------------------

function openHomeScreen() {
    const profile = appState.profile;

    homeGreeting.textContent =
        `👋 Привіт, ${profile.name}!`;

    profileSummary.textContent =
        `${profile.age} років`;

    showScreen(homeScreen);
}


// -------------------------
// Home actions
// -------------------------

availableButton.addEventListener("click", () => {
    alert(
        "Наступним кроком оберемо, що ти хочеш робити сьогодні."
    );
});


discoverButton.addEventListener("click", () => {
    alert(
        "Discovery додамо після створення статусу доступності."
    );
});
