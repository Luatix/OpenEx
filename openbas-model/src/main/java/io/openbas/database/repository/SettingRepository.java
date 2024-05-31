package io.openbas.database.repository;

import io.openbas.database.model.Setting;
import io.openbas.database.model.SettingKeys.Module;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SettingRepository extends CrudRepository<Setting, String>, JpaSpecificationExecutor<Setting> {

    @NotNull
    Optional<Setting> findById(@NotNull String id);

    Optional<Setting> findByKey(String key);

    List<Setting> findByType(Module type);

    @Query(value = "SHOW server_version", nativeQuery = true)
    String getServerVersion();
}
