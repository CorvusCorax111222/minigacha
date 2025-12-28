# MG Online Gra (backend + Electron)

To jest gotowy szkielet „prawdziwego online” dla Twojej gry:
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Logowanie: email/hasło (bcrypt) + JWT
- Zapis w chmurze: `/api/save` (GET/PUT)
- (Opcjonalnie) leaderboard: `/api/leaderboard/*`
- Frontend: Twoja gra jako `backend/public/gra.html` + panel Online (`online_client.js`)
- Desktop: Electron uruchamia backend lokalnie i ładuje grę w oknie

## 1) Wymagania
- Node.js 18+ (polecam 20+)
- (Opcjonalnie) Git

## 2) Start jako serwer online (web)
1. Wejdź do folderu projektu
2. Zainstaluj paczki:
   ```bash
   npm install
   ```
3. Skopiuj zmienne środowiskowe:
   ```bash
   cp .env.example .env
   ```
4. Ustaw `JWT_SECRET` w `.env` na długi losowy string.
5. Uruchom:
   ```bash
   npm run dev:server
   ```
6. Otwórz w przeglądarce:
   - http://localhost:8787

## 3) Start jako aplikacja okienkowa (Electron)
1. Instalacja:
   ```bash
   npm install
   ```
2. Uruchom:
   ```bash
   npm run dev:electron
   ```

## 4) Build instalatora (Windows / macOS / Linux)
```bash
npm run dist
```
Wynik znajdziesz w `dist/`.

## 5) Deploy na hosting
Backend jest zwykłym serwerem Node, możesz go wrzucić np. na VPS.
Wymagane:
- HTTPS (reverse proxy typu Nginx / Caddy)
- ustawione ENV: `PORT`, `JWT_SECRET`, opcjonalnie `DB_PATH`

## 6) Jak to działa w grze
W prawym-dolnym rogu jest panel **Online (backend)**:
- Rejestruj / Zaloguj
- Po loginie gra pobierze zapis z chmury i podmieni stan (S), a potem będzie wysyłać autozapis na serwer.

> Uwaga: jeśli chcesz pełną „anty-cheat” logikę (gacha, waluty, pity po stronie serwera),
> trzeba przenieść kluczowe obliczenia do endpointów backendu. Ten projekt daje fundament.
