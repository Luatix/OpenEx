package io.openbas.executors;

import static io.openbas.service.FileService.EXECUTORS_IMAGES_BASE_PATH;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.openbas.database.model.Executor;
import io.openbas.database.repository.ExecutorRepository;
import io.openbas.service.FileService;
import jakarta.annotation.Resource;
import jakarta.transaction.Transactional;
import java.io.InputStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ExecutorService {

  @Resource protected ObjectMapper mapper;

  private FileService fileService;

  private ExecutorRepository executorRepository;

  @Resource
  public void setFileService(FileService fileService) {
    this.fileService = fileService;
  }

  @Autowired
  public void setExecutorRepository(ExecutorRepository executorRepository) {
    this.executorRepository = executorRepository;
  }

  @Transactional
  public Executor register(
      String id,
      String type,
      String name,
      String documentationUrl,
      InputStream iconData,
      String[] platforms)
      throws Exception {
    // Sanity checks
    if (id == null || id.isEmpty()) {
      throw new IllegalArgumentException("Executor ID must not be null or empty.");
    }

    if (iconData != null) {
      fileService.uploadStream(EXECUTORS_IMAGES_BASE_PATH, type + ".png", iconData);
    }
    Executor executor = executorRepository.findById(id).orElse(null);
    if (executor == null) {
      Executor executorChecking = executorRepository.findByType(type).orElse(null);
      if (executorChecking != null) {
        throw new Exception(
            "The executor "
                + type
                + " already exists with a different ID, please delete it or contact your administrator.");
      }

      executor = new Executor();
      executor.setId(id);
    }

    executor.setName(name);
    executor.setType(type);
    executor.setDoc(documentationUrl);
    executor.setPlatforms(platforms);

    executorRepository.save(executor);
    return executor;
  }

  @Transactional
  public void remove(String id) {
    executorRepository.findById(id).ifPresent(executor -> executorRepository.deleteById(id));
  }

  @Transactional
  public void removeFromType(String type) {
    executorRepository
        .findByType(type)
        .ifPresent(executor -> executorRepository.deleteById(executor.getId()));
  }
}
