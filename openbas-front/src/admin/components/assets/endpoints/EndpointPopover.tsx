import * as React from 'react';
import { useState } from 'react';

import { updateAssetsOnAssetGroup } from '../../../../actions/asset_groups/assetgroup-action';
import { deleteEndpoint, updateEndpoint } from '../../../../actions/assets/endpoint-actions';
import ButtonPopover from '../../../../components/common/ButtonPopover';
import Dialog from '../../../../components/common/Dialog';
import DialogDelete from '../../../../components/common/DialogDelete';
import Drawer from '../../../../components/common/Drawer';
import { useFormatter } from '../../../../components/i18n';
import type { EndpointOverviewOutput, EndpointUpdateInput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import EndpointForm from './EndpointForm';
import { EndpointStoreWithType } from './EndpointsList';

interface Props {
  inline?: boolean;
  endpoint: EndpointStoreWithType;
  assetGroupId?: string;
  assetGroupEndpointIds?: string[];
  onRemoveEndpointFromInject?: (assetId: string) => void;
  onRemoveEndpointFromAssetGroup?: (assetId: string) => void;
  openEditOnInit?: boolean;
  onUpdate?: (result: EndpointOverviewOutput) => void;
  onDelete?: (result: string) => void;
}

const EndpointPopover: React.FC<Props> = ({
  inline,
  endpoint,
  assetGroupId,
  assetGroupEndpointIds,
  onRemoveEndpointFromInject,
  onRemoveEndpointFromAssetGroup,
  openEditOnInit = false,
  onUpdate,
  onDelete,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const dispatch = useAppDispatch();

  const initialValues = {
    asset_name: endpoint.asset_name,
    asset_description: endpoint.asset_description ?? '',
    asset_tags: endpoint.asset_tags,
  };

  // Edition
  const [edition, setEdition] = useState(openEditOnInit);

  const handleEdit = () => {
    setEdition(true);
  };
  const submitEdit = (data: EndpointUpdateInput) => {
    dispatch(updateEndpoint(endpoint.asset_id, data)).then(
      (result: { result: string; entities: { endpoints: Record<string, EndpointOverviewOutput> } }) => {
        if (result.entities) {
          if (onUpdate) {
            const endpointUpdated = result.entities.endpoints[result.result];
            onUpdate(endpointUpdated);
          }
        }
        return result;
      },
    );
    setEdition(false);
  };

  // Removal
  const [removalFromAssetGroup, setRemovalFromAssetGroup] = useState(false);

  const handleRemoveFromAssetGroup = () => {
    setRemovalFromAssetGroup(true);
  };
  const submitRemoveFromAssetGroup = () => {
    if (assetGroupId) {
      dispatch(
        updateAssetsOnAssetGroup(assetGroupId, {
          asset_group_assets: assetGroupEndpointIds?.filter(id => id !== endpoint.asset_id),
        }),
      ).then(() => {
        if (onRemoveEndpointFromAssetGroup) {
          onRemoveEndpointFromAssetGroup(endpoint.asset_id);
        }
        setRemovalFromAssetGroup(false);
      });
    }
  };

  // Deletion
  const [deletion, setDeletion] = useState(false);

  const handleDelete = () => {
    setDeletion(true);
  };
  const submitDelete = () => {
    dispatch(deleteEndpoint(endpoint.asset_id)).then(
      () => {
        if (onDelete) {
          onDelete(endpoint.asset_id);
        }
      },
    );
    setDeletion(false);
  };

  // Button Popover
  const entries = [];
  if (onUpdate) entries.push({ label: 'Update', action: () => handleEdit() });
  if (onRemoveEndpointFromInject) entries.push({ label: 'Remove from the inject', action: () => onRemoveEndpointFromInject(endpoint.asset_id) });
  if ((assetGroupId && endpoint.type !== 'dynamic')) entries.push({ label: 'Remove from the asset group', action: () => handleRemoveFromAssetGroup() });
  if (onDelete) entries.push({ label: 'Delete', action: () => handleDelete() });

  return entries.length > 0 && (
    <>
      <ButtonPopover entries={entries} variant={inline ? 'icon' : 'toggle'} />
      {inline ? (
        <Dialog
          open={edition}
          handleClose={() => setEdition(false)}
          title={t('Update the endpoint')}
        >
          <EndpointForm
            initialValues={initialValues}
            editing
            onSubmit={submitEdit}
            handleClose={() => setEdition(false)}
          />
        </Dialog>
      ) : (
        <Drawer
          open={edition}
          handleClose={() => setEdition(false)}
          title={t('Update the endpoint')}
        >
          <EndpointForm
            initialValues={initialValues}
            editing
            onSubmit={submitEdit}
            handleClose={() => setEdition(false)}
          />
        </Drawer>
      )}
      <DialogDelete
        open={removalFromAssetGroup}
        handleClose={() => setRemovalFromAssetGroup(false)}
        handleSubmit={submitRemoveFromAssetGroup}
        text={t('Do you want to remove the endpoint from the asset group?')}
      />
      <DialogDelete
        open={deletion}
        handleClose={() => setDeletion(false)}
        handleSubmit={submitDelete}
        text={`${t('Do you want to delete the endpoint:')} ${endpoint.asset_name} ?`}
      />
    </>
  );
};

export default EndpointPopover;
