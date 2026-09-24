import logging
import os

from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes


load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user

    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "🌍 Відкрити Who's Free Today",
                    web_app=WebAppInfo(url=WEBAPP_URL),
                )
            ]
        ]
    )

    await update.message.reply_text(
        f"👋 Привіт, {user.first_name}!\n\n"
        "Ласкаво просимо до Who's Free Today?\n\n"
        "Знаходь людей поруч, які теж вільні сьогодні. 🌍",
        reply_markup=keyboard,
    )


def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError(
            "BOT_TOKEN не знайдено. Перевір файл .env."
        )

    if not WEBAPP_URL:
        raise RuntimeError(
            "WEBAPP_URL не знайдено. Перевір файл .env."
        )

    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))

    logger.info("Who's Free Today bot started.")

    application.run_polling()


if __name__ == "__main__":
    main()
      
