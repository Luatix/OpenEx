package io.openbas.executors.crowdstrike.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResourcesSession {

  private List<CrowdStrikeSession> resources;
}
