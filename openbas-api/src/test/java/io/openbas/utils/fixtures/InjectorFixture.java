package io.openbas.utils.fixtures;

import io.openbas.database.model.Injector;
import io.openbas.database.repository.InjectorRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class InjectorFixture {
  @Autowired InjectorRepository injectorRepository;

  public static Injector createDefaultInjector() {
    return createInjector(
        UUID.randomUUID().toString(), UUID.randomUUID().toString(), UUID.randomUUID().toString());
  }

  public static Injector createInjector(String id, String name, String type) {
    Injector injector = new Injector();
    injector.setId(id);
    injector.setName(name);
    injector.setType(type);
    injector.setExternal(false);
    injector.setCreatedAt(Instant.now());
    injector.setUpdatedAt(Instant.now());
    return injector;
  }

  public Injector getWellKnownObasImplantInjector() {
    return injectorRepository.findByType("openbas_implant").orElseThrow();
  }
}
