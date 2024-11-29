package io.openbas.rest.collector_frontend_error;

import io.openbas.rest.collector_frontend_error.form.ErrorDetailsInput;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/logs")
public class LogApi {

  public static final Logger logger = LoggerFactory.getLogger(LogApi.class);

  @PostMapping("/frontend-error")
  public ResponseEntity<Void> logError(@RequestBody ErrorDetailsInput errorDetails) {
    logger.error("Error received: " + errorDetails);
    return ResponseEntity.ok().build();
  }
}
