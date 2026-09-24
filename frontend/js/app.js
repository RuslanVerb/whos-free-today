const startButton = document.getElementById("start-button");
const locationButton = document.getElementById("location-button");

const welcomeScreen = document.getElementById("welcome-screen");
const locationScreen = document.getElementById("location-screen");


function showScreen(screen) {
    document.querySelectorAll(".screen").forEach((item) => {
        item.classList.remove("active");
    });

    screen.classList.add("active");
}


startButton.addEventListener("click", () => {
    showScreen(locationScreen);
});


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

            locationButton.textContent = "✅ Локацію отримано";

            alert("Локацію успішно отримано!");
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
