package pl.nbp.copilot.session;

/** Wyjątek zgłaszany gdy sesja o podanym identyfikatorze nie istnieje lub wygasła. */
public class SessionNotFoundException extends RuntimeException {

    public SessionNotFoundException(String sessionId) {
        super("Sesja nie istnieje lub wygasła: " + sessionId);
    }
}
