package io.openbas.utils.fixtures.files;

import lombok.Getter;

@Getter
public abstract class BaseFile<T> {
  private final T content;
  private final String fileName;

  public BaseFile(T content, String fileName) {
    this.content = content;
    this.fileName = fileName;
  }

  public abstract String getMimeType();

  public abstract byte[] getContentBytes();

  public int getContentLength() {
    return getContentBytes().length;
  }
}
