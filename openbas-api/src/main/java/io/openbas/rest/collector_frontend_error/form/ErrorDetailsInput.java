package io.openbas.rest.collector_frontend_error.form;

import lombok.Data;

@Data
public class ErrorDetailsInput {
  private String message;
  private String stack;
  private String timestamp;
}
