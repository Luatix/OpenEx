package io.openbas.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.METHOD})
public @interface Queryable {
  boolean searchable() default false;

  boolean filterable() default false;

  boolean dynamicValues() default false;

  boolean sortable() default false;

  String path() default "";

  String[] paths() default {};

  Class clazz() default String.class;
}
