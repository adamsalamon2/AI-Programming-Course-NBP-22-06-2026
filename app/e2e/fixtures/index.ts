/**
 * Fixture path constants for use in all specs.
 * All paths are absolute so tests work regardless of cwd.
 */
import * as path from 'path';

const FIXTURES_DIR = path.resolve(__dirname);

export const FIXTURES = {
  /** Small valid JPEG — unused-looking device (Zwrot happy path). */
  unusedDeviceJpeg: path.join(FIXTURES_DIR, 'unused-device.jpg'),

  /** Small valid PNG — cracked screen (Reklamacja reject path). */
  crackedScreenPng: path.join(FIXTURES_DIR, 'cracked-screen.png'),

  /** Small valid WebP — blurry / ambiguous (Needs review path). */
  blurryPhotoWebp: path.join(FIXTURES_DIR, 'blurry-photo.webp'),

  /** Valid JPEG header + padding > 10 MB (invalid size). */
  oversizedImageJpeg: path.join(FIXTURES_DIR, 'oversized-image.jpg'),

  /** GIF file — unsupported format (invalid type). */
  wrongTypeGif: path.join(FIXTURES_DIR, 'wrong-type.gif'),
} as const;
