const startButton = document.getElementById("start-button");
const locationButton = document.getElementById("location-button");
const cityButton = document.getElementById("city-button");
const saveProfileButton = document.getElementById("save-profile-button");

const availableButton = document.getElementById("available-button");
const discoverButton = document.getElementById("discover-button");

const activeDiscoverButton =
    document.getElementById("active-discover-button");

const editAvailabilityButton =
    document.getElementById("edit-availability-button");

const stopAvailabilityButton =
    document.getElementById("stop-availability-button");

const availabilityBackButton =
    document.getElementById("availability-back-button");

const saveAvailabilityButton =
    document.getElementById("save-availability-button");


const welcomeScreen = document.getElementById("welcome-screen");
const locationScreen = document.getElementById("location-screen");
const profileScreen = document.getElementById("profile-screen");
const homeScreen = document.getElementById("home-screen");

const availabilityScreen =
    document.getElementById("availability-screen");


const nameInput = document.getElementById("name-input");
const ageInput = document.getElementById("age-input");

const profileError = document.getElementById("profile-error");

const availabilityError =
    document.getElementById("availability-error");

const availableUntilInput =
    document.getElementById("available-until");


const homeGreeting = document.getElementById("home-greeting");
const profileSummary = document.getElementById("profile-summary");

const inactiveHome = document.getElementById("inactive-home");
const activeHome = document.getElementById("active-home");

const activeActivities =
    document.getElementById("active-activities");

const activeTime =
    document.getElementById("active-time");


// Temporary app state.
// Profile is now saved in PostgreSQL.
// Availability will be moved to PostgreSQL later.
const appState = {
    location: null,
    profile: null,
    availability: null,
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
            appState.location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };

            console.log(
                "Location received:",
                appState.location
            );

            locationButton.textContent =
                "✅ Локацію отримано";

            openProfileScreen();
        },

        (error) => {
            console.error(
                "Geolocation error:",
                error
            );

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


function validateProfile(name, age) {
    if (!name) {
        return "Вкажи своє ім'я.";
    }

    if (
        !Number.isInteger(age) ||
        age < 18 ||
        age > 100
    ) {
        return "Вкажи коректний вік від 18 до 100 років.";
    }

    return null;
}


// -------------------------
// Save profile to backend
// -------------------------

saveProfileButton.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const age = Number(ageInput.value);

    const validationError =
        validateProfile(name, age);

    if (validationError) {
        profileError.textContent =
            validationError;

        return;
    }

    profileError.textContent = "";

    saveProfileButton.disabled = true;
    saveProfileButton.textContent =
        "Зберігаємо...";

    try {
        const result =
            await window.api.saveTelegramProfile(
                name,
                age,
                appState.location
            );

        appState.profile = {
            name: result.user.name,
            age: result.user.age,
        };

        console.log(
            "Profile saved:",
            result.user
        );

        openHomeScreen();

    } catch (error) {
        console.error(
            "Profile save error:",
            error
        );

        profileError.textContent =
            error.message ||
            "Не вдалося зберегти профіль.";

    } finally {
        saveProfileButton.disabled = false;

        saveProfileButton.textContent =
            "Продовжити →";
    }
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

    renderAvailabilityStatus();

    showScreen(homeScreen);
}


function renderAvailabilityStatus() {
    const availability =
        appState.availability;

    if (!availability) {
        inactiveHome.classList.remove("hidden");
        activeHome.classList.add("hidden");

        return;
    }

    inactiveHome.classList.add("hidden");
    activeHome.classList.remove("hidden");

    activeActivities.textContent =
        availability.activities
            .map((activity) => activity.label)
            .join(" · ");

    activeTime.textContent =
        `${getStartLabel(availability.start)} → ` +
        `${availability.until}`;
}


// -------------------------
// Availability navigation
// -------------------------

availableButton.addEventListener("click", () => {
    resetAvailabilityForm();

    showScreen(availabilityScreen);
});


availabilityBackButton.addEventListener("click", () => {
    openHomeScreen();
});


editAvailabilityButton.addEventListener("click", () => {
    fillAvailabilityForm();

    showScreen(availabilityScreen);
});


// -------------------------
// Activity selection
// -------------------------

document
    .querySelectorAll(".activity-button")
    .forEach((button) => {

        button.addEventListener("click", () => {
            button.classList.toggle("selected");

            availabilityError.textContent = "";
        });

    });


// -------------------------
// Start time selection
// -------------------------

document
    .querySelectorAll(".time-button")
    .forEach((button) => {

        button.addEventListener("click", () => {

            document
                .querySelectorAll(".time-button")
                .forEach((item) => {
                    item.classList.remove("selected");
                });

            button.classList.add("selected");

            availabilityError.textContent = "";
        });

    });


// -------------------------
// Availability helpers
// -------------------------

function getSelectedActivities() {
    return Array.from(
        document.querySelectorAll(
            ".activity-button.selected"
        )
    ).map((button) => ({
        id: button.dataset.activity,
        label: button.dataset.label,
    }));
}


function getSelectedStart() {
    const selected =
        document.querySelector(
            ".time-button.selected"
        );

    return selected?.dataset.start || null;
}


function getStartLabel(start) {
    const labels = {
        now: "⚡ Зараз",
        hour: "🕐 Через годину",
        evening: "🌆 Сьогодні ввечері",
    };

    return labels[start] || start;
}


function resetAvailabilityForm() {
    document
        .querySelectorAll(
            ".activity-button, .time-button"
        )
        .forEach((button) => {
            button.classList.remove("selected");
        });

    const nowButton =
        document.querySelector(
            '.time-button[data-start="now"]'
        );

    nowButton.classList.add("selected");

    availableUntilInput.value = "22:00";

    availabilityError.textContent = "";
}


function fillAvailabilityForm() {
    resetAvailabilityForm();

    const availability =
        appState.availability;

    if (!availability) {
        return;
    }

    availability.activities.forEach((activity) => {
        const button =
            document.querySelector(
                `.activity-button[data-activity="${activity.id}"]`
            );

        if (button) {
            button.classList.add("selected");
        }
    });

    document
        .querySelectorAll(".time-button")
        .forEach((button) => {
            button.classList.remove("selected");
        });

    const startButton =
        document.querySelector(
            `.time-button[data-start="${availability.start}"]`
        );

    if (startButton) {
        startButton.classList.add("selected");
    }

    availableUntilInput.value =
        availability.until;
}


// -------------------------
// Availability validation
// -------------------------

function validateAvailability(
    activities,
    start,
    until
) {
    if (activities.length === 0) {
        return "Обери хоча б одне заняття.";
    }

    if (!start) {
        return "Обери, коли ти будеш вільний.";
    }

    if (!until) {
        return "Вкажи, до котрої години ти вільний.";
    }

    return null;
}


// -------------------------
// Save availability
// -------------------------

saveAvailabilityButton.addEventListener(
    "click",
    () => {

        const activities =
            getSelectedActivities();

        const start =
            getSelectedStart();

        const until =
            availableUntilInput.value;

        const validationError =
            validateAvailability(
                activities,
                start,
                until
            );

        if (validationError) {
            availabilityError.textContent =
                validationError;

            return;
        }

        availabilityError.textContent = "";

        appState.availability = {
            activities,
            start,
            until,
        };

        console.log(
            "Availability created:",
            appState.availability
        );

        openHomeScreen();
    }
);


// -------------------------
// Stop availability
// -------------------------

stopAvailabilityButton.addEventListener(
    "click",
    () => {

        appState.availability = null;

        renderAvailabilityStatus();
    }
);


// -------------------------
// Discovery
// -------------------------

function openDiscoveryPlaceholder() {
    alert(
        "Discovery підключимо після того, " +
        "як додамо backend і PostgreSQL."
    );
}


discoverButton.addEventListener(
    "click",
    openDiscoveryPlaceholder
);


activeDiscoverButton.addEventListener(
    "click",
    openDiscoveryPlaceholder
);
