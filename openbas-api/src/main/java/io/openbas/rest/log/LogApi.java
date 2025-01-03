package io.openbas.rest.log;

import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.log.form.LogDetailsInput;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LogApi extends RestBehavior {

  public static final Logger logger = LoggerFactory.getLogger(LogApi.class);

  @PostMapping("/api/logs")
  public void logDetails(@RequestBody LogDetailsInput logDetailsInput) {
    switch (logDetailsInput.getLevel()) {
      case "WARN":
        logger.warn(
            "Message warn received: "
                + logDetailsInput.getMessage()
                + "stacktrace: "
                + logDetailsInput.getStack());
        break;
      case "INFO":
        logger.info(
            "Message info received: "
                + logDetailsInput.getMessage()
                + "stacktrace: "
                + logDetailsInput.getStack());
        break;
      case "DEBUG":
        logger.debug(
            "Message debug received: "
                + logDetailsInput.getMessage()
                + "stacktrace: "
                + logDetailsInput.getStack());
        break;
      default:
        logger.error(
            "Message error received: "
                + logDetailsInput.getMessage()
                + "stacktrace: "
                + logDetailsInput.getStack());
        break;
    }
  }
}
