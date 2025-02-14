package io.openbas.utils.fixtures.composers;

import io.openbas.database.model.Payload;
import io.openbas.database.repository.PayloadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PayloadComposer extends ComposerBase<Payload> {
  @Autowired PayloadRepository payloadRepository;

  public class Composer extends InnerComposerBase<Payload> {
    private final Payload payload;

    public Composer(Payload payload) {
      this.payload = payload;
    }

    @Override
    public Composer persist() {
      payload.setId(null);
      payloadRepository.save(payload);
      return this;
    }

    @Override
    public Composer delete() {
      payloadRepository.delete(payload);
      return this;
    }

    @Override
    public Payload get() {
      return this.payload;
    }
  }

  public Composer forPayload(Payload payload) {
    this.generatedItems.add(payload);
    return new Composer(payload);
  }
}
