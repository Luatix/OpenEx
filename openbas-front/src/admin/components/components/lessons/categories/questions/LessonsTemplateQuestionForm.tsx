import React, { FunctionComponent } from 'react';
import { Button } from '@mui/material';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormatter } from '../../../../../../components/i18n';
import type { LessonsTemplateQuestionInput } from '../../../../../../utils/api-types';
import { zodImplement } from '../../../../../../utils/Zod';
import TextField from '../../../../../../components/fields/TextField';

interface Props {
  onSubmit: SubmitHandler<LessonsTemplateQuestionInput>;
  handleClose: () => void;
  editing?: boolean;
  initialValues?: LessonsTemplateQuestionInput;
}

const LessonsTemplateQuestionForm: FunctionComponent<Props> = ({
  onSubmit,
  handleClose,
  initialValues = {
    lessons_template_question_content: '',
    lessons_template_question_explanation: '',
    lessons_template_question_order: 0,
  },
  editing = false,
}) => {
  // Standard hooks
  const { t } = useFormatter();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<LessonsTemplateQuestionInput>({
    mode: 'onTouched',
    resolver: zodResolver(
      zodImplement<LessonsTemplateQuestionInput>().with({
        lessons_template_question_content: z.string().min(1, { message: t('Should not be empty') }),
        lessons_template_question_explanation: z.string().optional(),
        // @ts-expect-error: should be handled as a number
        lessons_template_question_order: z.string().min(1, { message: t('Should not be empty') }),
      }),
    ),
    defaultValues: initialValues,
  });

  return (
    <form id="lessonsTemplateQuestionForm" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        variant="standard"
        fullWidth
        label={t('Content')}
        style={{ marginTop: 10 }}
        error={!!errors.lessons_template_question_content}
        helperText={errors.lessons_template_question_content?.message}
        inputProps={register('lessons_template_question_content')}
        InputLabelProps={{ required: true }}
      />
      <TextField
        variant="standard"
        fullWidth
        label={t('Explanation')}
        style={{ marginTop: 10 }}
        error={!!errors.lessons_template_question_explanation}
        helperText={errors.lessons_template_question_explanation?.message}
        inputProps={register('lessons_template_question_explanation')}
      />
      <TextField
        variant="standard"
        fullWidth
        label={t('Order')}
        style={{ marginTop: 20 }}
        error={!!errors.lessons_template_question_order}
        helperText={errors.lessons_template_question_order?.message}
        inputProps={register('lessons_template_question_order')}
        type="number"
      />
      <div style={{ float: 'right', marginTop: 20 }}>
        <Button
          variant="contained"
          onClick={handleClose}
          style={{ marginRight: 10 }}
          disabled={isSubmitting}
        >
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          type="submit"
          disabled={!isDirty || isSubmitting}
        >
          {editing ? t('Update') : t('Create')}
        </Button>
      </div>
    </form>
  );
};

export default LessonsTemplateQuestionForm;
