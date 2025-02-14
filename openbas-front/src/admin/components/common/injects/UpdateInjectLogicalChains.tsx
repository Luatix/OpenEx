import { HelpOutlined } from '@mui/icons-material';
import { Avatar, Button, Card, CardContent, CardHeader } from '@mui/material';
import arrayMutators from 'final-form-arrays';
import * as React from 'react';
import { Form } from 'react-final-form';
import { makeStyles } from 'tss-react/mui';

import type { InjectOutputType } from '../../../../actions/injects/Inject';
import type { InjectHelper } from '../../../../actions/injects/inject-helper';
import { useFormatter } from '../../../../components/i18n';
import PlatformIcon from '../../../../components/PlatformIcon';
import { useHelper } from '../../../../store';
import type { Inject, InjectDependency } from '../../../../utils/api-types';
import { isNotEmptyField } from '../../../../utils/utils';
import InjectChainsForm from './InjectChainsForm';
import InjectIcon from './InjectIcon';

const useStyles = makeStyles()(theme => ({
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
  injectorContractHeader: {
    backgroundColor: theme.palette.background.default,
  },
}));

interface Props {
  inject: Inject;
  handleClose: () => void;
  onUpdateInject?: (data: Inject[]) => Promise<void>;
  injects?: InjectOutputType[];
}

const UpdateInjectLogicalChains: React.FC<Props> = ({ inject, handleClose, onUpdateInject, injects }) => {
  const { t, tPick } = useFormatter();
  const { classes } = useStyles();

  const { injectsMap } = useHelper((helper: InjectHelper) => ({
    injectsMap: helper.getInjectsMap(),
  }));

  const initialValues = {
    ...inject,
    inject_depends_to: injects !== undefined
      ? injects
          .filter(currentInject => currentInject.inject_depends_on !== undefined
            && currentInject.inject_depends_on !== null
            && currentInject.inject_depends_on
              .find(searchInject => searchInject.dependency_relationship?.inject_parent_id === inject.inject_id)
              !== undefined)
          .flatMap((currentInject) => {
            return currentInject.inject_depends_on;
          })
      : undefined,
    inject_depends_on: inject.inject_depends_on,
  };

  const onSubmit = async (data: Inject & { inject_depends_to: InjectDependency[] }) => {
    const injectUpdate = {
      ...data,
      inject_id: data.inject_id,
      inject_injector_contract: data.inject_injector_contract?.injector_contract_id,
      inject_depends_on: data.inject_depends_on,
    };

    const injectsToUpdate: Inject[] = [];

    const childrenIds = data.inject_depends_to.map((childrenInject: InjectDependency) => childrenInject.dependency_relationship?.inject_children_id);

    const injectsWithoutDependencies = injects
      ? injects
          .filter(currentInject => currentInject.inject_depends_on !== null
            && currentInject.inject_depends_on?.find(searchInject => searchInject.dependency_relationship?.inject_parent_id === data.inject_id) !== undefined
            && !childrenIds.includes(currentInject.inject_id))
          .map((currentInject) => {
            return {
              ...injectsMap[currentInject.inject_id],
              inject_id: currentInject.inject_id,
              inject_injector_contract: currentInject.inject_injector_contract?.injector_contract_id,
              inject_depends_on: undefined,
            } as unknown as Inject;
          })
      : [];

    injectsToUpdate.push(...injectsWithoutDependencies);

    childrenIds.forEach((childrenId) => {
      if (injects === undefined || childrenId === undefined) return;
      const children = injects.find(currentInject => currentInject.inject_id === childrenId);
      if (children !== undefined) {
        const injectDependsOnUpdate = data.inject_depends_to
          .find(dependsTo => dependsTo.dependency_relationship?.inject_children_id === childrenId);

        const injectChildrenUpdate: Inject = {
          ...injectsMap[children.inject_id],
          inject_id: children.inject_id,
          inject_injector_contract: children.inject_injector_contract?.injector_contract_id,
          inject_depends_on: injectDependsOnUpdate ? [injectDependsOnUpdate] : [],
        };
        injectsToUpdate.push(injectChildrenUpdate);
      }
    });
    if (onUpdateInject) {
      await onUpdateInject([injectUpdate as Inject, ...injectsToUpdate]);
    }

    handleClose();
  };
  const injectorContractContent = inject.inject_injector_contract?.injector_contract_content ? JSON.parse(inject.inject_injector_contract?.injector_contract_content) : undefined;
  return (
    <>
      <Card elevation={0} classes={{ root: classes.injectorContract }}>
        <CardHeader
          classes={{ root: classes.injectorContractHeader }}
          avatar={injectorContractContent
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
          {tPick(inject?.inject_injector_contract?.injector_contract_labels)}
        </CardContent>
      </Card>
      <Form
        keepDirtyOnReinitialize={true}
        initialValues={initialValues}
        onSubmit={onSubmit}
        mutators={{
          ...arrayMutators,
          setValue: ([field, value], state, { changeValue }) => {
            changeValue(state, field, () => value);
          },
        }}
      >
        {({ form, handleSubmit, values, errors }) => {
          return (
            <form id="injectContentForm" onSubmit={handleSubmit} style={{ marginTop: 10 }}>
              <InjectChainsForm
                form={form}
                values={values}
                injects={injects}
              />
              <div style={{ float: 'right', marginTop: 20 }}>
                <Button
                  variant="contained"
                  onClick={handleClose}
                  style={{ marginRight: 10 }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  type="submit"
                  disabled={errors !== undefined && Object.keys(errors).length > 0}
                >
                  {t('Update')}
                </Button>
              </div>
            </form>
          );
        }}
      </Form>
    </>
  );
};

export default UpdateInjectLogicalChains;
