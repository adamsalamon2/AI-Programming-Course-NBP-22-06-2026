# Polityka Reklamacji (Rękojmia / Gwarancja) — ElectroService Sp. z o.o.

> Dokument przykładowy (wersja MVP) — wykorzystywany jako zestaw reguł wstrzykiwany do
> kontekstu agenta AI w scenariuszu **REKLAMACJA**. Treść poglądowa, do dostosowania przez
> dział prawny przed użyciem produkcyjnym.

**Wersja:** 1.0 · **Obowiązuje od:** 2026-01-01 · **Dotyczy:** sprzętu elektronicznego

---

## 1. Podstawa prawna

1.1. **Rękojmia** — sprzedawca odpowiada za niezgodność towaru z umową (wady fizyczne)
przez okres **2 lat** od dnia wydania towaru konsumentowi (Kodeks cywilny / ustawa o prawach
konsumenta).

1.2. **Gwarancja** — dobrowolne zobowiązanie producenta lub sprzedawcy, na warunkach i przez
okres określony w karcie gwarancyjnej (np. 12 / 24 / 36 miesięcy). Gwarancja nie wyłącza
rękojmi — konsument wybiera podstawę.

1.3. Domniemywa się, że wada stwierdzona w ciągu 2 lat istniała w chwili wydania towaru,
o ile nie wykażą tego okoliczności przeciwne (np. uszkodzenie z winy użytkownika).

---

## 2. Zakres odpowiedzialności

### 2.1. Objęte reklamacją (wada / defekt produkcyjny)
- Niesprawność funkcjonalna bez przyczyny zewnętrznej (nie włącza się, nie ładuje,
  martwe piksele, zanikający dźwięk).
- Wady fabryczne montażu (odklejające się elementy, niedopasowanie obudowy).
- Awaria podzespołów w normalnych warunkach użytkowania.
- Wady ujawniające się samoistnie w okresie rękojmi/gwarancji.

### 2.2. NIEobjęte reklamacją (przyczyna po stronie użytkownika / czynniki zewnętrzne)
- Uszkodzenia mechaniczne: pęknięcia, zbicia, wgniecenia, zarysowania od upadku.
- Zalania i ślady wilgoci, korozja styków.
- Uszkodzenia wskutek niewłaściwego użytkowania, przeciążenia, niewłaściwego zasilania.
- Naturalne zużycie eksploatacyjne (zużycie baterii w normie producenta, przetarcia).
- Ślady samodzielnych lub nieautoryzowanych napraw, zerwane plomby serwisowe.
- Uszkodzenia przez oprogramowanie/wirusy zainstalowane przez użytkownika.

---

## 3. Ocena uszkodzenia na podstawie zdjęcia (dla agenta AI)

Agent ocenia: **czy sprzęt jest uszkodzony, jaki to typ uszkodzenia i jaka jest prawdopodobna
przyczyna** (defekt produkcyjny vs. uszkodzenie z winy użytkownika).

| Obraz wskazuje na | Prawdopodobna przyczyna | Kierunek decyzji |
|---|---|---|
| Brak widocznych uszkodzeń, zgłaszana niesprawność funkcjonalna | Możliwy defekt ukryty | Akceptacja / Do weryfikacji |
| Wada montażu, odklejone elementy bez śladów siły | Defekt produkcyjny | Akceptacja |
| Pęknięty ekran, wgniecenia, ślady upadku | Uszkodzenie mechaniczne (użytkownik) | Odmowa |
| Ślady zalania, korozja, przebarwienia od wilgoci | Czynnik zewnętrzny (użytkownik) | Odmowa |
| Zerwane plomby, ślady otwierania | Nieautoryzowana ingerencja | Odmowa |
| Obraz niejednoznaczny / niewyraźny | Nie da się ustalić | Do weryfikacji |

---

## 4. Czynniki czasowe

- Reklamacja przyjmowana, gdy od daty zakupu **nie minęły 2 lata** (rękojmia) lub gdy
  obowiązuje gwarancja producenta o dłuższym okresie.
- Po upływie okresu rękojmi i braku gwarancji → **Odmowa** (z informacją o płatnym serwisie).

---

## 5. Sposób rozpatrzenia (informacyjnie dla klienta)

W przypadku uznanej reklamacji konsument może żądać: naprawy, wymiany, obniżenia ceny lub —
przy wadzie istotnej — odstąpienia od umowy. Sprzedawca ustosunkowuje się do żądania
w terminie **14 dni**.

---

## 6. Wynik decyzji

- **Akceptacja reklamacji** — uszkodzenie/niesprawność wskazuje na defekt (§2.1, §3),
  w okresie rękojmi/gwarancji.
- **Odmowa** — przyczyna po stronie użytkownika (§2.2, §3) lub po okresie ochrony (§4).
- **Do weryfikacji przez pracownika** — obraz lub opis niejednoznaczny, potrzebna
  dodatkowa diagnostyka lub dokumenty (dowód zakupu, karta gwarancyjna).
