package io.openex.rest.exercise;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.openex.database.model.*;
import io.openex.database.model.Exercise.STATUS;
import io.openex.database.repository.*;
import io.openex.database.specification.ComcheckSpecification;
import io.openex.database.specification.DryRunSpecification;
import io.openex.database.specification.ExerciseLogSpecification;
import io.openex.rest.exception.InputValidationException;
import io.openex.rest.exercise.exports.ExerciseExportMixins;
import io.openex.rest.exercise.exports.ExerciseFileExport;
import io.openex.rest.exercise.form.*;
import io.openex.rest.helper.RestBehavior;
import io.openex.service.DryrunService;
import io.openex.service.FileService;
import io.openex.service.ImportService;
import io.openex.service.InjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.util.function.Tuples;

import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletResponse;
import javax.transaction.Transactional;
import javax.validation.Valid;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static io.openex.config.AppConfig.currentUser;
import static io.openex.database.model.Exercise.STATUS.*;
import static io.openex.database.model.User.ROLE_ADMIN;
import static io.openex.database.model.User.ROLE_USER;
import static io.openex.service.ImportService.EXPORT_ENTRY_ATTACHMENT;
import static io.openex.service.ImportService.EXPORT_ENTRY_EXERCISE;
import static java.time.Duration.between;
import static java.time.Instant.now;
import static java.time.temporal.ChronoUnit.MINUTES;

@RestController
@RolesAllowed(ROLE_USER)
public class ExerciseApi extends RestBehavior {

    // region repositories
    private LogRepository logRepository;
    private TagRepository tagRepository;
    private UserRepository userRepository;
    private PauseRepository pauseRepository;
    private GroupRepository groupRepository;
    private GrantRepository grantRepository;
    private DocumentRepository documentRepository;
    private ExerciseRepository exerciseRepository;
    private LogRepository exerciseLogRepository;
    private DryRunRepository dryRunRepository;
    private ComcheckRepository comcheckRepository;
    private ImportService importService;
    private InjectRepository injectRepository;
    // endregion

    // region services
    private DryrunService dryrunService;
    private FileService fileService;
    private InjectService injectService;
    // endregion

    // region setters
    @Autowired
    public void setInjectService(InjectService injectService) {
        this.injectService = injectService;
    }

    @Autowired
    public void setImportService(ImportService importService) {
        this.importService = importService;
    }

    @Autowired
    public void setLogRepository(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired
    public void setPauseRepository(PauseRepository pauseRepository) {
        this.pauseRepository = pauseRepository;
    }

    @Autowired
    public void setGrantRepository(GrantRepository grantRepository) {
        this.grantRepository = grantRepository;
    }

    @Autowired
    public void setGroupRepository(GroupRepository groupRepository) {
        this.groupRepository = groupRepository;
    }

    @Autowired
    public void setDryrunService(DryrunService dryrunService) {
        this.dryrunService = dryrunService;
    }

    @Autowired
    public void setInjectRepository(InjectRepository injectRepository) {
        this.injectRepository = injectRepository;
    }

    @Autowired
    public void setFileService(FileService fileService) {
        this.fileService = fileService;
    }

    @Autowired
    public void setTagRepository(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Autowired
    public void setDocumentRepository(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @Autowired
    public void setComcheckRepository(ComcheckRepository comcheckRepository) {
        this.comcheckRepository = comcheckRepository;
    }

    @Autowired
    public void setDryRunRepository(DryRunRepository dryRunRepository) {
        this.dryRunRepository = dryRunRepository;
    }

    @Autowired
    public void setExerciseLogRepository(LogRepository exerciseLogRepository) {
        this.exerciseLogRepository = exerciseLogRepository;
    }

    @Autowired
    public void setExerciseRepository(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }
    // endregion

    // region logs
    @GetMapping("/api/exercises/{exercise}/logs")
    public Iterable<Log> logs(@PathVariable String exercise) {
        return exerciseLogRepository.findAll(ExerciseLogSpecification.fromExercise(exercise));
    }

    @PostMapping("/api/exercises/{exerciseId}/logs")
    public Log createLog(@PathVariable String exerciseId,
                         @Valid @RequestBody LogCreateInput input) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        Log log = new Log();
        log.setUpdateAttributes(input);
        log.setExercise(exercise);
        log.setTags(fromIterable(tagRepository.findAllById(input.getTagIds())));
        log.setUser(currentUser());
        return exerciseLogRepository.save(log);
    }

    @PutMapping("/api/exercises/{exerciseId}/logs/{logId}")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public Log updateLog(@PathVariable String logId,
                         @Valid @RequestBody LogCreateInput input) {
        Log log = logRepository.findById(logId).orElseThrow();
        log.setUpdateAttributes(input);
        log.setTags(fromIterable(tagRepository.findAllById(input.getTagIds())));
        return logRepository.save(log);
    }

    @DeleteMapping("/api/exercises/{exerciseId}/logs/{logId}")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public void deleteLog(@PathVariable String logId) {
        logRepository.deleteById(logId);
    }
    // endregion

    // region dryruns
    @GetMapping("/api/exercises/{exerciseId}/dryruns")
    public Iterable<Dryrun> dryruns(@PathVariable String exerciseId) {
        return dryRunRepository.findAll(DryRunSpecification.fromExercise(exerciseId));
    }

    @PostMapping("/api/exercises/{exerciseId}/dryruns")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public Dryrun createDryrun(@PathVariable String exerciseId,
                               @Valid @RequestBody DryrunCreateInput input) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        List<String> userIds = input.getUserIds();
        List<User> users = userIds.size() == 0 ?
                List.of(currentUser()) : fromIterable(userRepository.findAllById(userIds));
        return dryrunService.provisionDryrun(exercise, users);
    }

    @GetMapping("/api/exercises/{exerciseId}/dryruns/{dryrunId}")
    @PostAuthorize("isExerciseObserver(#exerciseId)")
    public Dryrun dryrun(@PathVariable String exerciseId,
                         @PathVariable String dryrunId) {
        Specification<Dryrun> filters = DryRunSpecification
                .fromExercise(exerciseId).and(DryRunSpecification.id(dryrunId));
        return dryRunRepository.findOne(filters).orElseThrow();
    }

    @DeleteMapping("/api/exercises/{exerciseId}/dryruns/{dryrunId}")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public void deleteDryrun(@PathVariable String exerciseId, @PathVariable String dryrunId) {
        dryRunRepository.deleteById(dryrunId);
    }

    @GetMapping("/api/exercises/{exerciseId}/dryruns/{dryrunId}/dryinjects")
    @PostAuthorize("isExerciseObserver(#exerciseId)")
    public List<DryInject> dryrunInjects(@PathVariable String exerciseId,
                                         @PathVariable String dryrunId) {
        return dryrun(exerciseId, dryrunId).getInjects();
    }
    // endregion

    // region comchecks
    @GetMapping("/api/exercises/{exercise}/comchecks")
    public Iterable<Comcheck> comchecks(@PathVariable String exercise) {
        return comcheckRepository.findAll(ComcheckSpecification.fromExercise(exercise));
    }

    @GetMapping("/api/exercises/{exercise}/comchecks/{comcheck}")
    public Comcheck comcheck(@PathVariable String exercise,
                             @PathVariable String comcheck) {
        Specification<Comcheck> filters = ComcheckSpecification
                .fromExercise(exercise).and(ComcheckSpecification.id(comcheck));
        return comcheckRepository.findOne(filters).orElseThrow();
    }

    @GetMapping("/api/exercises/{exercise}/comchecks/{comcheck}/statuses")
    public List<ComcheckStatus> comcheckStatuses(@PathVariable String exercise,
                                                 @PathVariable String comcheck) {
        return comcheck(exercise, comcheck).getComcheckStatus();
    }
    // endregion

    // region exercises
    @Transactional
    @PostMapping("/api/exercises")
    public Exercise createExercise(@Valid @RequestBody ExerciseCreateInput input) {
        Exercise exercise = new Exercise();
        exercise.setUpdateAttributes(input);
        exercise.setTags(fromIterable(tagRepository.findAllById(input.getTagIds())));
        // Find automatic groups to grants
        List<Group> groups = fromIterable(groupRepository.findAll());
        List<Grant> grants = groups.stream()
                .filter(group -> group.getExercisesDefaultGrants().size() > 0)
                .flatMap(group -> group.getExercisesDefaultGrants().stream().map(s -> Tuples.of(group, s)))
                .map(tuple -> {
                    Grant grant = new Grant();
                    grant.setGroup(tuple.getT1());
                    grant.setName(tuple.getT2());
                    grant.setExercise(exercise);
                    return grant;
                }).toList();
        if (grants.size() > 0) {
            Iterable<Grant> exerciseGrants = grantRepository.saveAll(grants);
            exercise.setGrants(fromIterable(exerciseGrants));
        }
        return exerciseRepository.save(exercise);
    }

    @PutMapping("/api/exercises/{exerciseId}")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public Exercise updateExerciseInformation(@PathVariable String exerciseId,
                                              @Valid @RequestBody ExerciseUpdateInput input) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        exercise.setUpdateAttributes(input);
        return exerciseRepository.save(exercise);
    }

    @PutMapping("/api/exercises/{exerciseId}/start_date")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public Exercise updateExerciseStart(@PathVariable String exerciseId,
                                        @Valid @RequestBody ExerciseUpdateStartDateInput input) throws InputValidationException {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        if (!exercise.getStatus().equals(SCHEDULED)) {
            String message = "Change date is only possible in scheduling state";
            throw new InputValidationException("exercise_start_date", message);
        }
        exercise.setUpdateAttributes(input);
        return exerciseRepository.save(exercise);
    }

    @PutMapping("/api/exercises/{exerciseId}/tags")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public Exercise updateExerciseTags(@PathVariable String exerciseId,
                                       @Valid @RequestBody ExerciseUpdateTagsInput input) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        exercise.setTags(fromIterable(tagRepository.findAllById(input.getTagIds())));
        return exerciseRepository.save(exercise);
    }

    @PutMapping("/api/exercises/{exerciseId}/image")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public Exercise updateExerciseImage(@PathVariable String exerciseId,
                                        @Valid @RequestBody ExerciseUpdateImageInput input) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        exercise.setImage(documentRepository.findById(input.getImageId()).orElse(null));
        return exerciseRepository.save(exercise);
    }

    @DeleteMapping("/api/exercises/{exerciseId}")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public void deleteExercise(@PathVariable String exerciseId) {
        exerciseRepository.deleteById(exerciseId);
    }

    @GetMapping("/api/exercises/{exerciseId}")
    @PostAuthorize("isExerciseObserver(#exerciseId)")
    public Exercise exercise(@PathVariable String exerciseId) {
        return exerciseRepository.findById(exerciseId).orElseThrow();
    }

    @Transactional
    @DeleteMapping("/api/exercises/{exerciseId}/{documentId}")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public Exercise deleteDocument(@PathVariable String exerciseId, @PathVariable String documentId) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        exercise.setUpdatedAt(now());
        Document doc = documentRepository.findById(documentId).orElseThrow();
        List<Exercise> docExercises = doc.getExercises().stream()
                .filter(ex -> !ex.getId().equals(exerciseId)).toList();
        if (docExercises.size() == 0) {
            // Document is no longer associate to any exercise, delete it
            documentRepository.delete(doc);
            // All associations with this document will be automatically cleanup.
        } else {
            // Document associated to other exercise, cleanup
            doc.setExercises(docExercises);
            documentRepository.save(doc);
            // Delete document from all exercise injects
            injectService.cleanInjectsDocExercise(exerciseId, documentId);
        }
        return exerciseRepository.save(exercise);
    }

    @Transactional
    @PutMapping("/api/exercises/{exerciseId}/status")
    @PostAuthorize("isExercisePlanner(#exerciseId)")
    public Exercise changeExerciseStatus(@PathVariable String exerciseId,
                                         @Valid @RequestBody ExerciseUpdateStatusInput input) {
        STATUS status = input.getStatus();
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        // Check if next status is possible
        List<STATUS> nextPossibleStatus = exercise.nextPossibleStatus();
        if (!nextPossibleStatus.contains(status)) {
            throw new UnsupportedOperationException("Exercise cant support moving to status " + status.name());
        }
        // In case of rescheduled of an exercise.
        boolean isCloseState = CANCELED.equals(exercise.getStatus()) || FINISHED.equals(exercise.getStatus());
        if (isCloseState && SCHEDULED.equals(status)) {
            exercise.setStart(null);
            exercise.setEnd(null);
            // Reset pauses
            exercise.setCurrentPause(null);
            pauseRepository.deleteAll(pauseRepository.findAllForExercise(exerciseId));
            // Reset injects status and outcome
            injectRepository.saveAll(injectRepository.findAllForExercise(exerciseId)
                    .stream().peek(Inject::clean).toList());
        }
        // In case of manual start
        if (SCHEDULED.equals(exercise.getStatus()) && RUNNING.equals(status)) {
            Instant nextMinute = now().truncatedTo(MINUTES).plus(1, MINUTES);
            exercise.setStart(nextMinute);
        }
        // If exercise move from pause to running state,
        // we log the pause date to be able to recompute inject dates.
        if (PAUSED.equals(exercise.getStatus()) && RUNNING.equals(status)) {
            Instant lastPause = exercise.getCurrentPause().orElseThrow();
            exercise.setCurrentPause(null);
            Pause pause = new Pause();
            pause.setDate(lastPause);
            pause.setExercise(exercise);
            pause.setDuration(between(lastPause, now()).getSeconds());
            pauseRepository.save(pause);
        }
        // If pause is asked, just set the pause date.
        if (RUNNING.equals(exercise.getStatus()) && PAUSED.equals(status)) {
            exercise.setCurrentPause(Instant.now());
        }
        exercise.setUpdatedAt(now());
        exercise.setStatus(status);
        return exerciseRepository.save(exercise);
    }

    @GetMapping("/api/exercises")
    @RolesAllowed(ROLE_USER)
    public Iterable<Exercise> exercises() {
        return currentUser().isAdmin() ?
                exerciseRepository.findAll() :
                exerciseRepository.findAllGranted(currentUser().getId());
    }
    // endregion

    // region import/export
    @GetMapping("/api/exercises/{exerciseId}/export")
    @PostAuthorize("isExerciseObserver(#exerciseId)")
    public void exerciseExport(@PathVariable String exerciseId,
                               @RequestParam(required = false) boolean isWithPlayers,
                               HttpServletResponse response) throws IOException {
        // Setup the mapper for export
        ObjectMapper objectMapper = mapper.copy();
        if (!isWithPlayers) {
            objectMapper.addMixIn(ExerciseFileExport.class, ExerciseExportMixins.ExerciseFileExport.class);
        }
        // Start exporting exercise
        ExerciseFileExport importExport = new ExerciseFileExport();
        importExport.setVersion(1);
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        objectMapper.addMixIn(Exercise.class, ExerciseExportMixins.Exercise.class);
        // Build the response
        String zipName = exercise.getName() + "_" + now().toString() + ".zip";
        response.addHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + zipName);
        response.addHeader(HttpHeaders.CONTENT_TYPE, "application/zip");
        response.setStatus(HttpServletResponse.SC_OK);
        // Build the export
        importExport.setExercise(exercise);
        List<Tag> exerciseTags = new ArrayList<>(exercise.getTags());
        // Objectives
        List<Objective> objectives = exercise.getObjectives();
        importExport.setObjectives(objectives);
        objectMapper.addMixIn(Objective.class, ExerciseExportMixins.Objective.class);
        // Polls
        List<Poll> polls = exercise.getPolls();
        importExport.setPolls(polls);
        objectMapper.addMixIn(Poll.class, ExerciseExportMixins.Poll.class);
        // Audiences
        List<Audience> audiences = exercise.getAudiences();
        importExport.setAudiences(audiences);
        objectMapper.addMixIn(Audience.class, isWithPlayers
                ? ExerciseExportMixins.Audience.class : ExerciseExportMixins.EmptyAudience.class);
        exerciseTags.addAll(audiences.stream().flatMap(audience -> audience.getTags().stream()).toList());
        if (isWithPlayers) {
            // players
            List<User> players = audiences.stream()
                    .flatMap(audience -> audience.getUsers().stream())
                    .distinct().toList();
            exerciseTags.addAll(players.stream().flatMap(user -> user.getTags().stream()).toList());
            importExport.setUsers(players);
            objectMapper.addMixIn(User.class, ExerciseExportMixins.User.class);
            // organizations
            List<Organization> organizations = players.stream()
                    .map(User::getOrganization)
                    .filter(Objects::nonNull).toList();
            exerciseTags.addAll(organizations.stream().flatMap(org -> org.getTags().stream()).toList());
            importExport.setOrganizations(organizations);
            objectMapper.addMixIn(Organization.class, ExerciseExportMixins.Organization.class);
        }
        // Injects
        List<Inject> injects = exercise.getInjects();
        exerciseTags.addAll(injects.stream().flatMap(inject -> inject.getTags().stream()).toList());
        importExport.setInjects(injects);
        objectMapper.addMixIn(Inject.class, ExerciseExportMixins.Inject.class);
        // Tags
        importExport.setTags(exerciseTags);
        objectMapper.addMixIn(Tag.class, ExerciseExportMixins.Tag.class);
        // Documents
        List<String> documentIds = injects.stream()
                .flatMap(inject -> inject.getDocuments().stream())
                .map(document -> document.getDocument().getId()).toList();
        // Build the zip
        ZipOutputStream zipExport = new ZipOutputStream(response.getOutputStream());
        ZipEntry zipEntry = new ZipEntry(exercise.getName() + ".json");
        zipEntry.setComment(EXPORT_ENTRY_EXERCISE);
        zipExport.putNextEntry(zipEntry);
        zipExport.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(importExport));
        zipExport.closeEntry();
        documentIds.forEach(docId -> {
            Document doc = documentRepository.findById(docId).orElseThrow();
            Optional<InputStream> docStream = fileService.getFile(doc.getName());
            if (docStream.isPresent()) {
                try {
                    ZipEntry zipDoc = new ZipEntry(doc.getName());
                    zipDoc.setComment(EXPORT_ENTRY_ATTACHMENT);
                    byte[] data = docStream.get().readAllBytes();
                    zipExport.putNextEntry(zipDoc);
                    zipExport.write(data);
                    zipExport.closeEntry();
                } catch (IOException e) {
                    // Cant add to zip
                    e.printStackTrace();
                }
            }
        });
        zipExport.finish();
        zipExport.close();
    }

    @PostMapping("/api/exercises/import")
    @RolesAllowed(ROLE_ADMIN)
    public void exerciseImport(@RequestPart("file") MultipartFile file) throws Exception {
        importService.handleFileImport(file);
    }
    // endregion
}
