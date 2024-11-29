package io.openbas.rest.collector_frontend_error.form;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ErrorDetailsInput {

  private String message;
  private String stack;
  private String timestamp;
}
