package pl.nbp.copilot.image;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.*;

@DisplayName("ImageService – walidacja")
class ImageServiceValidationTest {

    private final ImageService imageService = new ImageService();

    /** Nagłówki JPEG: FF D8 FF */
    private static final byte[] JPEG_MAGIC = new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF, (byte)0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01};

    /** Nagłówki PNG: 89 50 4E 47 0D 0A 1A 0A */
    private static final byte[] PNG_MAGIC = new byte[]{(byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};

    /** Nagłówki WebP: RIFF????WEBP */
    private static final byte[] WEBP_MAGIC = new byte[]{
            0x52, 0x49, 0x46, 0x46,  // RIFF
            0x10, 0x00, 0x00, 0x00,  // size (placeholder)
            0x57, 0x45, 0x42, 0x50   // WEBP
    };

    @Test
    @DisplayName("akceptuje prawidłowy plik JPEG")
    void acceptsJpeg() {
        var file = new MockMultipartFile("image", "test.jpg", "image/jpeg", JPEG_MAGIC);
        assertThatCode(() -> imageService.validateImage(file)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("akceptuje prawidłowy plik PNG")
    void acceptsPng() {
        var file = new MockMultipartFile("image", "test.png", "image/png", PNG_MAGIC);
        assertThatCode(() -> imageService.validateImage(file)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("akceptuje prawidłowy plik WebP")
    void acceptsWebP() {
        var file = new MockMultipartFile("image", "test.webp", "image/webp", WEBP_MAGIC);
        assertThatCode(() -> imageService.validateImage(file)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("odrzuca plik PNG z rozszerzeniem .jpg (podrobione magic bytes)")
    void rejectsPngRenamedToJpg() {
        var file = new MockMultipartFile("image", "fake.jpg", "image/jpeg", PNG_MAGIC);
        assertThatThrownBy(() -> imageService.validateImage(file))
                .isInstanceOf(ImageValidationException.class)
                .hasMessageContaining("format");
    }

    @Test
    @DisplayName("odrzuca plik o zerowej długości")
    void rejectsZeroByteFile() {
        var file = new MockMultipartFile("image", "empty.jpg", "image/jpeg", new byte[0]);
        assertThatThrownBy(() -> imageService.validateImage(file))
                .isInstanceOf(ImageValidationException.class);
    }

    @Test
    @DisplayName("odrzuca plik większy niż 10 MB")
    void rejectsFileOver10Mb() {
        byte[] largeContent = new byte[10 * 1024 * 1024 + 1];
        System.arraycopy(JPEG_MAGIC, 0, largeContent, 0, JPEG_MAGIC.length);
        var file = new MockMultipartFile("image", "big.jpg", "image/jpeg", largeContent);
        assertThatThrownBy(() -> imageService.validateImage(file))
                .isInstanceOf(ImageValidationException.class)
                .hasMessageContaining("10 MB");
    }
}
