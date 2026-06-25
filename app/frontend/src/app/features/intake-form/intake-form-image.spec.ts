import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { IntakeFormComponent } from './intake-form.component';
import { pl } from '../../i18n/pl';

/** Create a mock File with given MIME type and size in bytes */
function mockFile(name: string, type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
}

describe('IntakeFormComponent — image upload validation', () => {
  let fixture: ComponentFixture<IntakeFormComponent>;
  let component: IntakeFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntakeFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IntakeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects a .gif file with format error', () => {
    const gif = mockFile('anim.gif', 'image/gif', 1024);
    component['applyFile'](gif);
    expect(component.imageError()).toBe(pl.errors.imageFormatInvalid);
    expect(component.selectedImage()).toBeNull();
    expect(component.imagePreview()).toBeNull();
  });

  it('format error names JPEG, PNG, WebP', () => {
    const gif = mockFile('anim.gif', 'image/gif', 1024);
    component['applyFile'](gif);
    const err = component.imageError()!;
    expect(err).toContain('JPEG');
    expect(err).toContain('PNG');
    expect(err).toContain('WebP');
  });

  it('rejects a file larger than 10 MB', () => {
    const bigFile = mockFile('photo.jpg', 'image/jpeg', 11 * 1024 * 1024);
    component['applyFile'](bigFile);
    expect(component.imageError()).toBe(pl.errors.imageTooLarge);
    expect(component.selectedImage()).toBeNull();
  });

  it('size error mentions 10 MB', () => {
    const bigFile = mockFile('photo.jpg', 'image/jpeg', 11 * 1024 * 1024);
    component['applyFile'](bigFile);
    expect(component.imageError()).toContain('10 MB');
  });

  it('accepts a valid JPEG file and stores it', () => {
    const jpeg = mockFile('photo.jpg', 'image/jpeg', 1024);
    component['applyFile'](jpeg);
    expect(component.imageError()).toBeNull();
    expect(component.selectedImage()).toBe(jpeg);
  });

  it('accepts a valid PNG file', () => {
    const png = mockFile('image.png', 'image/png', 2048);
    component['applyFile'](png);
    expect(component.imageError()).toBeNull();
    expect(component.selectedImage()).toBe(png);
  });

  it('accepts a valid WebP file', () => {
    const webp = mockFile('image.webp', 'image/webp', 512);
    component['applyFile'](webp);
    expect(component.imageError()).toBeNull();
    expect(component.selectedImage()).toBe(webp);
  });

  it('accepts exactly 10 MB file (boundary)', () => {
    const tenMb = mockFile('photo.jpg', 'image/jpeg', 10 * 1024 * 1024);
    component['applyFile'](tenMb);
    expect(component.imageError()).toBeNull();
    expect(component.selectedImage()).toBe(tenMb);
  });

  it('removeImage() clears selectedImage, imagePreview, and imageError', () => {
    const jpeg = mockFile('photo.jpg', 'image/jpeg', 1024);
    component['applyFile'](jpeg);
    component.removeImage();
    expect(component.selectedImage()).toBeNull();
    expect(component.imagePreview()).toBeNull();
    expect(component.imageError()).toBeNull();
  });

  it('replacing image with a new valid file swaps selectedImage', () => {
    const jpeg1 = mockFile('first.jpg', 'image/jpeg', 1024);
    const jpeg2 = mockFile('second.jpg', 'image/jpeg', 2048);
    component['applyFile'](jpeg1);
    expect(component.selectedImage()?.name).toBe('first.jpg');
    component['applyFile'](jpeg2);
    expect(component.selectedImage()?.name).toBe('second.jpg');
  });

  it('submitting without image sets imageError to imageRequired', () => {
    // Fill all other fields so only image is missing
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('category')!.setValue('LAPTOPY');
    component.form.get('model')!.setValue('Dell XPS');
    component.form.get('purchaseDate')!.setValue(new Date(2024, 0, 1));
    component.onSubmit();
    expect(component.imageError()).toBe(pl.errors.imageRequired);
  });
});
