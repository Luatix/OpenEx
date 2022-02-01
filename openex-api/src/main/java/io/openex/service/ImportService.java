package io.openex.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.openex.importer.Importer;
import io.openex.importer.V1_DataImporter;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.transaction.Transactional;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

import static java.io.File.createTempFile;
import static java.time.Instant.now;

@Service
public class ImportService {

    public final static String EXPORT_ENTRY_EXERCISE = "Exercise";
    public final static String EXPORT_ENTRY_ATTACHMENT = "Attachment";

    private final Map<Integer, Importer> dataImporters = new HashMap<>();

    @Resource
    protected ObjectMapper mapper;

    @Autowired
    public void setV1_dataImporter(V1_DataImporter v1_dataImporter) {
        dataImporters.put(1, v1_dataImporter);
    }

    private void handleDataImport(InputStream inputStream, Map<String, ImportEntry> docReferences) throws IOException {
        JsonNode importNode = mapper.readTree(inputStream);
        int importVersion = importNode.get("export_version").asInt();
        Importer importer = dataImporters.get(importVersion);
        if (importer != null) {
            importer.importData(importNode, docReferences);
        } else {
            throw new UnsupportedOperationException("Export with version " + importVersion + " is not supported");
        }
    }

    @Transactional(rollbackOn = Exception.class)
    public void handleFileImport(MultipartFile file) throws Exception {
        // 01. Use a temporary file.
        File tempFile = createTempFile("openex-import-" + now().getEpochSecond(), ".zip");
        FileUtils.copyInputStreamToFile(file.getInputStream(), tempFile);
        // 02. Use this file to load zip with information
        ZipFile zipFile = new ZipFile(tempFile);
        Enumeration<? extends ZipEntry> entries = zipFile.entries();
        // 01. Iter on each document to create it
        List<InputStream> dataImports = new ArrayList<>();
        Map<String, ImportEntry> docReferences = new HashMap<>();
        while (entries.hasMoreElements()) {
            ZipEntry entry = entries.nextElement();
            String entryType = entry.getComment();
            InputStream zipInputStream = zipFile.getInputStream(entry);
            switch (entryType) {
                case EXPORT_ENTRY_EXERCISE -> dataImports.add(zipInputStream);
                case EXPORT_ENTRY_ATTACHMENT -> docReferences.put(entry.getName(), new ImportEntry(entry, zipInputStream));
                default -> throw new UnsupportedOperationException("Cant import type " + entryType);
            }
        }
        // 02. Iter on each element to import
        dataImports.forEach(dataStream -> {
            try {
                handleDataImport(dataStream, docReferences);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
        // 03. Delete the temporary file
        //noinspection ResultOfMethodCallIgnored
        tempFile.delete();
    }
}
