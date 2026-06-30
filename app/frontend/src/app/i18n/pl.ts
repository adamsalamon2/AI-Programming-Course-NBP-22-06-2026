/**
 * Polskie napisy dla całej aplikacji.
 * Centralny plik z wszystkimi tekstami widocznymi dla użytkownika.
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

  /** Formularz zgłoszenia (IntakeFormComponent) */
  intake: {
    title: 'Złóż wniosek o reklamację lub zwrot',
    description:
      'Wypełnij formularz i dołącz zdjęcie urządzenia. Asystent oceni Twój przypadek i podpowie dalsze kroki.',
    requestTypeLabel: 'Rodzaj wniosku',
    requestTypes: {
      COMPLAINT: 'Reklamacja',
      RETURN: 'Zwrot',
    },
    categoryLabel: 'Kategoria sprzętu',
    categoryPlaceholder: 'Wybierz kategorię',
    modelLabel: 'Nazwa / model urządzenia',
    modelPlaceholder: 'np. Samsung Galaxy S24',
    purchaseDateLabel: 'Data zakupu',
    reasonLabel: 'Opis powodu',
    reasonPlaceholderRequired: 'Opisz powód reklamacji (wymagane)',
    reasonPlaceholderOptional: 'Opisz powód zwrotu (opcjonalne)',
    reasonRequired: 'wymagane',
    reasonOptional: 'opcjonalne',
    imageLabel: 'Zdjęcie urządzenia',
    imageHint: 'Akceptowane formaty: JPEG, PNG, WebP · Maks. 10 MB',
    imageSelectButton: 'Wybierz zdjęcie',
    imageRemoveButton: 'Usuń zdjęcie',
    imageReplaceButton: 'Zmień zdjęcie',
    submitButton: 'Wyślij wniosek',
    submittingButton: 'Przetwarzanie…',
  },

  /** Kategorie sprzętu — klucz = wartość enum z backendu, wartość = etykieta PL */
  categories: {
    SMARTFONY: 'Smartfony',
    LAPTOPY: 'Laptopy',
    TABLETY: 'Tablety',
    TELEWIZORY: 'Telewizory',
    SLUCHAWKI: 'Słuchawki',
    SMARTWATCHE: 'Smartwatche',
    KONSOLE: 'Konsole do gier',
    AUDIO: 'Sprzęt audio',
    APARATY: 'Aparaty fotograficzne',
    AKCESORIA: 'Akcesoria',
    INNE: 'Inne',
  },

  /** Etykiety wyniku decyzji */
  verdict: {
    APPROVE: 'Pozytywna opinia',
    REJECT: 'Negatywna opinia',
    NEEDS_REVIEW: 'Wymaga weryfikacji',
  },

  /** Widok czatu (ChatComponent) */
  chat: {
    inputPlaceholder: 'Napisz wiadomość…',
    sendButton: 'Wyślij',
    typingIndicator: 'Asystent pisze…',
    retryButton: 'Spróbuj ponownie',
    startNewCase: 'Rozpocznij nową sprawę',
    disclaimerHeader: 'Ważna informacja',
    summaryTitle: 'Podsumowanie zgłoszenia',
    errorTurn: 'Nie udało się uzyskać odpowiedzi.',
    sessionExpired: 'Sesja wygasła. Możesz rozpocząć nową sprawę.',
  },

  /** Komunikaty błędów */
  errors: {
    generic: 'Wystąpił błąd. Spróbuj ponownie.',
    retryable:
      'Usługa jest chwilowo niedostępna. Spróbuj ponownie za chwilę.',
    required: 'To pole jest wymagane.',
    futureDateNotAllowed: 'Data zakupu nie może być w przyszłości.',
    purchaseDateRequired: 'Data zakupu jest wymagana.',
    categoryRequired: 'Wybierz kategorię sprzętu.',
    modelRequired: 'Podaj nazwę lub model urządzenia.',
    reasonRequired: 'Opis powodu reklamacji jest wymagany.',
    imageRequired: 'Dołącz zdjęcie urządzenia.',
    imageFormatInvalid:
      'Nieobsługiwany format pliku. Akceptowane formaty to: JPEG, PNG, WebP.',
    imageTooLarge: 'Plik jest za duży. Maksymalny rozmiar zdjęcia to 10 MB.',
    formIncomplete: 'Uzupełnij wymagane pola zaznaczone na czerwono.',
  },
} as const;

export type Pl = typeof pl;
