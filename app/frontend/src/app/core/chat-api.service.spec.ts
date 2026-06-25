import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ChatApiService } from './chat-api.service';

/**
 * Tests for ChatApiService use a mock of @microsoft/fetch-event-source.
 * We inject a mock fetchEventSource function via the service's internal mechanism.
 */
describe('ChatApiService', () => {
  let service: ChatApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ChatApiService,
      ],
    });
    service = TestBed.inject(ChatApiService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('stream() yields tokens in order via mock fetchEventSource', (done) => {
    const tokens: string[] = [];

    // Enable test mode BEFORE calling stream so real fetch is skipped
    service['_testMode'] = true;

    service.stream('session-1', 'Hej', {
      onToken: (token) => tokens.push(token),
      onComplete: () => {
        expect(tokens).toEqual(['Cześć', ' użytkowniku', '!']);
        done();
      },
      onError: (e) => fail('should not error: ' + e),
      onNotFound: () => fail('should not 404'),
    });

    service['_testDeliverEvents']([
      { type: 'message', data: 'Cześć' },
      { type: 'message', data: ' użytkowniku' },
      { type: 'message', data: '!' },
      { type: 'complete', data: '' },
    ]);
  });

  it('stream() fires onComplete when complete event arrives', (done) => {
    service['_testMode'] = true;

    service.stream('session-1', 'test', {
      onToken: () => {},
      onComplete: () => done(),
      onError: (e) => fail('unexpected error: ' + e),
      onNotFound: () => fail('unexpected 404'),
    });

    service['_testDeliverEvents']([
      { type: 'complete', data: '' },
    ]);
  });

  it('stream() fires onError when error event arrives mid-turn', (done) => {
    service['_testMode'] = true;

    service.stream('session-1', 'test', {
      onToken: () => {},
      onComplete: () => fail('unexpected complete'),
      onError: (msg) => {
        expect(msg).toContain('Błąd');
        done();
      },
      onNotFound: () => fail('unexpected 404'),
    });

    service['_testDeliverEvents']([
      { type: 'error', data: 'Błąd strumienia' },
    ]);
  });

  it('stream() fires onNotFound when 404 status arrives', (done) => {
    service['_testMode'] = true;

    service.stream('session-1', 'test', {
      onToken: () => {},
      onComplete: () => fail('unexpected complete'),
      onError: () => fail('unexpected error'),
      onNotFound: () => done(),
    });

    service['_testDeliverEvents']([], { status: 404 });
  });
});
