import React, { FunctionComponent, useState } from 'react';
import { useAppDispatch } from '../../../../utils/hooks';
import { updateAssetsOnAssetGroup } from '../../../../actions/asset_groups/assetgroup-action';
import ButtonCreate from '../../../../components/common/ButtonCreate';
import EndpointsDialogAdding from '../endpoints/EndpointsDialogAdding';
import { useFormatter } from '../../../../components/i18n';
import type { UserStore } from '../../teams/players/Player';
import { AssetGroupStore } from './AssetGroup';

interface Props {
  assetGroupId: string;
  assetGroupEndpointIds: string[];
  onUpdate?: (result: AssetGroupStore) => void;
}

const AssetGroupAddEndpoints: FunctionComponent<Props> = ({
  assetGroupId,
  assetGroupEndpointIds,
  onUpdate,
}) => {
  // Standard hooks
  const dispatch = useAppDispatch();
  const { t } = useFormatter();

  // Dialog
  const [open, setOpen] = useState(false);

  const onClose = () => setOpen(false);

  const onSubmit = (endpointIds: string[]) => {
    return dispatch(updateAssetsOnAssetGroup(assetGroupId, {
      asset_group_assets: endpointIds,
    })).then(
      (result: { result: string, entities: { asset_groups: Record<string, UserStore> } }) => {
        if (result.result) {
          if (onUpdate) {
            const created = result.entities.asset_groups[result.result];
            onUpdate(created);
          }
          setOpen(false);
        }
        return result;
      },
    );
  };

  return (
    <>
      <ButtonCreate onClick={() => setOpen(true)} />
      <EndpointsDialogAdding initialState={assetGroupEndpointIds} open={open}
        onClose={onClose} onSubmit={onSubmit}
        title={t('Add assets in this asset group')}
      />
    </>
  );
};

export default AssetGroupAddEndpoints;
