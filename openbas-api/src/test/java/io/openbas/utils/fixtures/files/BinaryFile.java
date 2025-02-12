package io.openbas.utils.fixtures.files;

public class BinaryFile extends BaseFile<byte[]> {
  public BinaryFile(byte[] data, String name) {
    super(data, name);
  }

  @Override
  public String getMimeType() {
    return "image/png";
  }

  @Override
  public byte[] getContentBytes() {
    return getContent();
  }
}
