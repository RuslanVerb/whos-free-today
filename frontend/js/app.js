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

const discoveryBackButton =
    document.getElementById("discovery-back-button");


const welcomeScreen = document.getElementById("welcome-screen");
const locationScreen = document.getElementById("location-screen");
const profileScreen = document.getElementById("profile-screen");
const homeScreen = document.getElementById("home-screen");

const availabilityScreen =
    document.getElementById("availability-screen");

const discoveryScreen =
    document.getElementById("discovery-screen");


const nameInput = document.getElementById("name-input");
const ageInput = document.getElementById("age-input");

const profileError =
    document.getElementById("profile-error");

const availabilityError =
    document.getElementById("availability-error");

const availableUntilInput =
    document.getElementById("available-until");


const homeGreeting =
    document.getElementById("home-greeting");

const profileSummary =
    document.getElementById("profile-summary");

const inactiveHome =
    document.getElementById("inactive-home");

const activeHome =
    document.getElementById("active-home");

const activeActivities =
    document.getElementById("active-activities");

const activeTime =
    document.getElementById("active-time");


const discoveryLoading =
    document.getElementById("discovery-loading");

const discoveryError =
    document.getElementById("discovery-error");

const discoveryEmpty =
    document.getElementById("discovery-empty");

const discoveryResults =
    document.getElementById("discovery-results");


// -------------------------
// App state
// -------------------------

const appState = {
    location: null,
    profile: null,
    availability: null,

    discovery: {
        radiusKm: 25,
        activity: null,
    },
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
        alert(
            "Геолокація не підтримується на цьому пристрої."
        );

        return;
    }

    locationButton.disabled = true;

    locationButton.textContent =
        "📍 Визначаємо локацію...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            appState.location = {
                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude,
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

            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {
                alert(
                    "Доступ до геолокації заборонено. " +
                    "Дозволь доступ або обери місто вручну."
                );

                return;
            }

            if (
                error.code ===
                error.POSITION_UNAVAILABLE
            ) {
                alert(
                    "Не вдалося визначити твою локацію. " +
                    "Спробуй ще раз або обери місто вручну."
                );

                return;
            }

            if (
                error.code ===
                error.TIMEOUT
            ) {
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
        window.Telegram
            ?.WebApp
            ?.initDataUnsafe
            ?.user;

    if (
        telegramUser?.first_name &&
        !nameInput.value
    ) {
        nameInput.value =
            telegramUser.first_name;
    }

    profileError.textContent = "";

    showScreen(profileScreen);
}


function validateProfile(
    name,
    age
) {
    if (!name) {
        return "Вкажи своє ім'я.";
    }

    if (
        !Number.isInteger(age) ||
        age < 18 ||
        age > 100
    ) {
        return (
            "Вкажи коректний вік " +
            "від 18 до 100 років."
        );
    }

    return null;
}


// -------------------------
// Save profile
// -------------------------

saveProfileButton.addEventListener(
    "click",
    async () => {
        const name =
            nameInput.value.trim();

        const age =
            Number(ageInput.value);

        const validationError =
            validateProfile(
                name,
                age
            );

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
                await window.api
                    .saveTelegramProfile(
                        name,
                        age,
                        appState.location
                    );

            appState.profile = {
                name:
                    result.user.name,

                age:
                    result.user.age,
            };

            console.log(
                "Profile saved:",
                result.user
            );

            await loadCurrentAvailability();

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
    }
);


// -------------------------
// Load current availability
// -------------------------

async function loadCurrentAvailability() {
    try {
        const result =
            await window.api
                .getCurrentAvailability();

        const availability =
            result.availability;

        if (!availability) {
            appState.availability = null;

            return;
        }

        appState.availability = {
            activities:
                availability.activities,

            start:
                availability.start_type,

            until:
                availability.available_until,
        };

        console.log(
            "Current availability loaded:",
            appState.availability
        );

    } catch (error) {
        console.error(
            "Current availability error:",
            error
        );

        appState.availability = null;

        alert(
            "Профіль збережено, але не вдалося " +
            "завантажити поточний статус."
        );
    }
}


// -------------------------
// Home
// -------------------------

function openHomeScreen() {
    const profile =
        appState.profile;

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
        inactiveHome
            .classList
            .remove("hidden");

        activeHome
            .classList
            .add("hidden");

        return;
    }

    inactiveHome
        .classList
        .add("hidden");

    activeHome
        .classList
        .remove("hidden");

    activeActivities.textContent =
        availability.activities
            .map(
                (activity) =>
                    activity.label
            )
            .join(" · ");

    activeTime.textContent =
        `${getStartLabel(
            availability.start
        )} → ${availability.until}`;
}


// -------------------------
// Availability navigation
// -------------------------

availableButton.addEventListener(
    "click",
    () => {
        resetAvailabilityForm();

        showScreen(
            availabilityScreen
        );
    }
);


availabilityBackButton.addEventListener(
    "click",
    () => {
        openHomeScreen();
    }
);


editAvailabilityButton.addEventListener(
    "click",
    () => {
        fillAvailabilityForm();

        showScreen(
            availabilityScreen
        );
    }
);


// -------------------------
// Activity selection
// -------------------------

document
    .querySelectorAll(
        ".activity-button"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                button
                    .classList
                    .toggle("selected");

                availabilityError
                    .textContent = "";
            }
        );
    });


// -------------------------
// Start time selection
// -------------------------

document
    .querySelectorAll(
        ".time-button"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                document
                    .querySelectorAll(
                        ".time-button"
                    )
                    .forEach((item) => {
                        item
                            .classList
                            .remove(
                                "selected"
                            );
                    });

                button
                    .classList
                    .add("selected");

                availabilityError
                    .textContent = "";
            }
        );
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
        id:
            button.dataset.activity,

        label:
            button.dataset.label,
    }));
}


function getSelectedStart() {
    const selected =
        document.querySelector(
            ".time-button.selected"
        );

    return (
        selected?.dataset.start ||
        null
    );
}


function getStartLabel(start) {
    const labels = {
        now:
            "⚡ Зараз",

        hour:
            "🕐 Через годину",

        evening:
            "🌆 Сьогодні ввечері",
    };

    return (
        labels[start] ||
        start
    );
}


function resetAvailabilityForm() {
    document
        .querySelectorAll(
            ".activity-button, " +
            ".time-button"
        )
        .forEach((button) => {
            button
                .classList
                .remove("selected");
        });

    const nowButton =
        document.querySelector(
            '.time-button[data-start="now"]'
        );

    if (nowButton) {
        nowButton
            .classList
            .add("selected");
    }

    availableUntilInput.value =
        "22:00";

    availabilityError.textContent =
        "";
}


function fillAvailabilityForm() {
    resetAvailabilityForm();

    const availability =
        appState.availability;

    if (!availability) {
        return;
    }

    availability.activities
        .forEach((activity) => {
            const button =
                document.querySelector(
                    `.activity-button[data-activity="${activity.id}"]`
                );

            if (button) {
                button
                    .classList
                    .add("selected");
            }
        });

    document
        .querySelectorAll(
            ".time-button"
        )
        .forEach((button) => {
            button
                .classList
                .remove("selected");
        });

    const startButton =
        document.querySelector(
            `.time-button[data-start="${availability.start}"]`
        );

    if (startButton) {
        startButton
            .classList
            .add("selected");
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
    if (
        activities.length === 0
    ) {
        return (
            "Обери хоча б одне заняття."
        );
    }

    if (!start) {
        return (
            "Обери, коли ти будеш вільний."
        );
    }

    if (!until) {
        return (
            "Вкажи, до котрої години ти вільний."
        );
    }

    return null;
}


// -------------------------
// Save availability
// -------------------------

saveAvailabilityButton.addEventListener(
    "click",
    async () => {
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

        availabilityError.textContent =
            "";

        saveAvailabilityButton.disabled =
            true;

        saveAvailabilityButton.textContent =
            "Зберігаємо...";

        try {
            const result =
                await window.api
                    .saveAvailability(
                        activities,
                        start,
                        until
                    );

            const availability =
                result.availability;

            appState.availability = {
                activities:
                    availability.activities,

                start:
                    availability.start_type,

                until:
                    availability.available_until,
            };

            console.log(
                "Availability saved:",
                appState.availability
            );

            openHomeScreen();

        } catch (error) {
            console.error(
                "Availability save error:",
                error
            );

            availabilityError.textContent =
                error.message ||
                "Не вдалося зберегти статус.";

        } finally {
            saveAvailabilityButton.disabled =
                false;

            saveAvailabilityButton.textContent =
                "🟢 Стати доступним";
        }
    }
);


// -------------------------
// Stop availability
// -------------------------

stopAvailabilityButton.addEventListener(
    "click",
    async () => {
        stopAvailabilityButton.disabled =
            true;

        stopAvailabilityButton.textContent =
            "Завершуємо...";

        try {
            await window.api
                .stopAvailability();

            appState.availability =
                null;

            renderAvailabilityStatus();

            console.log(
                "Availability stopped"
            );

        } catch (error) {
            console.error(
                "Stop availability error:",
                error
            );

            alert(
                error.message ||
                "Не вдалося завершити статус."
            );

        } finally {
            stopAvailabilityButton.disabled =
                false;

            stopAvailabilityButton.textContent =
                "Завершити";
        }
    }
);


// -------------------------
// Discovery navigation
// -------------------------

async function openDiscovery() {
    showScreen(
        discoveryScreen
    );

    await loadDiscovery();
}


discoverButton.addEventListener(
    "click",
    openDiscovery
);


activeDiscoverButton.addEventListener(
    "click",
    openDiscovery
);


discoveryBackButton.addEventListener(
    "click",
    () => {
        openHomeScreen();
    }
);


// -------------------------
// Discovery radius
// -------------------------

document
    .querySelectorAll(
        ".radius-button"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            async () => {
                document
                    .querySelectorAll(
                        ".radius-button"
                    )
                    .forEach((item) => {
                        item
                            .classList
                            .remove("selected");
                    });

                button
                    .classList
                    .add("selected");

                appState.discovery.radiusKm =
                    Number(
                        button.dataset.radius
                    );

                await loadDiscovery();
            }
        );
    });


// -------------------------
// Discovery activity filter
// -------------------------

document
    .querySelectorAll(
        ".discovery-activity-button"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            async () => {
                document
                    .querySelectorAll(
                        ".discovery-activity-button"
                    )
                    .forEach((item) => {
                        item
                            .classList
                            .remove("selected");
                    });

                button
                    .classList
                    .add("selected");

                const activity =
                    button.dataset.activity;

                appState.discovery.activity =
                    activity || null;

                await loadDiscovery();
            }
        );
    });


// -------------------------
// Load discovery
// -------------------------

async function loadDiscovery() {
    discoveryLoading
        .classList
        .remove("hidden");

    discoveryError
        .classList
        .add("hidden");

    discoveryEmpty
        .classList
        .add("hidden");

    discoveryResults.innerHTML = "";

    try {
        const result =
            await window.api
                .getDiscovery(
                    appState.discovery.radiusKm,
                    appState.discovery.activity
                );

        const people =
            result.people || [];

        if (people.length === 0) {
            discoveryEmpty
                .classList
                .remove("hidden");

            return;
        }

        renderDiscoveryResults(
            people
        );

    } catch (error) {
        console.error(
            "Discovery error:",
            error
        );

        discoveryError.textContent =
            error.message ||
            "Не вдалося завантажити людей поруч.";

        discoveryError
            .classList
            .remove("hidden");

    } finally {
        discoveryLoading
            .classList
            .add("hidden");
    }
}


// -------------------------
// Render discovery
// -------------------------

function renderDiscoveryResults(
    people
) {
    discoveryResults.innerHTML = "";

    people.forEach((person) => {
        const card =
            createPersonCard(
                person
            );

        discoveryResults.appendChild(
            card
        );
    });
}


function createPersonCard(
    person
) {
    const card =
        document.createElement("article");

    card.className =
        "person-card";


    const header =
        document.createElement("div");

    header.className =
        "person-header";


    const personMain =
        document.createElement("div");

    personMain.className =
        "person-main";


    const avatar =
        document.createElement("div");

    avatar.className =
        "person-avatar";

    avatar.textContent = "👤";


    const info =
        document.createElement("div");


    const name =
        document.createElement("p");

    name.className =
        "person-name";

    name.textContent =
        `${person.name}, ${person.age}`;


    const distance =
        document.createElement("p");

    distance.className =
        "person-distance";

    distance.textContent =
        `📍 ${formatDistance(
            person.distance_km
        )} від тебе`;


    info.appendChild(name);
    info.appendChild(distance);

    personMain.appendChild(avatar);
    personMain.appendChild(info);


    const status =
        document.createElement("span");

    status.className =
        "person-status";


    header.appendChild(
        personMain
    );

    header.appendChild(
        status
    );


    const activities =
        document.createElement("div");

    activities.className =
        "person-activities";


    (person.activities || [])
        .forEach((activity) => {
            const item =
                document.createElement(
                    "span"
                );

            item.className =
                "person-activity";

            item.textContent =
                activity.label;

            activities.appendChild(
                item
            );
        });


    const until =
        document.createElement("p");

    until.className =
        "person-until";

    until.textContent =
        `🕐 Вільний/вільна до ${person.available_until}`;


    const meetButton =
        document.createElement("button");

    meetButton.type =
        "button";

    meetButton.className =
        "meet-button";

    meetButton.textContent =
        "🤝 Запропонувати зустріч";

    meetButton.dataset.userId =
        person.user_id;

    meetButton.addEventListener(
        "click",
        () => {
            handleMeetingRequest(
                person
            );
        }
    );


    card.appendChild(
        header
    );

    card.appendChild(
        activities
    );

    card.appendChild(
        until
    );

    card.appendChild(
        meetButton
    );

    return card;
}


function formatDistance(
    distanceKm
) {
    const distance =
        Number(distanceKm);

    if (!Number.isFinite(distance)) {
        return "—";
    }

    if (distance < 1) {
        return `${Math.round(
            distance * 1000
        )} м`;
    }

    return `${distance.toFixed(1)} км`;
}


// -------------------------
// Meeting request placeholder
// -------------------------

function handleMeetingRequest(
    person
) {
    alert(
        `Наступним кроком додамо запит на зустріч з ${person.name}.`
    );
}
