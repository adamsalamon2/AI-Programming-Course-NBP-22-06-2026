package pl.nbp.copilot.image;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Set;

/**
 * Serwis do walidacji i kompresji obrazów przesyłanych przez użytkownika.
 *
 * <p>Walidacja sprawdza: typ MIME z listy dozwolonych, magic bytes pliku oraz rozmiar (max 10 MB).
 * Kompresja skaluje obraz do max 1024px i koduje do JPEG base64.</p>
 */
@Service
public class ImageService {

    private static final long MAX_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final int MAX_DIMENSION = 1024;
    private static final float JPEG_QUALITY = 0.85f;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );

    /**
     * Waliduje przesłany plik obrazu.
     *
     * @param file plik do walidacji
     * @throws ImageValidationException gdy plik nie spełnia wymagań
     */
    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ImageValidationException("Plik jest pusty lub nie został przesłany");
        }

        long size = file.getSize();
        if (size > MAX_SIZE_BYTES) {
            throw new ImageValidationException(
                    "Plik przekracza dopuszczalny rozmiar 10 MB (przesłano: " +
                            (size / (1024 * 1024)) + " MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ImageValidationException(
                    "Nieobsługiwany typ pliku. Akceptowane formaty: JPEG, PNG, WebP");
        }

        byte[] header;
        try {
            header = file.getBytes();
        } catch (IOException e) {
            throw new ImageValidationException("Nie można odczytać pliku obrazu");
        }

        if (!matchesMagicBytes(header, contentType)) {
            throw new ImageValidationException(
                    "Nieprawidłowy format pliku — zawartość pliku nie odpowiada deklarowanemu typowi");
        }
    }

    /**
     * Sprawdza magic bytes pliku względem deklarowanego content-type.
     */
    private boolean matchesMagicBytes(byte[] data, String contentType) {
        if (data.length < 12) {
            return false;
        }

        String type = contentType.toLowerCase();

        if (type.contains("jpeg") || type.contains("jpg")) {
            // JPEG: FF D8 FF
            return (data[0] & 0xFF) == 0xFF
                    && (data[1] & 0xFF) == 0xD8
                    && (data[2] & 0xFF) == 0xFF;
        }

        if (type.contains("png")) {
            // PNG: 89 50 4E 47 0D 0A 1A 0A
            return (data[0] & 0xFF) == 0x89
                    && (data[1] & 0xFF) == 0x50
                    && (data[2] & 0xFF) == 0x4E
                    && (data[3] & 0xFF) == 0x47;
        }

        if (type.contains("webp")) {
            // WebP: RIFF (4 bytes) + size (4 bytes) + WEBP
            return (data[0] & 0xFF) == 0x52  // R
                    && (data[1] & 0xFF) == 0x49  // I
                    && (data[2] & 0xFF) == 0x46  // F
                    && (data[3] & 0xFF) == 0x46  // F
                    && (data[8] & 0xFF) == 0x57  // W
                    && (data[9] & 0xFF) == 0x45  // E
                    && (data[10] & 0xFF) == 0x42 // B
                    && (data[11] & 0xFF) == 0x50; // P
        }

        return false;
    }

    /**
     * Kompresuje obraz do JPEG i zwraca jako łańcuch Base64.
     *
     * @param file plik obrazu (musi przejść walidację przed wywołaniem)
     * @return base64-zakodowany JPEG (bez prefiksu data URI)
     * @throws ImageValidationException gdy nie można przetworzyć pliku
     */
    public String compressToJpegBase64(MultipartFile file) {
        try {
            var output = new ByteArrayOutputStream();
            Thumbnails.of(file.getInputStream())
                    .size(MAX_DIMENSION, MAX_DIMENSION)
                    .keepAspectRatio(true)
                    .outputFormat("JPEG")
                    .outputQuality(JPEG_QUALITY)
                    .toOutputStream(output);
            return Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (IOException e) {
            throw new ImageValidationException("Nie można skompresować obrazu: " + e.getMessage());
        }
    }
}
