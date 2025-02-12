package io.openbas.utils.fixtures;

import static java.util.Map.entry;

import io.openbas.utils.fixtures.files.BaseFile;
import io.openbas.utils.fixtures.files.BinaryFile;
import io.openbas.utils.fixtures.files.PlainTextFile;
import java.util.HexFormat;
import java.util.Map;

public class FileFixture {
  public static String DEFAULT_PLAIN_TEXT_FILENAME = "plain_text.txt";
  public static String DEFAULT_PNG_FILENAME = "grid.png";

  public static Map<String, BaseFile<?>> WELL_KNOWN_FILES =
      Map.ofEntries(
          entry(DEFAULT_PLAIN_TEXT_FILENAME, getPlainTextFileContent()),
          entry(DEFAULT_PNG_FILENAME, getPngFileContent()));

  public static PlainTextFile getPlainTextFileContent() {
    return new PlainTextFile("default plain text content", DEFAULT_PLAIN_TEXT_FILENAME);
  }

  // a small 16*16 black and white pixel grid
  public static BinaryFile getPngFileContent() {
    String hexData =
        "89504e470d0a1a0a0000000d49484452000000100000001010000000006a087cfe000000184944415428cf636060f8ff1f2f2620cdc0306ac2303201000979ff01ee7eef0a0000000049454e44ae426082";
    String filename = DEFAULT_PNG_FILENAME;
    return new BinaryFile(HexFormat.of().parseHex(hexData), filename);
  }
}
