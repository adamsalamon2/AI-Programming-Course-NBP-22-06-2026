# Polityka Reklamacji (Brak zgodności towaru z umową / Gwarancja) — ElectroService Sp. z o.o.

> **Dokument przykładowy (wersja MVP).** Wykorzystywany jako zestaw reguł wstrzykiwany do
> kontekstu agenta AI w scenariuszu **REKLAMACJA**. Treść poglądowa, opracowana na podstawie
> prawa polskiego i unijnego — przed użyciem produkcyjnym wymaga weryfikacji przez dział prawny.

**Wersja:** 2.0 · **Obowiązuje od:** 2026-01-01 · **Dotyczy:** sprzętu elektronicznego
(sprzedaż konsumencka)

---

## 0. Podstawa prawna

| Akt prawny | Zakres |
|---|---|
| Dyrektywa (UE) 2019/771 (dyrektywa towarowa) | Zgodność towaru z umową, środki ochrony konsumenta |
| Dyrektywa (UE) 2019/770 | Treści i usługi cyfrowe |
| Ustawa z dnia 30 maja 2014 r. o prawach konsumenta (u.p.k.), w brzmieniu od 1.01.2023 r. (nowelizacja z 4.11.2022 r.) | Polska implementacja — rozdział o braku zgodności towaru z umową, art. 43a–43g i nast. |

> **Ważna zmiana (od 1 stycznia 2023 r.):** w relacjach przedsiębiorca–konsument **nie stosuje
> się już** pojęcia „rękojmia"/„wada fizyczna" z Kodeksu cywilnego. Obowiązuje reżim
> **braku zgodności towaru z umową** uregulowany w ustawie o prawach konsumenta. Terminologia
> „rękojmia" pozostaje aktualna jedynie poza obrotem konsumenckim (B2B).

---

## 1. Odpowiedzialność przedsiębiorcy (brak zgodności towaru z umową)

1.1. Sprzedawca odpowiada za **brak zgodności towaru z umową** istniejący w chwili dostarczenia
i ujawniony **w ciągu 2 lat** od tej chwili (art. 43c ust. 1 u.p.k.; art. 10 dyrektywy 2019/771).

1.2. **Domniemanie na korzyść konsumenta:** brak zgodności ujawniony przed upływem **2 lat** od
dostarczenia towaru domniemywa się jako istniejący już w chwili dostarczenia — to **sprzedawca**
musi ewentualnie wykazać, że było inaczej (art. 43c u.p.k.). Domniemania nie stosuje się, gdy
jest ono nie do pogodzenia ze specyfiką towaru lub charakterem braku zgodności.

1.3. Towar jest zgodny z umową m.in. gdy odpowiada opisowi, rodzajowi, ilości, jakości,
kompletności; nadaje się do celu, do którego towar danego rodzaju jest zwykle używany; ma cechy
typowe dla towaru danego rodzaju, których konsument może oczekiwać (art. 43b u.p.k.).

---

## 2. Gwarancja (dobrowolne zobowiązanie)

2.1. **Gwarancja** jest dobrowolnym zobowiązaniem gwaranta (producenta lub sprzedawcy),
udzielanym **ponad** uprawnienia ustawowe; jej warunki i okres określa oświadczenie gwarancyjne
(np. 12 / 24 / 36 miesięcy).

2.2. Gwarancja **nie wyłącza ani nie ogranicza** uprawnień konsumenta z tytułu braku zgodności
towaru z umową. Konsument **wybiera** podstawę dochodzenia roszczeń (ustawowa vs gwarancja).

2.3. Treść gwarancji nie może być mniej korzystna niż informacje podane w reklamie.

---

## 3. Zakres odpowiedzialności — reguły oceny

### 3.1. Objęte reklamacją (niezgodność / defekt po stronie towaru)
- Niesprawność funkcjonalna bez przyczyny zewnętrznej (nie włącza się, nie ładuje, martwe
  piksele, zanikający dźwięk, samoczynne wyłączanie).
- Wady fabryczne montażu (odklejające się elementy, niedopasowanie obudowy bez śladów siły).
- Awaria podzespołów w normalnych warunkach użytkowania.
- Niezgodność z opisem/specyfikacją (inny model, parametry, brak funkcji).
- Wady ujawniające się samoistnie w okresie 2 lat (domniemanie z §1.2).

### 3.2. NIEobjęte reklamacją (przyczyna po stronie użytkownika / czynniki zewnętrzne)
- Uszkodzenia mechaniczne: pęknięcia, zbicia, wgniecenia, zarysowania od upadku.
- Zalania, ślady wilgoci, korozja styków.
- Niewłaściwe użytkowanie, przeciążenie, niewłaściwe zasilanie.
- Naturalne zużycie eksploatacyjne (np. spadek pojemności baterii w granicach normy producenta).
- Ślady samodzielnych lub nieautoryzowanych napraw, zerwane plomby serwisowe.
- Uszkodzenia spowodowane oprogramowaniem/wirusami zainstalowanymi przez użytkownika.

---

## 4. Ocena uszkodzenia na podstawie zdjęcia (reguły dla agenta AI)

Agent ocenia: **czy sprzęt jest uszkodzony, jaki to typ uszkodzenia i jaka jest prawdopodobna
przyczyna** (niezgodność/defekt towaru vs przyczyna po stronie użytkownika).

| Obraz wskazuje na | Prawdopodobna przyczyna | Kierunek decyzji |
|---|---|---|
| Brak widocznych uszkodzeń, zgłaszana niesprawność funkcjonalna | Możliwy defekt ukryty (domniemanie §1.2) | Akceptacja / Do weryfikacji |
| Wada montażu, odklejone elementy bez śladów siły | Niezgodność/defekt produkcyjny | Akceptacja |
| Pęknięty ekran, wgniecenia, ślady upadku | Uszkodzenie mechaniczne (użytkownik) | Odmowa |
| Ślady zalania, korozja, przebarwienia od wilgoci | Czynnik zewnętrzny (użytkownik) | Odmowa |
| Zerwane plomby, ślady otwierania/ingerencji | Nieautoryzowana ingerencja | Odmowa |
| Obraz niejednoznaczny / niewyraźny | Nie da się ustalić | Do weryfikacji |

> **Ciężar dowodu (§1.2):** w okresie 2 lat to sprzedawca wykazuje, że niezgodność nie istniała
> w chwili dostarczenia. Przy braku widocznej przyczyny zewnętrznej agent powinien skłaniać się
> ku **Akceptacji** lub **Do weryfikacji**, nie ku automatycznej odmowie.

---

## 5. Czynniki czasowe

- Reklamacja z tytułu braku zgodności — gdy od **dostarczenia** towaru **nie minęły 2 lata**
  (art. 43c u.p.k.).
- Niezależnie — gdy obowiązuje **gwarancja** o dłuższym okresie (§2), reklamację można oprzeć
  na gwarancji.
- Po upływie ochrony ustawowej i braku gwarancji → **Odmowa** (z informacją o płatnym serwisie).

---

## 6. Hierarchia środków ochrony konsumenta (dyrektywa 2019/771)

W razie uznania braku zgodności towaru z umową konsument może żądać środków w określonej
kolejności:

1. **W pierwszej kolejności** — doprowadzenie towaru do zgodności przez **naprawę albo wymianę**
   (art. 43d u.p.k.). Wybór należy do konsumenta, lecz sprzedawca może zaproponować inny sposób,
   jeżeli wybrany jest niemożliwy lub wymagałby nadmiernych kosztów.
2. **W drugiej kolejności** — **obniżenie ceny** albo **odstąpienie od umowy** (zwrot pieniędzy),
   gdy naprawa/wymiana jest niemożliwa, nieudana, nadmiernie uciążliwa lub sprzedawca jej
   odmówił (art. 43e u.p.k.). Przy nieistotnym braku zgodności odstąpienie od umowy nie
   przysługuje.

---

## 7. Termin rozpatrzenia reklamacji

7.1. Przedsiębiorca jest obowiązany **udzielić odpowiedzi na reklamację w terminie 14 dni** od
jej otrzymania; brak odpowiedzi w tym terminie oznacza uznanie reklamacji (art. 7a u.p.k.).

7.2. Zwrot środków przy obniżeniu ceny lub odstąpieniu następuje **nie później niż w 14 dni**.

---

## 8. Wynik decyzji (mapowanie dla agenta)

- **Akceptacja reklamacji** — uszkodzenie/niesprawność wskazuje na niezgodność/defekt (§3.1, §4),
  w okresie 2 lat (§5) lub w okresie gwarancji; z uwzględnieniem domniemania z §1.2.
- **Odmowa** — przyczyna jednoznacznie po stronie użytkownika lub czynnik zewnętrzny (§3.2, §4),
  albo po upływie ochrony i bez gwarancji (§5).
- **Do weryfikacji przez pracownika** — obraz lub opis niejednoznaczny; potrzebna dodatkowa
  diagnostyka lub dokumenty (dowód zakupu, karta gwarancyjna); wątpliwość co do daty dostarczenia.

---

## 9. Zmiany nadchodzące (informacyjnie)

Dyrektywa (UE) **2024/1799 („prawo do naprawy")** ma zostać wdrożona do prawa polskiego
w terminie do **31 lipca 2026 r.** Może ona wzmocnić preferencję dla naprawy w hierarchii
środków (§6); do czasu implementacji niniejszy dokument stosuje stan prawny obowiązujący
w Polsce.
