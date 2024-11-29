package io.openbas.rest.collector_frontend_error;

import io.openbas.rest.collector_frontend_error.form.ErrorDetailsInput;
import io.openbas.rest.helper.RestBehavior;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LogApi extends RestBehavior {

  public static final Logger logger = LoggerFactory.getLogger(LogApi.class);

  @PostMapping("/api/logs/frontend-error")
  public void logError(@RequestBody ErrorDetailsInput errorDetails) {
    logger.error(
        "Message error received: {} stacktrace: {} at {}",
        errorDetails.getMessage(),
        errorDetails.getStack(),
        errorDetails.getTimestamp());
  }
}
