package io.openbas.utils.fixtures.composers;

import io.openbas.database.model.*;
import io.openbas.database.repository.InjectDocumentRepository;
import io.openbas.database.repository.InjectRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class InjectComposer extends ComposerBase<Inject> {
  @Autowired private InjectRepository injectRepository;
  @Autowired private InjectDocumentRepository injectDocumentRepository;

  public class Composer extends InnerComposerBase<Inject> {
    private final Inject inject;
    private Optional<InjectorContractComposer.Composer> injectorContractComposer = Optional.empty();
    private final List<TagComposer.Composer> tagComposers = new ArrayList<>();
    private final List<EndpointComposer.Composer> endpointComposers = new ArrayList<>();
    private Optional<InjectStatusComposer.Composer> injectStatusComposers = Optional.empty();
    private final List<DocumentComposer.Composer> documentComposers = new ArrayList<>();
    private final List<TeamComposer.Composer> teamComposers = new ArrayList<>();

    public Composer(Inject inject) {
      this.inject = inject;
    }

    public Composer withTag(TagComposer.Composer tagComposer) {
      tagComposers.add(tagComposer);
      Set<Tag> tempTags = this.inject.getTags();
      tempTags.add(tagComposer.get());
      this.inject.setTags(tempTags);
      return this;
    }

    public Composer withInjectorContract(
        InjectorContractComposer.Composer injectorContractComposer) {
      this.injectorContractComposer = Optional.of(injectorContractComposer);
      this.inject.setInjectorContract(injectorContractComposer.get());
      return this;
    }

    public Composer withDocument(DocumentComposer.Composer documentComposer) {
      this.documentComposers.add(documentComposer);
      List<InjectDocument> tempDocs = this.inject.getDocuments();
      InjectDocument newDoc = new InjectDocument();
      newDoc.setDocument(documentComposer.get());
      newDoc.setInject(this.inject);
      tempDocs.add(newDoc);
      this.inject.setDocuments(tempDocs);
      return this;
    }

    public Composer withTeam(TeamComposer.Composer teamComposer) {
      this.teamComposers.add(teamComposer);
      List<Team> tempTeams = this.inject.getTeams();
      tempTeams.add(teamComposer.get());
      this.inject.setTeams(tempTeams);
      return this;
    }

    public Composer withId(String id) {
      this.inject.setId(id);
      return this;
    }

    public Composer withInjectStatus(InjectStatusComposer.Composer injectStatus) {
      injectStatusComposers = Optional.of(injectStatus);
      injectStatus.get().setInject(this.inject);
      this.inject.setStatus(injectStatus.get());
      return this;
    }

    public Composer withEndpoint(EndpointComposer.Composer endpointComposer) {
      endpointComposers.add(endpointComposer);
      List<Asset> assets = inject.getAssets();
      assets.add(endpointComposer.get());
      this.inject.setAssets(assets);
      return this;
    }

    @Override
    public Composer persist() {
      endpointComposers.forEach(EndpointComposer.Composer::persist);
      injectStatusComposers.ifPresent(InjectStatusComposer.Composer::persist);
      tagComposers.forEach(TagComposer.Composer::persist);
      teamComposers.forEach(TeamComposer.Composer::persist);
      documentComposers.forEach(DocumentComposer.Composer::persist);
      this.injectorContractComposer.ifPresent(
          composer -> {
            composer.persist();
            this.inject.setContent(composer.getInjectContent());
          });
      injectRepository.save(inject);
      injectDocumentRepository.saveAll(inject.getDocuments());
      return this;
    }

    @Override
    public Composer delete() {
      injectDocumentRepository.deleteAll(inject.getDocuments());
      injectRepository.delete(inject);
      documentComposers.forEach(DocumentComposer.Composer::delete);
      tagComposers.forEach(TagComposer.Composer::delete);
      endpointComposers.forEach(EndpointComposer.Composer::delete);
      injectStatusComposers.ifPresent(InjectStatusComposer.Composer::delete);
      teamComposers.forEach(TeamComposer.Composer::delete);
      injectorContractComposer.ifPresent(InjectorContractComposer.Composer::delete);
      documentComposers.forEach(DocumentComposer.Composer::delete);
      return this;
    }

    @Override
    public Inject get() {
      return this.inject;
    }
  }

  public Composer forInject(Inject inject) {
    generatedItems.add(inject);
    return new Composer(inject);
  }
}
