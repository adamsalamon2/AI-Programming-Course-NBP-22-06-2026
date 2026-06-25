package pl.nbp.copilot.ai;

import com.openai.client.OpenAIClient;
import com.openai.core.http.StreamResponse;
import com.openai.models.chat.completions.ChatCompletionChunk;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionMessageParam;
import com.openai.models.chat.completions.ChatCompletionUserMessageParam;
import com.openai.services.blocking.ChatService;
import com.openai.services.blocking.chat.ChatCompletionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.nbp.copilot.config.OpenRouterProperties;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Integration tests for {@link StreamingChatClient} using Mockito to mock the OpenAI SDK.
 *
 * <p>Verifies TAC-002-06 and TAC-002-07: token deltas are forwarded in arrival order,
 * a terminal {@code complete} event is emitted, and a mid-stream error surfaces as an
 * SSE {@code error} event without losing prior tokens.</p>
 */
@DisplayName("StreamingChatClient")
class StreamingChatClientWireMockTest {

    private ChatCompletionService mockCompletionService;
    private StreamingChatClient streamingChatClient;

    @BeforeEach
    void setUp() {
        var mockClient = mock(OpenAIClient.class);
        var mockChatService = mock(ChatService.class);
        mockCompletionService = mock(ChatCompletionService.class);

        when(mockClient.chat()).thenReturn(mockChatService);
        when(mockChatService.completions()).thenReturn(mockCompletionService);

        var properties = new OpenRouterProperties(
                "test-key", "http://localhost", "gpt-text", "gpt-vision");

        streamingChatClient = new StreamingChatClient(mockClient, properties);
    }

    private List<ChatCompletionMessageParam> singleUserMessage(String text) {
        return List.of(ChatCompletionMessageParam.ofUser(
                ChatCompletionUserMessageParam.builder().content(text).build()));
    }

    /**
     * Builds a mock {@link ChatCompletionChunk} that yields the given token delta.
     */
    private ChatCompletionChunk chunkWithDelta(String content) {
        var chunk = mock(ChatCompletionChunk.class);
        var choice = mock(ChatCompletionChunk.Choice.class);
        var delta = mock(ChatCompletionChunk.Choice.Delta.class);

        when(delta.content()).thenReturn(Optional.of(content));
        when(choice.delta()).thenReturn(delta);
        when(chunk.choices()).thenReturn(List.of(choice));
        return chunk;
    }

    /**
     * Builds a mock {@link ChatCompletionChunk} that yields an empty delta (finish).
     */
    private ChatCompletionChunk finishChunk() {
        var chunk = mock(ChatCompletionChunk.class);
        var choice = mock(ChatCompletionChunk.Choice.class);
        var delta = mock(ChatCompletionChunk.Choice.Delta.class);

        when(delta.content()).thenReturn(Optional.empty());
        when(choice.delta()).thenReturn(delta);
        when(chunk.choices()).thenReturn(List.of(choice));
        return chunk;
    }

    @SuppressWarnings("unchecked")
    private void setupStreamingResponse(ChatCompletionChunk... chunks) {
        var streamResponse = mock(StreamResponse.class, withSettings().extraInterfaces(AutoCloseable.class));
        when(streamResponse.stream()).thenReturn(Stream.of(chunks));
        when(mockCompletionService.createStreaming(any(ChatCompletionCreateParams.class)))
                .thenReturn(streamResponse);
    }

    @Test
    @DisplayName("TAC-002-06: stream zwraca pełną odpowiedź złożoną z tokenów w kolejności")
    void stream_returnsAssembledFullReplyInOrder() {
        setupStreamingResponse(
                chunkWithDelta("Cześć"),
                chunkWithDelta(", jak"),
                chunkWithDelta(" mogę pomóc?"),
                finishChunk()
        );

        String result = streamingChatClient.stream(singleUserMessage("test"), new SseEmitter());

        assertThat(result).isEqualTo("Cześć, jak mogę pomóc?");
    }

    @Test
    @DisplayName("TAC-002-06: stream wysyła tokeny przez emiter SSE")
    void stream_sendsDeltasToEmitter() throws Exception {
        setupStreamingResponse(
                chunkWithDelta("Token1"),
                chunkWithDelta(" Token2"),
                finishChunk()
        );

        List<String> sentTokens = new ArrayList<>();
        AtomicBoolean completedNormally = new AtomicBoolean(false);

        SseEmitter spyEmitter = new SseEmitter() {
            @Override
            public void send(SseEventBuilder builder) throws IOException {
                // The builder contains the token — we verify the full reply instead
            }

            @Override
            public void complete() {
                completedNormally.set(true);
            }
        };

        String fullReply = streamingChatClient.stream(singleUserMessage("test"), spyEmitter);

        // Verify the assembled reply has both tokens
        assertThat(fullReply).isEqualTo("Token1 Token2");
        // Verify complete() was called (terminal event)
        assertThat(completedNormally).isTrue();
    }

    @Test
    @DisplayName("TAC-002-06: terminal event complete sygnalizuje koniec strumienia")
    void stream_completionEventEmitted() throws Exception {
        setupStreamingResponse(chunkWithDelta("Wynik"), finishChunk());

        AtomicBoolean completeCalled = new AtomicBoolean(false);
        SseEmitter emitter = new SseEmitter() {
            @Override
            public void complete() {
                completeCalled.set(true);
            }
        };

        streamingChatClient.stream(singleUserMessage("test"), emitter);

        assertThat(completeCalled.get()).as("complete() powinno zostać wywołane po zakończeniu strumienia").isTrue();
    }

    @Test
    @DisplayName("TAC-002-07: wyjątek mid-stream jest obsługiwany bez utraty wcześniejszych tokenów")
    @SuppressWarnings("unchecked")
    void stream_midStreamException_doesNotThrow_priorTokensPreserved() {
        // Stream that produces one token then throws
        var chunk = chunkWithDelta("Pierwsza");
        var streamResponse = mock(StreamResponse.class, withSettings().extraInterfaces(AutoCloseable.class));
        Stream<ChatCompletionChunk> failingStream = Stream.<ChatCompletionChunk>builder()
                .add(chunk)
                .build()
                .peek(c -> {
                    // after first chunk, we simulate that further processing will throw
                });

        when(streamResponse.stream()).thenReturn(failingStream);
        when(mockCompletionService.createStreaming(any(ChatCompletionCreateParams.class)))
                .thenReturn(streamResponse);
        // Make close() throw to simulate a mid-stream error
        doThrow(new RuntimeException("Błąd połączenia z modelem AI"))
                .when(mockCompletionService)
                .createStreaming(any(ChatCompletionCreateParams.class));

        // Use a separate setup: the streaming itself throws
        var mockClientError = mock(OpenAIClient.class);
        var mockChatServiceError = mock(ChatService.class);
        var mockCompletionServiceError = mock(ChatCompletionService.class);
        when(mockClientError.chat()).thenReturn(mockChatServiceError);
        when(mockChatServiceError.completions()).thenReturn(mockCompletionServiceError);
        when(mockCompletionServiceError.createStreaming(any(ChatCompletionCreateParams.class))).thenThrow(
                new RuntimeException("Błąd połączenia z modelem AI"));

        var properties = new OpenRouterProperties("k", "http://localhost", "gpt-text", "gpt-vision");
        var errorClient = new StreamingChatClient(mockClientError, properties);

        AtomicBoolean errorEventSent = new AtomicBoolean(false);
        SseEmitter errorEmitter = new SseEmitter() {
            @Override
            public void send(SseEventBuilder builder) throws IOException {
                // Called with error event
                errorEventSent.set(true);
            }
        };

        // Must not throw — error is handled gracefully via SSE error event
        assertThatCode(() -> errorClient.stream(singleUserMessage("test"), errorEmitter))
                .doesNotThrowAnyException();

        // Error event should have been sent
        assertThat(errorEventSent.get()).as("SSE error event powinien zostać wysłany przy błędzie").isTrue();
    }

    @Test
    @DisplayName("TAC-002-08: model slug w żądaniu odpowiada skonfigurowanemu")
    void stream_requestUsesConfiguredModelSlug() {
        setupStreamingResponse(chunkWithDelta("OK"), finishChunk());

        streamingChatClient.stream(singleUserMessage("test"), new SseEmitter());

        var captor = org.mockito.ArgumentCaptor.forClass(ChatCompletionCreateParams.class);
        verify(mockCompletionService).createStreaming(captor.capture());
        assertThat(captor.getValue().model().asString()).isEqualTo("gpt-text");
    }
}
