const telegram = window.Telegram?.WebApp;

if (telegram) {
    telegram.ready();
    telegram.expand();

    console.log(
        "Telegram Mini App initialized",
        telegram.initDataUnsafe?.user
    );
}
