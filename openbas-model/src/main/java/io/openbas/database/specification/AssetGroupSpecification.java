package io.openbas.database.specification;

import io.openbas.database.model.AssetGroup;
import jakarta.annotation.Nullable;
import java.util.List;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.domain.Specification;

public class AssetGroupSpecification {

  private AssetGroupSpecification() {}

  public static Specification<AssetGroup> fromIds(@NotNull final List<String> ids) {
    return (root, query, builder) -> root.get("id").in(ids);
  }

  public static Specification<AssetGroup> byName(@Nullable final String searchText) {
    return UtilsSpecification.byName(searchText, "name");
  }
}
