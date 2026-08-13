from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    bot_token: str = ""
    admin_ids: str = ""
    public_api_url: str = "http://localhost:3001"
    web_url: str = "http://localhost:5173"
    bot_username: str = ""
    database_path: str = str(ROOT / "data" / "tatiana.json")
    port: int = 3001
    host: str = "0.0.0.0"
    payment_provider: str = "leads"
    dikidi_provider: str = "live"
    dikidi_token: str = ""
    dikidi_company_id: str = "116141"
    dikidi_booking_url: str = "https://dikidi.net/116141"

    @property
    def admins(self) -> set[int]:
        return {
            int(x.strip())
            for x in self.admin_ids.split(",")
            if x.strip().isdigit()
        }

    @property
    def dikidi_url(self) -> str:
        if self.dikidi_booking_url and "localhost" not in self.dikidi_booking_url:
            return self.dikidi_booking_url
        return f"https://dikidi.net/{self.dikidi_company_id}"

    def is_admin(self, user_id: int | None) -> bool:
        return bool(user_id and user_id in self.admins)


settings = Settings()
