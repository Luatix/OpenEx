import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDropDownOutlined, ArrowDropUpOutlined, HelpOutlined } from '@mui/icons-material';
import { Avatar, Button, Card, CardContent, CardHeader } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { TagHelper } from '../../../../../actions/helper';
import {
  ContractElement,
  FieldValue,
  InjectorContractConverted,
} from '../../../../../actions/injector_contracts/InjectorContract';
import { useFormatter } from '../../../../../components/i18n';
import Loader from '../../../../../components/Loader';
import { useHelper } from '../../../../../store';
import { Inject, InjectInput } from '../../../../../utils/api-types';
import { splitDuration } from '../../../../../utils/Time';
import { isEmptyField } from '../../../../../utils/utils';
import { PermissionsContext } from '../../Context';
import InjectDefinition from './InjectDefinition';
import InjectForm from './InjectForm';

interface Props {
  injectContractIcon: React.ReactNode | undefined;
  injectHeaderAction: React.ReactNode;
  injectHeaderTitle: string;
  injectorContractLabel?: string;
  handleClose: () => void;
  openDetail?: boolean;
  disabled?: boolean;
  isAtomic: boolean;
  isCreation?: boolean;
  drawerRef: React.RefObject<HTMLDivElement | null>;
  defaultInject: Inject | Omit<Inject, 'inject_id' | 'inject_created_at' | 'inject_updated_at'>;
  onSubmitInject: (data: InjectInput) => Promise<void>;
  injectorContractContent?: InjectorContractConverted['convertedContent'];
}

const InjectDetailsForm = ({
  injectContractIcon,
  injectHeaderAction,
  injectHeaderTitle,
  injectorContractLabel = '',
  handleClose,
  openDetail = false,
  disabled = false,
  isAtomic,
  isCreation = false,
  drawerRef,
  defaultInject = {} as Inject,
  injectorContractContent,
  onSubmitInject,
  ...props
}: Props) => {
  const theme = useTheme();
  const { t } = useFormatter();
  const { permissions } = useContext(PermissionsContext);
  const [defaultValues, setDefaultValues] = useState({});
  const [openDetails, setOpenDetails] = useState(openDetail);
  const [injectDetailsState, setInjectDetailsState] = useState({
    allTeams: false,
    teamsIds: defaultInject?.inject_teams,
    assetIds: defaultInject?.inject_assets,
    assetGroupIds: defaultInject?.inject_asset_groups,
    documents: defaultInject.inject_documents,
    articlesIds: [],
    challengesIds: [],
    expectations: [],
  });

  const { tagsMap } = useHelper((helper: TagHelper) => ({
    tagsMap: helper.getTagsMap(),
  }));
  const toggleInjectContent = () => {
    if (openDetails) {
      if (drawerRef.current) {
        drawerRef.current.scrollTop = 0;
      }
      setOpenDetails(false);
    } else {
      setOpenDetails(true);
    }
  };

  const getInitialValues = (): Record<string, FieldValue> => {
    const duration = splitDuration(defaultInject?.inject_depends_duration || 0);
    const initialValues: Record<string, FieldValue> = {
      ...defaultInject,
      ...defaultInject?.inject_content,
      inject_tags: defaultInject?.inject_tags || [],
      inject_depends_duration_days: duration.days,
      inject_depends_duration_hours: duration.hours,
      inject_depends_duration_minutes: duration.minutes,
    };

    // Enrich initialValues with default contract value
    if (injectorContractContent) {
      const builtInFields = [
        'teams',
        'assets',
        'assetgroups',
        'articles',
        'challenges',
        'attachments',
        'expectations',
      ];

      injectorContractContent.fields
        .filter(f => !builtInFields.includes(f.key))
        .forEach((field: ContractElement) => {
          if (!initialValues[field.key]) {
            initialValues[field.key] = field.cardinality === '1'
              ? field.defaultValue?.[0]
              : field.defaultValue;
          }

          // Specific richText type field
          if (
            field.type === 'textarea'
            && field.richText
            && initialValues[field.key]
          ) {
            initialValues[field.key] = (initialValues[field.key] as string)
              .replaceAll('<#list challenges as challenge>', '&lt;#list challenges as challenge&gt;')
              .replaceAll('<#list articles as article>', '&lt;#list articles as article&gt;')
              .replaceAll('</#list>', '&lt;/#list&gt;');

          // Specific tuple type field
          } else if (field.type === 'tuple' && initialValues[field.key]) {
            const processValue = ({ key, value }: { key: string; value: string }) => ({
              type: field.tupleFilePrefix != null && value?.includes(field.tupleFilePrefix) ? 'attachment' : 'text',
              key,
              value: field.tupleFilePrefix != null && value?.replace(field.tupleFilePrefix, ''),
            });

            if (field.cardinality === '1') {
              initialValues[field.key] = processValue(initialValues[field.key] as { key: string; value: string });
            } else {
              initialValues[field.key] = (initialValues[field.key] as { key: string; value: string }[]).map(processValue);
            }
          }
        });
    }
    return initialValues;
  };

  const convertDataFromInjectorContractContent = (data: Record<string, FieldValue>): object | null => {
    const newContent: Record<string, unknown> = {};
    const hasArticles = injectorContractContent?.fields
      .map(f => f.key)
      .includes('articles');
    if (hasArticles && injectDetailsState.articlesIds.length > 0) {
      newContent.articles = injectDetailsState.articlesIds;
    }
    const hasChallenges = injectorContractContent?.fields
      .map(f => f.key)
      .includes('challenges');
    if (hasChallenges && injectDetailsState.challengesIds.length > 0) {
      newContent.challenges = injectDetailsState.challengesIds;
    }
    const hasExpectations = injectorContractContent?.fields
      .map(f => f.key)
      .includes('expectations');
    if (hasExpectations && injectDetailsState.expectations.length > 0) {
      newContent.expectations = injectDetailsState.expectations;
    }

    injectorContractContent?.fields
      .filter(
        f => !['teams', 'assets', 'assetgroups', 'articles', 'challenges', 'attachments', 'expectations'].includes(
          f.key,
        ),
      )
      .forEach((field) => {
        if (field.type === 'number' && typeof data[field.key] === 'string') {
          newContent[field.key] = parseInt(String(data[field.key]), 10);

        // Specific richText type field
        } else if (
          field.type === 'textarea'
          && field.richText
          && (String(data[field.key]))?.length > 0
        ) {
          const regex = /&lt;#list\s+(\w+)\s+as\s+(\w+)&gt;/g;
          newContent[field.key] = (data[field.key] as string)
            .replace(regex, (_, listName, identifier) => `<#list ${listName} as ${identifier}>`)
            .replaceAll('&lt;/#list&gt;', '</#list>');

        // Specific tuple type field
        } else if (data[field.key] && field.type === 'tuple') {
          const fieldData = data[field.key];
          const formatTuple = ({ type, ...pair }: { key: string; value: string; type?: string }) => {
            return type === 'attachment' ? { key: pair.key, value: `${field.tupleFilePrefix}${pair.value}` } : pair;
          };
          if (field.cardinality === '1') {
            newContent[field.key] = formatTuple(fieldData as { key: string; value: string; type?: string });
          } else {
            newContent[field.key] = (fieldData as { key: string; value: string; type?: string }[]).map(data => formatTuple(data));
          }
        } else {
          newContent[field.key] = data[field.key];
        }
      });
    return isEmptyField(newContent) ? null : newContent;
  };

  const onSubmit = async (data: Record<string, FieldValue>) => {
    if (injectorContractContent) {
      const inject_depends_duration = Number(data.inject_depends_duration_days) * 3600 * 24
        + Number(data.inject_depends_duration_hours) * 3600
        + Number(data.inject_depends_duration_minutes) * 60;
      const { allTeams, teamsIds, assetIds, assetGroupIds, documents } = injectDetailsState;
      const values = {
        inject_title: data.inject_title,
        inject_injector_contract: injectorContractContent.contract_id,
        inject_description: data.inject_description as string,
        inject_tags: data.inject_tags,
        inject_content: convertDataFromInjectorContractContent(data),
        inject_all_teams: allTeams,
        inject_teams: teamsIds,
        inject_assets: assetIds,
        inject_asset_groups: assetGroupIds,
        inject_documents: documents,
        inject_depends_duration,
        inject_depends_on: data.inject_depends_on ? data.inject_depends_on : [],
      } as InjectInput;
      await onSubmitInject(values);
    }
    handleClose();
  };

  const {
    reset,
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(
      z.object({
        inject_title: z.string().min(1, { message: t('This field is required.') }),
        inject_depends_duration_days: z.number().int().min(0, { message: t('This field is required.') }),
        inject_depends_duration_hours: z.number().int().min(0, { message: t('This field is required.') }),
        inject_depends_duration_minutes: z.number().int().min(0, { message: t('This field is required.') }),
        ...Object.keys(defaultValues).reduce<Record<string, z.ZodTypeAny>>((acc, key) => {
          acc[key] = z.any();
          return acc;
        }, {}),
      })),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    const initialValues = getInitialValues();
    setDefaultValues(initialValues);
    reset(initialValues, { keepDirtyValues: true });
  }, [injectorContractContent]);

  if (Object.keys(defaultValues).length === 0) {
    return <Loader />;
  }

  return (
    <form id="injectContentForm" onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(2) }}>
      <Card elevation={0}>
        <CardHeader
          sx={{ backgroundColor: theme.palette.background.default }}
          avatar={injectContractIcon ?? <Avatar sx={{ width: 24, height: 24 }}><HelpOutlined /></Avatar>}
          title={injectHeaderTitle}
          action={injectHeaderAction}
        />
        <CardContent sx={{
          fontSize: theme.typography.h6.fontSize,
          textAlign: 'center',
          ...disabled && { color: theme.palette?.text?.disabled },
          ...disabled && { fontStyle: 'italic' },
        }}
        >
          {injectorContractLabel}
        </CardContent>
      </Card>
      <InjectForm control={control} disabled={disabled} isAtomic={isAtomic} register={register} />
      {injectorContractContent && (
        <div style={{ width: '100%' }}>
          {openDetails && (
            <InjectDefinition
              control={control}
              register={register}
              values={getValues()}
              setValue={setValue}
              getValues={(key: keyof typeof defaultValues) => getValues(key)}
              submitting={isSubmitting}
              inject={defaultValues}
              injectorContract={{ ...injectorContractContent }}
              handleClose={handleClose}
              tagsMap={tagsMap}
              readOnly={permissions.readOnly}
              articlesFromExerciseOrScenario={[]}
              variablesFromExerciseOrScenario={[]}
              setInjectDetailsState={setInjectDetailsState}
              uriVariable=""
              allUsersNumber={0}
              usersNumber={0}
              teamsUsers={[]}
              isAtomic={isAtomic}
              {...props}
            />
          )}

          <Button variant="outlined" onClick={toggleInjectContent} style={{ width: '100%', height: theme.spacing(5) }}>
            {openDetails ? <ArrowDropUpOutlined fontSize="large" /> : <ArrowDropDownOutlined fontSize="large" />}
            {t('Inject content')}
          </Button>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: theme.spacing(1) }}>
        <Button
          variant="contained"
          color="secondary"
          type="submit"
          disabled={isSubmitting || Object.keys(errors).length > 0 || disabled}
        >
          {isCreation ? t('Create') : t('Update')}
        </Button>
        <Button
          variant="contained"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          {t('Cancel')}
        </Button>
      </div>
    </form>
  );
};

export default InjectDetailsForm;
