package io.openbas.rest.log.form;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LogDetailsInput {

  private String message;
  private String stack;
  private String timestamp;
  private String level;
}
