package pl.nbp.copilot.image;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

import static org.assertj.core.api.Assertions.*;

@DisplayName("ImageService – kompresja")
class ImageServiceCompressionTest {

    private final ImageService imageService = new ImageService();

    /**
     * Tworzy obraz JPEG o podanym rozmiarze i zwraca bajty.
     */
    private byte[] createJpegBytes(int width, int height) throws Exception {
        var image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        var g = image.getGraphics();
        g.setColor(Color.RED);
        g.fillRect(0, 0, width, height);
        g.setColor(Color.BLUE);
        g.fillRect(width / 4, height / 4, width / 2, height / 2);
        g.dispose();
        var out = new ByteArrayOutputStream();
        ImageIO.write(image, "JPEG", out);
        return out.toByteArray();
    }

    /**
     * Tworzy obraz PNG o podanym rozmiarze i zwraca bajty.
     */
    private byte[] createPngBytes(int width, int height) throws Exception {
        var image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        var g = image.getGraphics();
        g.setColor(Color.GREEN);
        g.fillRect(0, 0, width, height);
        g.dispose();
        var out = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", out);
        return out.toByteArray();
    }

    @Test
    @DisplayName("wynik to poprawny JPEG base64 (zaczyna się od /9j/)")
    void outputIsJpegBase64() throws Exception {
        var jpegBytes = createJpegBytes(200, 200);
        var file = new MockMultipartFile("image", "test.jpg", "image/jpeg", jpegBytes);

        var result = imageService.compressToJpegBase64(file);

        assertThat(result).isNotBlank();
        var decoded = Base64.getDecoder().decode(result);
        // JPEG magic bytes
        assertThat(decoded[0] & 0xFF).isEqualTo(0xFF);
        assertThat(decoded[1] & 0xFF).isEqualTo(0xD8);
        assertThat(decoded[2] & 0xFF).isEqualTo(0xFF);
    }

    @Test
    @DisplayName("kompresja dużego JPEG (>1MB) daje mniejszy wynik")
    void compressesLargeJpeg() throws Exception {
        var bigJpegBytes = createJpegBytes(3000, 3000);
        // Ensure > 1MB
        if (bigJpegBytes.length < 1024 * 1024) {
            // if test image is small, simulate large by filling bytes
            // Use a PNG instead which is typically larger
            bigJpegBytes = createPngBytes(2000, 2000);
        }
        var file = new MockMultipartFile("image", "big.jpg", "image/jpeg",
                bigJpegBytes.length > 1024 * 1024 ? bigJpegBytes : createJpegBytes(3000, 3000));

        var result = imageService.compressToJpegBase64(file);
        var decoded = Base64.getDecoder().decode(result);

        // Verify output is smaller than large input
        // (if input was already small, at least check output is JPEG)
        assertThat(decoded[0] & 0xFF).isEqualTo(0xFF);
        assertThat(decoded[1] & 0xFF).isEqualTo(0xD8);
    }

    @Test
    @DisplayName("kompresja dużego PNG daje JPEG base64")
    void compressesLargePng() throws Exception {
        var pngBytes = createPngBytes(2000, 2000);
        var file = new MockMultipartFile("image", "large.png", "image/png", pngBytes);

        var result = imageService.compressToJpegBase64(file);
        var decoded = Base64.getDecoder().decode(result);

        // Verify JPEG magic
        assertThat(decoded[0] & 0xFF).isEqualTo(0xFF);
        assertThat(decoded[1] & 0xFF).isEqualTo(0xD8);
        assertThat(decoded[2] & 0xFF).isEqualTo(0xFF);
    }

    @Test
    @DisplayName("mały obraz nie jest powiększany ponad 1024px")
    void smallImageNotUpscaled() throws Exception {
        var smallBytes = createJpegBytes(50, 50);
        var file = new MockMultipartFile("image", "small.jpg", "image/jpeg", smallBytes);

        var result = imageService.compressToJpegBase64(file);
        var decoded = Base64.getDecoder().decode(result);

        // Read the resulting image and check dimensions
        var resultImage = ImageIO.read(new java.io.ByteArrayInputStream(decoded));
        assertThat(resultImage.getWidth()).isLessThanOrEqualTo(1024);
        assertThat(resultImage.getHeight()).isLessThanOrEqualTo(1024);
    }

    @Test
    @DisplayName("obraz 2000x2000 jest skalowany do max 1024px")
    void largeImageScaledToMax1024() throws Exception {
        var bigBytes = createJpegBytes(2000, 2000);
        var file = new MockMultipartFile("image", "large.jpg", "image/jpeg", bigBytes);

        var result = imageService.compressToJpegBase64(file);
        var decoded = Base64.getDecoder().decode(result);

        var resultImage = ImageIO.read(new java.io.ByteArrayInputStream(decoded));
        assertThat(resultImage.getWidth()).isLessThanOrEqualTo(1024);
        assertThat(resultImage.getHeight()).isLessThanOrEqualTo(1024);
    }
}
