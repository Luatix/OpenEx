import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDropDownOutlined, ArrowDropUpOutlined, HelpOutlined, HighlightOffOutlined } from '@mui/icons-material';
import { Avatar, Button, Card, CardContent, CardHeader, IconButton } from '@mui/material';
import * as R from 'ramda';
import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { makeStyles } from 'tss-react/mui';
import { z } from 'zod';

import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import { isEmptyField, isNotEmptyField } from '../../../../utils/utils';
import { PermissionsContext } from '../Context';
import InjectDefinition from './form/InjectDefinition';
import InjectForm from './form/InjectForm';
import InjectIcon from './InjectIcon';

const useStyles = makeStyles()(theme => ({
  injectorContract: {
    marginTop: 30,
    width: '100%',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
  },
  injectorContractDisabled: {
    marginTop: 30,
    width: '100%',
    border: `1px dashed ${theme.palette.divider}`,
    borderRadius: 4,
  },
  injectorContractHeader: {
    backgroundColor: theme.palette.background.default,
  },
  injectorContractHeaderDisabled: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.disabled,
  },
  injectorContractContentDisabled: {
    fontSize: 15,
    color: theme.palette.text.disabled,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  injectorContractContent: {
    fontSize: 18,
    textAlign: 'center',
  },
  details: {
    marginTop: 20,
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
}));

const CreateInjectDetails = ({
  contractId,
  contract,
  contractContent,
  handleClose,
  onCreateInject,
  setSelectedContract,
  selectedContractKillChainPhase,
  selectedContractAttackPatterns,
  isAtomic = false,
  drawerRef,
  presetValues,
  ...props
}) => {
  const { t, tPick } = useFormatter();
  const { classes } = useStyles();
  const { permissions } = useContext(PermissionsContext);
  const [openDetails, setOpenDetails] = useState(false);
  const [defaultValues, setDefaultValues] = useState({});
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
      };
      await onCreateInject(values);
    }
    handleClose();
  };

  const getInitialValues = () => {
    const initialValues = {
      inject_title: contractContent ? tPick(contractContent.label) : '',
      inject_tags: [],
      inject_depends_duration_days: presetValues?.inject_depends_duration_days ?? 0,
      inject_depends_duration_hours: presetValues?.inject_depends_duration_hours ?? 0,
      inject_depends_duration_minutes: presetValues?.inject_depends_duration_minutes ?? 0,
    };
    // Enrich initialValues with default contract value
    if (contractContent) {
      const builtInFields = [
        'teams',
        'assets',
        'assetgroups',
        'articles',
        'challenges',
        'attachments',
        'expectations',
      ];
      contractContent.fields
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
      contractContent.fields
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
    }

    return initialValues;
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
        ...Object.keys(defaultValues).reduce((acc, key) => {
          acc[key] = z.any();
          return acc;
        }, {}),
      })),
    defaultValues: getInitialValues(),
  });

  useEffect(() => {
    const initialValues = getInitialValues();
    setDefaultValues(initialValues);
    reset(initialValues, { keepDirtyValues: true });
  }, [contractContent, presetValues]);

  return (
    <>
      <Card elevation={0} classes={{ root: contractContent ? classes.injectorContract : classes.injectorContractDisabled }}>
        <CardHeader
          classes={{ root: contractContent ? classes.injectorContractHeader : classes.injectorContractHeaderDisabled }}
          avatar={contractContent ? (
            <InjectIcon
              type={contract.injector_contract_payload_type ?? contract.injector_contract_injector_type}
              isPayload={isNotEmptyField(contract?.injector_contract_payload_type)}
            />
          ) : (
            <Avatar sx={{ width: 24, height: 24 }}><HelpOutlined /></Avatar>
          )}
          action={(
            <IconButton aria-label="delete" disabled={!contractContent} onClick={() => setSelectedContract(null)}>
              <HighlightOffOutlined />
            </IconButton>
          )}
          title={selectedContractAttackPatterns!==null ? (selectedContractAttackPatterns.length!==0 ? `${selectedContractKillChainPhase} / ${selectedContractAttackPatterns[0].attack_pattern_external_id}` : contract.injector_contract_injector_name )  : t('Kill chain phase')}
        />
        <CardContent classes={{ root: contractContent ? classes.injectorContractContent : classes.injectorContractContentDisabled }}>
          {contractContent ? tPick(contractContent.label) : t('Select an inject in the left panel')}
        </CardContent>
      </Card>
      <form id="injectContentForm" onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 40 }}>
        <InjectForm control={control} register={register} disabled={!contractContent} isAtomic={isAtomic} />
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
                inject={{
                  inject_injector_contract: { injector_contract_id: contractId, injector_contract_arch: contract.injector_contract_arch },
                  inject_type: contractContent.config.type,
                  inject_teams: [],
                  inject_assets: [],
                  inject_asset_groups: [],
                  inject_documents: [],
                }}
                injectorContract={{ ...contractContent }}
                handleClose={handleClose}
                tagsMap={tagsMap}
                permissions={permissions}
                articlesFromExerciseOrScenario={[]}
                variablesFromExerciseOrScenario={[]}
                onCreateInject={onCreateInject}
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
            {t('Create')}
          </Button>
        </div>
      </form>
    </>
  );
};

export default CreateInjectDetails;
