async function saveTelegramProfile(
    name,
    age,
    location
) {
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

    const response = await fetch(
        "/auth/telegram",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                init_data: initData,
                name,
                age,
                latitude:
                    location?.latitude ?? null,
                longitude:
                    location?.longitude ?? null,
            }),
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
            "Не вдалося зберегти профіль."
        );
    }

    return data;
}


window.api = {
    saveTelegramProfile,
};
