/**
 * Polskie napisy dla całej aplikacji.
 * Centralny plik z wszystkimi tekstami widocznymi dla użytkownika.
 * Wypełniany stopniowo w kolejnych krokach implementacji.
 */
export const pl = {
  app: {
    title: 'Asystent Decyzji Sprzętowych NBP',
    loading: 'Ładowanie...',
  },
  header: {
    title: 'Asystent Decyzji Sprzętowych',
    subtitle: 'Narodowy Bank Polski',
  },
  footer: {
    copyright: 'Copyright © 1998–2026 Narodowy Bank Polski. Wszystkie prawa zastrzeżone.',
  },
  // Formularz zgłoszenia (IntakeFormComponent) — wypełnić w kroku 0.3
  intake: {},
  // Widok czatu (ChatComponent) — wypełnić w kroku 0.4
  chat: {},
  // Komunikaty błędów
  errors: {
    generic: 'Wystąpił błąd. Spróbuj ponownie.',
  },
} as const;

export type Pl = typeof pl;
