package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.helper.MonoIdDeserializer;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import java.util.Optional;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@DiscriminatorValue(FileDrop.FILE_DROP_TYPE)
@EntityListeners(ModelBaseListener.class)
public class FileDrop extends Payload {

  public static final String FILE_DROP_TYPE = "FileDrop";

  @JsonProperty("payload_type")
  private String type = FILE_DROP_TYPE;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "file_drop_file")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("file_drop_file")
  @Schema(type = "string")
  private Document fileDropFile;

  public FileDrop() {}

  public FileDrop(String id, String type, String name) {
    super(id, type, name);
  }

  @Override
  @JsonIgnore
  public String getExpectationSignatureValue() {
    return Optional.ofNullable(fileDropFile).map(Document::getName).orElse("");
  }
}
