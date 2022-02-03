package io.openex.rest.stream;

import io.openex.config.SessionManager;
import io.openex.database.audit.BaseEvent;
import io.openex.database.model.User;
import io.openex.rest.helper.RestBehavior;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import javax.annotation.Resource;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static io.openex.config.AppConfig.currentUser;
import static java.time.Instant.now;

@RestController
public class StreamApi extends RestBehavior {

    public static final String EVENT_TYPE_MESSAGE = "message";
    public static final String EVENT_TYPE_PING = "ping";
    public static final String X_ACCEL_BUFFERING = "X-Accel-Buffering";

    @Resource
    private SessionManager sessionManager;

    private final Map<String, Tuple2<User, FluxSink<Object>>> consumers = new HashMap<>();

    @EventListener
    public void listenDatabaseUpdate(BaseEvent event) {
        consumers.entrySet().stream()
                .filter(entry -> sessionManager.isSessionAvailable(entry.getKey()))
                .parallel().forEach(entry -> {
                    Tuple2<User, FluxSink<Object>> tupleFlux = entry.getValue();
                    User listener = tupleFlux.getT1();
                    if (event.isUserObserver(listener)) {
                        ServerSentEvent<BaseEvent> message = ServerSentEvent.builder(event)
                                .event(EVENT_TYPE_MESSAGE).build();
                        tupleFlux.getT2().next(message);
                    }
                });
    }

    @GetMapping(path = "/api/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<Object>> streamFlux() {
        User user = currentUser();
        String sessionId = RequestContextHolder.currentRequestAttributes().getSessionId();
        // Build the database event flux.
        Flux<Object> dataFlux = Flux.create(fluxSinkConsumer -> consumers.put(sessionId, Tuples.of(user, fluxSinkConsumer)))
                .doAfterTerminate(() -> consumers.remove(sessionId));
        // Build the health check flux.
        Flux<Object> ping = Flux.interval(Duration.ofSeconds(1))
                .map(l -> ServerSentEvent.builder(now().getEpochSecond()).event(EVENT_TYPE_PING).build());
        // Merge the 2 flux to create the final one.
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .header(X_ACCEL_BUFFERING, "no")
                .body(Flux.merge(dataFlux, ping));
    }
}
