package io.openbas.utils.fixtures.composers;

import io.openbas.database.model.Document;
import io.openbas.database.model.Tag;
import io.openbas.database.repository.DocumentRepository;
import io.openbas.service.FileService;
import io.openbas.utils.fixtures.files.BaseFile;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class DocumentComposer extends ComposerBase<Document> {
  @Autowired private DocumentRepository documentRepository;
  @Autowired private FileService fileService;

  public class Composer extends InnerComposerBase<Document> {
    private final Document document;
    private BaseFile<?> companionFile = null;
    private final List<TagComposer.Composer> tagComposers = new ArrayList<>();

    public Composer(Document document) {
      this.document = document;
    }

    public Composer withTag(TagComposer.Composer tagComposer) {
      tagComposers.add(tagComposer);
      Set<Tag> tempTags = this.document.getTags();
      tempTags.add(tagComposer.get());
      this.document.setTags(tempTags);
      return this;
    }

    public Composer withId(String id) {
      this.document.setId(id);
      return this;
    }

    public Composer withInMemoryFile(BaseFile<?> file) {
      document.setTarget(file.getFileName());
      companionFile = file;
      return this;
    }

    @SneakyThrows // the method might throw if the target file does not exist
    @Override
    public Composer persist() {
      this.tagComposers.forEach(TagComposer.Composer::persist);
      if (companionFile != null) {
        try (ByteArrayInputStream bais =
            new ByteArrayInputStream(companionFile.getContentBytes())) {
          MultipartFile mmf = new MockMultipartFile(document.getTarget(), bais.readAllBytes());
          fileService.uploadFile(
              document.getTarget(), mmf.getInputStream(), mmf.getSize(), document.getType());
        }
      }
      documentRepository.save(document);
      return this;
    }

    @Override
    public Composer delete() {
      documentRepository.delete(document);
      this.tagComposers.forEach(TagComposer.Composer::delete);
      return this;
    }

    @Override
    public Document get() {
      return this.document;
    }
  }

  public Composer forDocument(Document document) {
    generatedItems.add(document);
    return new Composer(document);
  }
}
