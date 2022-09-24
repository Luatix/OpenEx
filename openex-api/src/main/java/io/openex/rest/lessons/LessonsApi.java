package io.openex.rest.lessons;

import io.openex.database.model.*;
import io.openex.database.repository.ExerciseRepository;
import io.openex.database.repository.LessonsCategoryRepository;
import io.openex.database.repository.LessonsQuestionRepository;
import io.openex.database.repository.LessonsTemplateRepository;
import io.openex.database.specification.LessonsCategorySpecification;
import io.openex.database.specification.LessonsQuestionSpecification;
import io.openex.rest.helper.RestBehavior;
import io.openex.rest.lessons.form.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

import static java.time.Instant.now;

@RestController
public class LessonsApi extends RestBehavior {

    private ExerciseRepository exerciseRepository;
    private LessonsTemplateRepository lessonsTemplateRepository;
    private LessonsCategoryRepository lessonsCategoryRepository;
    private LessonsQuestionRepository lessonsQuestionRepository;

    @Autowired
    public void setExerciseRepository(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    @Autowired
    public void setLessonsTemplateRepository(LessonsTemplateRepository lessonsTemplateRepository) {
        this.lessonsTemplateRepository = lessonsTemplateRepository;
    }

    @Autowired
    public void setLessonsCategoryRepository(LessonsCategoryRepository lessonsCategoryRepository) {
        this.lessonsCategoryRepository = lessonsCategoryRepository;
    }

    @Autowired
    public void setLessonsQuestionRepository(LessonsQuestionRepository lessonsQuestionRepository) {
        this.lessonsQuestionRepository = lessonsQuestionRepository;
    }

    @GetMapping("/api/exercises/{exerciseId}/lessons_categories")
    @PreAuthorize("isExerciseObserver(#exerciseId)")
    public Iterable<LessonsCategory> exerciseLessonsCategories(@PathVariable String exerciseId) {
        return lessonsCategoryRepository.findAll(LessonsCategorySpecification.fromExercise(exerciseId));
    }

    @PostMapping("/api/exercises/{exerciseId}/lessons_apply_template/{lessonsTemplateId}")
    @PreAuthorize("isExercisePlanner(#exerciseId)")
    public Iterable<LessonsCategory> applyExerciseLessonsTemplate(@PathVariable String exerciseId, @PathVariable String lessonsTemplateId) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        LessonsTemplate lessonsTemplate = lessonsTemplateRepository.findById(lessonsTemplateId).orElseThrow();
        List<LessonsCategory> lessonsCategories = lessonsTemplate.getCategories().stream().map(lessonsTemplateCategory -> {
            LessonsCategory lessonsCategory = new LessonsCategory();
            lessonsCategory.setExercise(exercise);
            lessonsCategory.setName(lessonsTemplateCategory.getName());
            lessonsCategory.setDescription(lessonsTemplateCategory.getDescription());
            List<LessonsQuestion> lessonsQuestions = lessonsTemplateCategory.getQuestions().stream().map(lessonsTemplateQuestion -> {
               LessonsQuestion lessonsQuestion = new LessonsQuestion();
               lessonsQuestion.setCategory(lessonsCategory);
               lessonsQuestion.setContent(lessonsTemplateQuestion.getContent());
               lessonsQuestion.setExplanation(lessonsTemplateQuestion.getExplanation());
               return lessonsQuestion;
            }).toList();
            lessonsCategory.setQuestions(lessonsQuestions);
            return lessonsCategory;
        }).toList();
        lessonsCategoryRepository.saveAll(lessonsCategories);
        return lessonsCategories;
    }

    @PostMapping("/api/exercises/{exerciseId}/lessons_categories")
    @PreAuthorize("isExercisePlanner(#exerciseId)")
    public LessonsCategory createExerciseLessonsCategory(@PathVariable String exerciseId, @Valid @RequestBody LessonsCategoryCreateInput input) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        LessonsCategory lessonsCategory = new LessonsCategory();
        lessonsCategory.setUpdateAttributes(input);
        lessonsCategory.setExercise(exercise);
        return lessonsCategoryRepository.save(lessonsCategory);
    }

    @PutMapping("/api/exercises/{exerciseId}/lessons_categories/{lessonsCategoryId}")
    @PreAuthorize("isExercisePlanner(#exerciseId)")
    public LessonsCategory updateExerciseLessonsCategory(@PathVariable String lessonsCategoryId, @Valid @RequestBody LessonsCategoryUpdateInput input) {
        LessonsCategory lessonsTemplateCategory = lessonsCategoryRepository.findById(lessonsCategoryId).orElseThrow();
        lessonsTemplateCategory.setUpdateAttributes(input);
        lessonsTemplateCategory.setUpdated(now());
        return lessonsCategoryRepository.save(lessonsTemplateCategory);
    }

    @DeleteMapping("/api/exercises/{exerciseId}/lessons_categories/{lessonsCategoryId}")
    @PreAuthorize("isExercisePlanner(#exerciseId)")
    public void deleteExerciseLessonsCategory(@PathVariable String lessonsCategoryId) {
        lessonsCategoryRepository.deleteById(lessonsCategoryId);
    }

    @GetMapping("/api/exercises/{exerciseId}/lessons_questions")
    @PreAuthorize("isExerciseObserver(#exerciseId)")
    public Iterable<LessonsQuestion> exerciseLessonsQuestions(@PathVariable String exerciseId) {
        return lessonsCategoryRepository.findAll(LessonsCategorySpecification.fromExercise(exerciseId)).stream().
                flatMap(lessonsCategory -> lessonsQuestionRepository.findAll(LessonsQuestionSpecification.fromCategory(lessonsCategory.getId())).stream()).toList();
    }

    @GetMapping("/api/exercises/{exerciseId}/lessons_categories/{lessonsCategoryId}/lessons_questions")
    @PreAuthorize("isExerciseObserver(#exerciseId)")
    public Iterable<LessonsQuestion> exerciseLessonsCategoryQuestions(@PathVariable String lessonsCategoryId) {
        return lessonsQuestionRepository.findAll(LessonsQuestionSpecification.fromCategory(lessonsCategoryId));
    }

    @PostMapping("/api/exercises/{exerciseId}/lessons_categories/{lessonsCategoryId}/lessons_questions")
    @PreAuthorize("isExercisePlanner(#exerciseId)")
    public LessonsQuestion createExerciseLessonsQuestion(@PathVariable String lessonsCategoryId, @Valid @RequestBody LessonsQuestionCreateInput input) {
        LessonsCategory lessonsCategory = lessonsCategoryRepository.findById(lessonsCategoryId).orElseThrow();
        LessonsQuestion lessonsQuestion = new LessonsQuestion();
        lessonsQuestion.setUpdateAttributes(input);
        lessonsQuestion.setCategory(lessonsCategory);
        return lessonsQuestionRepository.save(lessonsQuestion);
    }

    @PutMapping("/api/exercises/{exerciseId}/lessons_categories/{lessonsCategoryId}/lessons_questions/{lessonsQuestionId}")
    @PreAuthorize("isExercisePlanner(#exerciseId)")
    public LessonsQuestion updateExerciseLessonsQuestion(@PathVariable String lessonsQuestionId, @Valid @RequestBody LessonsQuestionUpdateInput input) {
        LessonsQuestion lessonsQuestion = lessonsQuestionRepository.findById(lessonsQuestionId).orElseThrow();
        lessonsQuestion.setUpdateAttributes(input);
        lessonsQuestion.setUpdated(now());
        return lessonsQuestionRepository.save(lessonsQuestion);
    }

    @DeleteMapping("/api/exercises/{exerciseId}/lessons_categories/{lessonsCategoryId}/lessons_questions/{lessonsQuestionId}")
    @PreAuthorize("isExercisePlanner(#exerciseId)")
    public void deleteExerciseLessonsQuestion(@PathVariable String lessonsQuestionId) {
        lessonsQuestionRepository.deleteById(lessonsQuestionId);
    }
}
