import * as schema from './Schema';
import {
  getReferential,
  putReferential,
  postReferential,
  delReferential,
} from '../utils/Action';

export const fetchLessonsTemplates = () => (dispatch) => {
  const uri = '/api/lessons_templates';
  return getReferential(schema.arrayOfLessonsTemplates, uri)(dispatch);
};

export const updateLessonsTemplate = (lessonsTemplateId, data) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}`;
  return putReferential(schema.lessonsTemplate, uri, data)(dispatch);
};

export const addLessonsTemplate = (data) => (dispatch) => {
  const uri = '/api/lessons_templates';
  return postReferential(schema.lessonsTemplate, uri, data)(dispatch);
};

export const deleteLessonsTemplate = (lessonsTemplateId) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}`;
  return delReferential(uri, 'lessons_templates', lessonsTemplateId)(dispatch);
};

export const fetchLessonsTemplateCategories = (lessonsTemplateId) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}/lessons_template_categories`;
  return getReferential(
    schema.arrayOfLessonsTemplateCategories,
    uri,
  )(dispatch);
};

export const updateLessonsTemplateCategory = (lessonsTemplateId, lessonsTemplateCategoryId, data) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}/lessons_template_categories/${lessonsTemplateCategoryId}`;
  return putReferential(schema.lessonsTemplateCategory, uri, data)(dispatch);
};

export const addLessonsTemplateCategory = (lessonsTemplateId, data) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}/lessons_template_categories`;
  return postReferential(schema.lessonsTemplateCategory, uri, data)(dispatch);
};

export const deleteLessonsTemplateCategory = (lessonsTemplateId, lessonsTemplateCategoryId) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}/lessons_template_categories/${lessonsTemplateCategoryId}`;
  return delReferential(
    uri,
    'lessons_template_categories',
    lessonsTemplateCategoryId,
  )(dispatch);
};

export const fetchLessonsTemplateQuestions = (lessonsTemplateId) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}/lessons_template_questions`;
  return getReferential(
    schema.arrayOfLessonsTemplateQuestions,
    uri,
  )(dispatch);
};

export const updateLessonsTemplateQuestion = (
  lessonsTemplateId,
  lessonsTemplateCategoryId,
  lessonsTemplateQuestionId,
  data,
) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}/lessons_template_categories/${lessonsTemplateCategoryId}/lessons_template_questions/${lessonsTemplateQuestionId}`;
  return putReferential(schema.lessonsTemplateQuestion, uri, data)(dispatch);
};

export const addLessonsTemplateQuestion = (lessonsTemplateId, lessonsTemplateCategoryId, data) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}/lessons_template_categories/${lessonsTemplateCategoryId}/lessons_template_questions`;
  return postReferential(schema.lessonsTemplateQuestion, uri, data)(dispatch);
};

export const deleteLessonsTemplateQuestion = (lessonsTemplateId, lessonsTemplateCategoryId, lessonsTemplateQuestionId) => (dispatch) => {
  const uri = `/api/lessons_templates/${lessonsTemplateId}/lessons_template_categories/${lessonsTemplateCategoryId}/lessons_template_questions/${lessonsTemplateQuestionId}`;
  return delReferential(
    uri,
    'lessons_template_questions',
    lessonsTemplateQuestionId,
  )(dispatch);
};
