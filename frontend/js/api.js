function getTelegramInitData() {
    const telegram =
        window.Telegram?.WebApp;

    const initData =
        telegram?.initData;

    if (!initData) {
        throw new Error(
            "Telegram initData відсутній. " +
            "Відкрий Mini App через Telegram."
        );
    }

    return initData;
}


function getUserTimezone() {
    const timezone =
        Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone;

    if (!timezone) {
        throw new Error(
            "Не вдалося визначити часовий пояс."
        );
    }

    return timezone;
}


async function apiRequest(
    url,
    body
) {
    const response = await fetch(
        url,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        // Response may not contain JSON.
    }

    if (!response.ok) {
        throw new Error(
            data.detail ||
            "Помилка запиту до сервера."
        );
    }

    return data;
}


// -------------------------
// Profile
// -------------------------

async function saveTelegramProfile(
    name,
    age,
    location
) {
    const initData =
        getTelegramInitData();

    return apiRequest(
        "/auth/telegram",
        {
            init_data: initData,
            name,
            age,

            latitude:
                location?.latitude ?? null,

            longitude:
                location?.longitude ?? null,
        }
    );
}


// -------------------------
// Save availability
// -------------------------

async function saveAvailability(
    activities,
    startType,
    availableUntil
) {
    const initData =
        getTelegramInitData();

    const timezoneName =
        getUserTimezone();

    return apiRequest(
        "/availability",
        {
            init_data: initData,

            activities,

            start_type:
                startType,

            available_until:
                availableUntil,

            timezone_name:
                timezoneName,
        }
    );
}


// -------------------------
// Current availability
// -------------------------

async function getCurrentAvailability() {
    const initData =
        getTelegramInitData();

    return apiRequest(
        "/availability/current",
        {
            init_data: initData,
        }
    );
}


// -------------------------
// Stop availability
// -------------------------

async function stopAvailability() {
    const initData =
        getTelegramInitData();

    return apiRequest(
        "/availability/stop",
        {
            init_data: initData,
        }
    );
}


// -------------------------
// Discovery
// -------------------------

async function getDiscovery(
    radiusKm = 25,
    activity = null
) {
    const initData =
        getTelegramInitData();

    return apiRequest(
        "/discovery",
        {
            init_data: initData,
            radius_km: radiusKm,
            activity,
        }
    );
}


// -------------------------
// Public API
// -------------------------

window.api = {
    saveTelegramProfile,
    saveAvailability,
    getCurrentAvailability,
    stopAvailability,
    getDiscovery,
};
