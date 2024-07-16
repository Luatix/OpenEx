import React, { FunctionComponent } from 'react';
import { Button, TextField as MuiTextField, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { makeStyles } from '@mui/styles';
import type { InjectExpectationsStore } from '../../../../common/injects/expectations/Expectation';
import { useFormatter } from '../../../../../../components/i18n';
import { updateInjectExpectation } from '../../../../../../actions/Exercise';
import { useAppDispatch } from '../../../../../../utils/hooks';
import ExpandableText from '../../../../../../components/common/ExpendableText';
import type { Theme } from '../../../../../../components/Theme';
import { zodImplement } from '../../../../../../utils/Zod';
import type { InjectExpectationResult, SecurityPlatform } from '../../../../../../utils/api-types';
import SecurityPlatformField from '../../../../../../components/fields/SecurityPlatformField';
import { useHelper } from '../../../../../../store';
import type { SecurityPlatformHelper } from '../../../../../../actions/assets/asset-helper';
import useDataLoader from '../../../../../../utils/hooks/useDataLoader';
import { fetchSecurityPlatforms } from '../../../../../../actions/assets/securityPlatform-actions';
import ItemResult from '../../../../../../components/ItemResult';

const useStyles = makeStyles((theme: Theme) => ({
  marginTop_2: {
    marginTop: theme.spacing(2),
  },
  buttons: {
    display: 'flex',
    placeContent: 'end',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
}));

interface FormProps {
  expectation: InjectExpectationsStore;
  result?: InjectExpectationResult;
  onUpdate?: () => void;
}

const DetectionPreventionExpectationsValidationForm: FunctionComponent<FormProps> = ({ expectation, result, onUpdate }) => {
  const classes = useStyles();
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const { securityPlatformsMap }: { securityPlatformsMap: Record<string, SecurityPlatform>; } = useHelper((helper: SecurityPlatformHelper) => ({
    securityPlatformsMap: helper.getSecurityPlatformsMap(),
  }));
  useDataLoader(() => {
    dispatch(fetchSecurityPlatforms());
  });
  const onSubmit = (data: { expectation_score: number, security_platform: string }) => {
    dispatch(updateInjectExpectation(expectation.inject_expectation_id, {
      ...data,
      source_id: data.security_platform,
      source_type: 'security-platform',
      source_name: securityPlatformsMap[data.security_platform].asset_name,
    })).then(() => {
      onUpdate?.();
    });
  };
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ expectation_score: number, security_platform: string }>({
    mode: 'onTouched',
    resolver: zodResolver(zodImplement<{ expectation_score: number, security_platform: string }>().with({
      expectation_score: z.coerce.number(),
      security_platform: z.string().min(1, { message: t('Should not be empty') }),
    })),
    defaultValues: {
      expectation_score: result?.score ?? expectation.inject_expectation_score ?? expectation.inject_expectation_expected_score ?? 0,
      security_platform: result?.sourceId ?? '',
    },
  });
  return (
    <form id="expectationForm" onSubmit={handleSubmit(onSubmit)}>
      {result && (
        <div style={{ float: 'right' }}>
          <ItemResult label={result?.result} status={result?.result} />
        </div>
      )}
      <Typography variant="h3">{t('Name')}</Typography>
      {expectation.inject_expectation_name}
      <div className={classes.marginTop_2}>
        <Typography variant="h3">{t('Description')}</Typography>
        <ExpandableText source={expectation.inject_expectation_description} limit={120} />
      </div>
      <Controller
        control={control}
        name="security_platform"
        render={({ field: { onChange, value } }) => (
          <SecurityPlatformField
            name="security_platform"
            label={t('Security platform')}
            fieldValue={value ?? ''}
            fieldOnChange={onChange}
            errors={errors}
            style={{ marginTop: 20 }}
            onlyManual={true}
          />
        )}
      />
      <MuiTextField
        className={classes.marginTop_2}
        variant="standard"
        fullWidth
        label={t('Score')}
        type="number"
        error={!!errors.expectation_score}
        helperText={errors.expectation_score && errors.expectation_score?.message ? errors.expectation_score?.message : `${t('Expected score:')} ${expectation.inject_expectation_expected_score}`}
        inputProps={register('expectation_score')}
      />
      <div className={classes.buttons}>
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="contained"
        >
          {t('Validate')}
        </Button>
      </div>
    </form>
  );
};

export default DetectionPreventionExpectationsValidationForm;
