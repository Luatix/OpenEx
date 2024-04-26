package io.openbas.asset;

import io.openbas.database.model.Endpoint;
import io.openbas.database.repository.EndpointRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static io.openbas.helper.StreamHelper.fromIterable;
import static java.time.Instant.now;

@RequiredArgsConstructor
@Service
public class EndpointService {

  private final EndpointRepository endpointRepository;

  public Endpoint createEndpoint(@NotNull final Endpoint endpoint) {
    return this.endpointRepository.save(endpoint);
  }

  public Iterable<Endpoint> createEndpoints(@NotNull final List<Endpoint> endpoints) {
    return this.endpointRepository.saveAll(endpoints);
  }

  public Endpoint endpoint(@NotBlank final String endpointId) {
    return this.endpointRepository.findById(endpointId).orElseThrow();
  }

  @Transactional(readOnly = true)
  public List<Endpoint> findBySourceAndHostname(
      @NotBlank final String sourceKey,
      @NotBlank final String hostname) {
    return this.endpointRepository.findBySourceAndHostname(sourceKey, hostname);
  }

  public List<Endpoint> endpoints() {
    return fromIterable(this.endpointRepository.findAll());
  }

  public List<Endpoint> endpoints(@NotNull final Specification<Endpoint> specification) {
    return fromIterable(this.endpointRepository.findAll(specification));
  }

  public Endpoint updateEndpoint(@NotNull final Endpoint endpoint) {
    endpoint.setUpdatedAt(now());
    return this.endpointRepository.save(endpoint);
  }

  public Iterable<Endpoint> updateEndpoints(@NotNull final List<Endpoint> endpoints) {
    endpoints.forEach((e) -> e.setUpdatedAt(now()));
    return this.endpointRepository.saveAll(endpoints);
  }

  public void deleteEndpoint(@NotBlank final String endpointId) {
    this.endpointRepository.deleteById(endpointId);
  }

}
