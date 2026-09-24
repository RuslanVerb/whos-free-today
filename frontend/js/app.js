const startButton = document.getElementById("start-button");
const locationButton = document.getElementById("location-button");
const cityButton = document.getElementById("city-button");
const saveProfileButton = document.getElementById("save-profile-button");

const welcomeScreen = document.getElementById("welcome-screen");
const locationScreen = document.getElementById("location-screen");
const profileScreen = document.getElementById("profile-screen");

const nameInput = document.getElementById("name-input");
const ageInput = document.getElementById("age-input");


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

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);

            // Поки що координати не відправляємо на сервер.
            // Збережемо їх тільки в пам'яті поточної сторінки.
            window.userLocation = {
                latitude,
                longitude,
            };

            locationButton.textContent = "✅ Локацію отримано";

            openProfileScreen();
        },

        (error) => {
            console.error("Geolocation error:", error);

            locationButton.disabled = false;
            locationButton.textContent = "📍 Використати мою локацію";

            if (error.code === error.PERMISSION_DENIED) {
                alert(
                    "Доступ до геолокації заборонено. " +
                    "Дозволь доступ або обери місто вручну."
                );
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                alert(
                    "Не вдалося визначити твою локацію. " +
                    "Спробуй ще раз або обери місто вручну."
                );
            } else if (error.code === error.TIMEOUT) {
                alert(
                    "Визначення локації зайняло забагато часу. " +
                    "Спробуй ще раз."
                );
            } else {
                alert(
                    "Не вдалося визначити локацію. " +
                    "Спробуй ще раз або обери місто вручну."
                );
            }
        },

        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
        }
    );
});


// -------------------------
// Manual city selection
// -------------------------

cityButton.addEventListener("click", () => {
    alert("Ручний вибір міста додамо наступним кроком.");
});


// -------------------------
// Profile
// -------------------------

function openProfileScreen() {
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (telegramUser?.first_name && !nameInput.value) {
        nameInput.value = telegramUser.first_name;
    }

    showScreen(profileScreen);
}


// -------------------------
// Interests
// -------------------------

document.querySelectorAll(".interest-button").forEach((button) => {
    button.addEventListener("click", () => {
        button.classList.toggle("selected");
    });
});


// -------------------------
// Continue profile
// -------------------------

saveProfileButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const age = Number(ageInput.value);

    const selectedInterests = Array.from(
        document.querySelectorAll(".interest-button.selected")
    ).map((button) => button.textContent.trim());

    console.log("Profile:", {
        name,
        age,
        interests: selectedInterests,
        location: window.userLocation,
    });

    // Home screen додамо наступним кроком.
    alert("Профіль готовий. Наступним кроком додамо Home screen.");
});
