import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TypingIndicatorComponent } from './typing-indicator.component';

describe('TypingIndicatorComponent', () => {
  let fixture: ComponentFixture<TypingIndicatorComponent>;
  let component: TypingIndicatorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypingIndicatorComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TypingIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('is visible when streaming=true', () => {
    component.streaming = true;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const indicator = el.querySelector('.typing-indicator');
    expect(indicator).toBeTruthy();
    // Should not have hidden class
    expect(indicator?.classList.contains('typing-indicator--hidden')).toBeFalse();
  });

  it('is hidden when streaming=false', () => {
    component.streaming = false;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const indicator = el.querySelector('.typing-indicator');
    // Either hidden via class or not rendered at all
    const isHidden =
      !indicator ||
      indicator.classList.contains('typing-indicator--hidden') ||
      (indicator as HTMLElement).hidden;
    expect(isHidden).toBeTrue();
  });

  it('shows 3 dots when visible', () => {
    component.streaming = true;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const dots = el.querySelectorAll('.typing-indicator__dot');
    expect(dots.length).toBe(3);
  });
});
