package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Transient;
import org.springframework.beans.BeanUtils;

public interface Base {
  String getId();

  void setId(String id);

  default boolean isUserHasAccess(final boolean isAdmin) {
    return isAdmin;
  }

  default boolean isUserHasAccess(User user) {
    return this.isUserHasAccess(user.isAdmin());
  }

  @JsonIgnore
  @Transient
  default void setUpdateAttributes(Object input) {
    BeanUtils.copyProperties(input, this);
  }

  @Schema(hidden = true)
  default boolean isListened() {
    return true;
  }
}
