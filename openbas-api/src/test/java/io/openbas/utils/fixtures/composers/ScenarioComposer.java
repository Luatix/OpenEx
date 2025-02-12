package io.openbas.utils.fixtures.composers;

import io.openbas.database.model.Article;
import io.openbas.database.model.Inject;
import io.openbas.database.model.Scenario;
import io.openbas.database.repository.ScenarioRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ScenarioComposer extends ComposerBase<Scenario> {
  @Autowired private ScenarioRepository scenarioRepository;

  public class Composer extends InnerComposerBase<Scenario> {
    private final Scenario scenario;
    private final List<InjectComposer.Composer> injectComposers = new ArrayList<>();
    private final List<ArticleComposer.Composer> articleComposers = new ArrayList<>();

    public Composer(Scenario scenario) {
      this.scenario = scenario;
    }

    public Composer withInject(InjectComposer.Composer injectComposer) {
      injectComposers.add(injectComposer);
      Set<Inject> tempInjects = new HashSet<>(this.scenario.getInjects());
      injectComposer.get().setScenario(scenario);
      tempInjects.add(injectComposer.get());
      this.scenario.setInjects(tempInjects);
      return this;
    }

    public Composer withArticle(ArticleComposer.Composer articleComposer) {
      articleComposers.add(articleComposer);
      List<Article> tempArticles = new ArrayList<>(this.scenario.getArticles());
      articleComposer.get().setScenario(scenario);
      tempArticles.add(articleComposer.get());
      this.scenario.setArticles(tempArticles);
      return this;
    }

    @Override
    public Composer persist() {
      injectComposers.forEach(InjectComposer.Composer::persist);
      scenarioRepository.save(scenario);
      return this;
    }

    @Override
    public Composer delete() {
      injectComposers.forEach(InjectComposer.Composer::delete);
      scenarioRepository.delete(scenario);
      return this;
    }

    @Override
    public Scenario get() {
      return this.scenario;
    }
  }

  public Composer forScenario(Scenario scenario) {
    this.generatedItems.add(scenario);
    return new Composer(scenario);
  }
}
