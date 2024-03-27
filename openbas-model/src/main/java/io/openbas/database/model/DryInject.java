package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.helper.MonoIdDeserializer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.Comparator;
import java.util.Objects;
import java.util.Optional;

import static java.util.Optional.of;
import static java.util.Optional.ofNullable;

@Entity
@Table(name = "dryinjects")
@EntityListeners(ModelBaseListener.class)
public class DryInject implements Base, Injection {

  public static final Comparator<DryInject> executionComparator = Comparator.comparing(o -> o.getDate().orElseThrow());

  @Getter
  @Setter
  @Id
  @Column(name = "dryinject_id")
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @JsonProperty("dryinject_id")
  private String id;

  @Setter
  @Column(name = "dryinject_date")
  @JsonProperty("dryinject_date")
  private Instant date;

  @Getter
  @Setter
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "dryinject_dryrun")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("dryinject_dryrun")
  private Dryrun run;

  @Getter
  @Setter
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "dryinject_inject")
  @JsonProperty("dryinject_inject")
  private Inject inject;

  // CascadeType.ALL is required here because dry inject status are embedded
  @Getter
  @Setter
  @OneToOne(mappedBy = "dryInject", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonProperty("dryinject_status")
  private DryInjectStatus status;

  @Override
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("dryinject_exercise")
  public Exercise getExercise() {
    return getInject().getExercise();
  }

  public Optional<DryInjectStatus> getStatus() {
    return ofNullable(this.status);
  }

  @Override
  public Optional<Instant> getDate() {
    return of(date);
  }

  public boolean isUserHasAccess(User user) {
    return getExercise().isUserHasAccess(user);
  }

  @Override
  public boolean equals(Object o) {
      if (this == o) {
          return true;
      }
      if (o == null || !Base.class.isAssignableFrom(o.getClass())) {
          return false;
      }
    Base base = (Base) o;
    return id.equals(base.getId());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
