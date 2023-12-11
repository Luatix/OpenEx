import React, { FunctionComponent } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MuiTextField from '@mui/material/TextField';
import { makeStyles } from '@mui/styles';
import classNames from 'classnames';
import Transition from '../../../../components/common/Transition';
import { InjectExpectationsStore } from '../injects/expectations/Expectation';
import { useFormatter } from '../../../../components/i18n';
import { updateInjectExpectations } from '../../../../actions/Exercise';
import { useAppDispatch } from '../../../../utils/hooks';
import { ExpectationUpdateInput, Inject } from '../../../../utils/api-types';
import ItemTags from '../../../../components/ItemTags';

const useStyles = makeStyles(() => ({
  mt_20: {
    marginTop: 20,
  },
}));

interface FormProps {
  exerciseId: string;
  expectations: InjectExpectationsStore[];
  onClose: () => void;
}

const DialogExpectationsForm: FunctionComponent<FormProps> = ({
  exerciseId,
  expectations,
  onClose,
}) => {
  const classes = useStyles();
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  // TODO: improv UI

  const submit = (data: ExpectationUpdateInput[]) => dispatch(
    updateInjectExpectations(exerciseId, data),
  ).then(onClose);

  const onSubmit = (data: { expectations: ExpectationUpdateInput[] }) => {
    const datas = data.expectations.map((e, idx) => ({
      expectation_id: expectations[idx].injectexpectation_id,
      expectation_score: e.expectation_score,
    }));
    submit(datas);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<{ expectations: ExpectationUpdateInput[] }>({
    mode: 'onTouched',
    resolver: zodResolver(z.object({
      expectations: z.array(z.object({
        expectation_score: z.coerce.number(),
      })),
    })),
    defaultValues: {
      expectations: expectations
        .sort((e1, e2) => (e1.inject_expectation_name ?? '').localeCompare(e2.inject_expectation_name ?? ''))
        .map((expectation) => ({
          expectation_score: expectation.inject_expectation_score ?? expectation.inject_expectation_expected_score,
        })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'expectations',
  });

  return (
    <form id="expectationForm" onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => {
        const expectation = expectations[index];
        return (
          <MuiTextField
            key={field.id}
            variant="standard"
            fullWidth={true}
            label={expectation.inject_expectation_name}
            type="number"
            error={!!errors.expectations?.[index]?.expectation_score}
            helperText={
              errors.expectations?.[index]?.expectation_score && errors.expectations?.[index]?.expectation_score?.message
            }
            inputProps={register(`expectations.${index}.expectation_score`)}
            className={classNames({
              [classes.mt_20]: index !== 0,
            })}
          />
        );
      })}
      <div style={{ float: 'right', marginTop: 20 }}>
        <Button
          onClick={onClose}
          style={{ marginRight: 10 }}
          disabled={isSubmitting}
        >
          {t('Cancel')}
        </Button>
        <Button
          color="secondary"
          type="submit"
          disabled={!isDirty || isSubmitting}
        >
          {t('Validate')}
        </Button>
      </div>
    </form>
  );
};

interface Props {
  exerciseId: string;
  inject: Inject;
  expectations: InjectExpectationsStore[] | null;
  open: boolean;
  onClose: () => void;
}

const DialogExpectation: FunctionComponent<Props> = ({
  exerciseId,
  inject,
  expectations,
  open,
  onClose,
}) => {
  const { t, fndt } = useFormatter();

  return (
    <Dialog
      TransitionComponent={Transition}
      open={open}
      onClose={onClose}
      fullWidth={true}
      maxWidth="md"
      PaperProps={{ elevation: 1 }}
    >
      <DialogTitle>
        {inject.inject_title}
      </DialogTitle>
      <DialogContent>
        <Grid container={true} spacing={3}>
          <Grid item={true} xs={6}>
            <Typography variant="h3">{t('Title')}</Typography>
            {inject.inject_title}
          </Grid>
          <Grid item={true} xs={6}>
            <Typography variant="h3">{t('Description')}</Typography>
            {inject.inject_description}
          </Grid>
          <Grid item={true} xs={6}>
            <Typography variant="h3">{t('Sent at')}</Typography>
            {fndt(inject.inject_sent_at)}
          </Grid>
          <Grid item={true} xs={6}>
            <Typography variant="h3">{t('Tags')}</Typography>
            <ItemTags tags={inject.inject_tags || []} />
          </Grid>
        </Grid>
        <Typography variant="h2" style={{ marginTop: 30 }}>
          {t('Results')}
        </Typography>
        {expectations
          && <DialogExpectationsForm exerciseId={exerciseId} expectations={expectations} onClose={onClose} />
        }
      </DialogContent>
    </Dialog>
  );
};
export default DialogExpectation;
