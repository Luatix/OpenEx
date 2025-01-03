package io.openbas.rest.tag_rule.form;

import io.openbas.database.model.Asset;
import io.openbas.database.model.TagRule;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class TagRuleMapper {
  public TagRuleOutput toTagRuleOutput(final TagRule tagRule) {
    return TagRuleOutput.builder()
        .id(tagRule.getId())
        .tagName(tagRule.getTag().getName())
        .assets(
            tagRule.getAssets().stream().collect(Collectors.toMap(Asset::getId, Asset::getName)))
        .build();
  }
}
