package io.openbas.utils.fixtures.files;

public class PlainTextFile extends BaseFile<String> {
  public PlainTextFile(String content, String fileName) {
    super(content, fileName);
  }

  @Override
  public String getMimeType() {
    return "text/plain";
  }

  @Override
  public byte[] getContentBytes() {
    return getContent().getBytes();
  }
}
