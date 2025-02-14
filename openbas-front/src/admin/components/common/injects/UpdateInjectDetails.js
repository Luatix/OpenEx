import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDropDownOutlined, ArrowDropUpOutlined, HelpOutlined } from '@mui/icons-material';
import { Avatar, Button, Card, CardContent, CardHeader } from '@mui/material';
import * as R from 'ramda';
import { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { makeStyles } from 'tss-react/mui';
import { z } from 'zod';

import { useFormatter } from '../../../../components/i18n';
import PlatformIcon from '../../../../components/PlatformIcon';
import { useHelper } from '../../../../store';
import { splitDuration } from '../../../../utils/Time';
import { isEmptyField, isNotEmptyField } from '../../../../utils/utils';
import { PermissionsContext } from '../Context';
import InjectDefinition from './form/InjectDefinition';
import InjectForm from './form/InjectForm';
import InjectIcon from './InjectIcon';

const useStyles = makeStyles()(theme => ({
  details: {
    marginTop: 20,
  },
  injectorContract: {
    margin: '10px 0 20px 0',
    width: '100%',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
  },
  injectorContractContent: {
    fontSize: 18,
    textAlign: 'center',
  },
  openDetails: {
    width: '100%',
    height: 40,
    border: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    textTransform: 'uppercase',
    cursor: 'pointer',
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  injectorContractHeader: {
    backgroundColor: theme.palette.background.default,
  },
}));

const UpdateInjectDetails = ({
  contractContent,
  inject,
  handleClose,
  onUpdateInject,
  isAtomic = false,
  drawerRef,
  ...props
}) => {
  const { t } = useFormatter();
  const { classes } = useStyles();
  const { permissions } = useContext(PermissionsContext);
  const [openDetails, setOpenDetails] = useState(true);
  const [injectDetailsState, setInjectDetailsState] = useState({});
  const { tagsMap } = useHelper(helper => ({
    tagsMap: helper.getTagsMap(),
  }));

  const toggleInjectContent = () => {
    if (openDetails) {
      drawerRef.current.scrollTop = 0;
      setOpenDetails(false);
    } else {
      setOpenDetails(true);
    }
  };

  const onSubmit = async (data) => {
    if (contractContent) {
      const finalData = {};
      const hasArticles = contractContent.fields
        .map(f => f.key)
        .includes('articles');
      if (hasArticles && injectDetailsState.articlesIds) {
        finalData.articles = injectDetailsState.articlesIds;
      }
      const hasChallenges = contractContent.fields
        .map(f => f.key)
        .includes('challenges');
      if (hasChallenges && injectDetailsState.challengesIds) {
        finalData.challenges = injectDetailsState.challengesIds;
      }
      const hasExpectations = contractContent.fields
        .map(f => f.key)
        .includes('expectations');
      if (hasExpectations && injectDetailsState.expectations) {
        finalData.expectations = injectDetailsState.expectations;
      }
      if (openDetails) {
        contractContent.fields
          .filter(
            f => !['teams', 'assets', 'assetgroups', 'articles', 'challenges', 'attachments', 'expectations'].includes(
              f.key,
            ),
          )
          .forEach((field) => {
            if (field.type === 'number') {
              finalData[field.key] = parseInt(data[field.key], 10);
            } else if (
              field.type === 'textarea'
              && field.richText
              && data[field.key]
              && data[field.key].length > 0
            ) {
              const regex = /&lt;#list\s+(\w+)\s+as\s+(\w+)&gt;/g;
              finalData[field.key] = data[field.key]
                .replace(regex, (_, listName, identifier) => `<#list ${listName} as ${identifier}>`)
                .replaceAll('&lt;/#list&gt;', '</#list>');
            } else if (data[field.key] && field.type === 'tuple') {
              if (field.cardinality && field.cardinality === '1') {
                if (finalData[field.key].type === 'attachment') {
                  finalData[field.key] = {
                    key: data[field.key].key,
                    value: `${field.tupleFilePrefix}${data[field.key].value}`,
                  };
                } else {
                  finalData[field.key] = R.dissoc('type', data[field.key]);
                }
              } else {
                finalData[field.key] = data[field.key].map((pair) => {
                  if (pair.type === 'attachment') {
                    return {
                      key: pair.key,
                      value: `${field.tupleFilePrefix}${pair.value}`,
                    };
                  }
                  return R.dissoc('type', pair);
                });
              }
            } else {
              finalData[field.key] = data[field.key];
            }
          });
      }
      const { allTeams, teamsIds, assetIds, assetGroupIds, documents } = injectDetailsState;
      const inject_depends_duration = data.inject_depends_duration_days * 3600 * 24
        + data.inject_depends_duration_hours * 3600
        + data.inject_depends_duration_minutes * 60;
      const values = {
        inject_title: data.inject_title,
        inject_injector_contract: contractContent.contract_id,
        inject_description: data.inject_description,
        inject_tags: data.inject_tags,
        inject_content: isEmptyField(finalData) ? null : finalData,
        inject_all_teams: allTeams,
        inject_teams: teamsIds,
        inject_assets: assetIds,
        inject_asset_groups: assetGroupIds,
        inject_documents: documents,
        inject_depends_duration,
        inject_depends_on: data.inject_depends_on ? data.inject_depends_on : [],
      };
      await onUpdateInject(values);
    }
    handleClose();
  };

  const duration = splitDuration(inject?.inject_depends_duration || 0);
  const initialValues = {
    ...inject,
    ...inject?.inject_content,
    inject_depends_duration_days: duration.days,
    inject_depends_duration_hours: duration.hours,
    inject_depends_duration_minutes: duration.minutes,
  };
  // Enrich initialValues with default contract value
  const builtInFields = [
    'teams',
    'assets',
    'assetgroups',
    'articles',
    'challenges',
    'attachments',
    'expectations',
  ];
  contractContent?.fields
    .filter(f => !builtInFields.includes(f.key))
    .forEach((field) => {
      if (!initialValues[field.key]) {
        if (field.cardinality && field.cardinality === '1') {
          initialValues[field.key] = R.head(field.defaultValue);
        } else {
          initialValues[field.key] = field.defaultValue;
        }
      }
    });
  // Specific processing for some fields
  contractContent?.fields
    .filter(f => !builtInFields.includes(f.key))
    .forEach((field) => {
      if (
        field.type === 'textarea'
        && field.richText
        && initialValues[field.key]
        && initialValues[field.key].length > 0
      ) {
        initialValues[field.key] = initialValues[field.key]
          .replaceAll(
            '<#list challenges as challenge>',
            '&lt;#list challenges as challenge&gt;',
          )
          .replaceAll(
            '<#list articles as article>',
            '&lt;#list articles as article&gt;',
          )
          .replaceAll('</#list>', '&lt;/#list&gt;');
      } else if (field.type === 'tuple' && initialValues[field.key]) {
        if (field.cardinality && field.cardinality === '1') {
          if (
            initialValues[field.key].value
            && initialValues[field.key].value.includes(
              `${field.tupleFilePrefix}`,
            )
          ) {
            initialValues[field.key] = {
              type: 'attachment',
              key: initialValues[field.key].key,
              value: initialValues[field.key].value.replace(
                `${field.tupleFilePrefix}`,
                '',
              ),
            };
          } else {
            initialValues[field.key] = R.assoc(
              'type',
              'text',
              initialValues[field.key],
            );
          }
        } else {
          initialValues[field.key] = initialValues[field.key].map((pair) => {
            if (
              pair.value
              && pair.value.includes(`${field.tupleFilePrefix}`)
            ) {
              return {
                type: 'attachment',
                key: pair.key,
                value: pair.value.replace(`${field.tupleFilePrefix}`, ''),
              };
            }
            return R.assoc('type', 'text', pair);
          });
        }
      }
    });

  const {
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
        ...Object.keys(initialValues).reduce((acc, key) => {
          acc[key] = z.any();
          return acc;
        }, {}),
      })),
    defaultValues: initialValues,
  });
  return (
    <>
      <Card elevation={0} classes={{ root: classes.injectorContract }}>
        <CardHeader
          classes={{ root: classes.injectorContractHeader }}
          avatar={contractContent
            ? (
                <InjectIcon
                  type={inject.inject_injector_contract?.injector_contract_payload ? (inject.inject_injector_contract.injector_contract_payload.payload_collector_type ?? inject.inject_injector_contract.injector_contract_payload.payload_type) : inject.inject_injector_contract?.injector_contract_injector_type}
                  isPayload={isNotEmptyField(inject.inject_injector_contract?.injector_contract_payload?.payload_collector_type ?? inject.inject_injector_contract?.injector_contract_payload?.payload_type)}
                />
              ) : (<Avatar sx={{ width: 24, height: 24 }}><HelpOutlined /></Avatar>)}
          title={inject.inject_injector_contract?.injector_contract_needs_executor === true ? (inject?.inject_attack_patterns?.length !== 0 ? `${inject?.inject_kill_chain_phases?.map(value => value.phase_name)?.join(', ')} /${inject?.inject_attack_patterns?.map(value => value.attack_pattern_external_id)?.join(', ')}` : t('TTP Unknown')) : inject.inject_injector_contract?.injector_contract_injector_type_name}
          action={(
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {inject?.inject_injector_contract?.injector_contract_platforms?.map(
                platform => <PlatformIcon key={platform} width={20} platform={platform} marginRight={10} />,
              )}
            </div>
          )}
        />
        <CardContent classes={{ root: classes.injectorContractContent }}>
          {contractContent !== null ? inject.inject_title : ''}
        </CardContent>
      </Card>

      <form id="injectContentForm" onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 10 }}>
        <InjectForm control={control} disabled={!contractContent} isAtomic={isAtomic} register={register} />
        {contractContent && (
          <div className={classes.details}>
            {openDetails && (
              <InjectDefinition
                control={control}
                register={register}
                values={getValues()}
                setValue={setValue}
                getValues={key => getValues(key)}
                submitting={isSubmitting}
                inject={initialValues}
                injectorContract={contractContent}
                handleClose={handleClose}
                tagsMap={tagsMap}
                permissions={permissions}
                articlesFromExerciseOrScenario={[]}
                variablesFromExerciseOrScenario={[]}
                onUpdateInject={onUpdateInject}
                setInjectDetailsState={setInjectDetailsState}
                uriVariable=""
                allUsersNumber={0}
                usersNumber={0}
                teamsUsers={[]}
                isAtomic={isAtomic}
                {...props}
              />
            )}
            <div className={classes.openDetails} onClick={toggleInjectContent}>
              {openDetails ? <ArrowDropUpOutlined fontSize="large" /> : <ArrowDropDownOutlined fontSize="large" />}
              {t('Inject content')}
            </div>
          </div>
        )}
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
            disabled={isSubmitting || Object.keys(errors).length > 0 || !contractContent}
          >
            {t('Update')}
          </Button>
        </div>
      </form>
    </>
  );
};

export default UpdateInjectDetails;
