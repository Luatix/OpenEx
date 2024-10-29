import { useState } from 'react';
import * as React from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { useFormatter } from '../../../../components/i18n';
import type { SecurityPlatformInput } from '../../../../utils/api-types';
import SecurityPlatformForm from './SecurityPlatformForm';
import { useAppDispatch } from '../../../../utils/hooks';
import { deleteSecurityPlatform, updateSecurityPlatform } from '../../../../actions/assets/securityPlatform-actions';
import Drawer from '../../../../components/common/Drawer';
import DialogDelete from '../../../../components/common/DialogDelete';
import Dialog from '../../../../components/common/Dialog';
import type { SecurityPlatformStore } from './SecurityPlatform';

export type SecurityPlatformStoreWithType = SecurityPlatformStore & { type: string };

interface Props {
  inline?: boolean;
  securityPlatform: SecurityPlatformStoreWithType;
  assetGroupId?: string;
  assetGroupSecurityPlatformIds?: string[];
  onRemoveSecurityPlatformFromInject?: (assetId: string) => void;
  onRemoveSecurityPlatformFromAssetGroup?: (assetId: string) => void;
  openEditOnInit?: boolean;
  onUpdate?: (result: SecurityPlatformStore) => void;
  onDelete?: (result: string) => void;
  disabled?: boolean;
}

const SecurityPlatformPopover: React.FC<Props> = ({
  inline,
  securityPlatform,
  openEditOnInit = false,
  onUpdate,
  onDelete,
  disabled,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const dispatch = useAppDispatch();

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const initialValues = (({
    asset_name,
    security_platform_type,
    asset_description,
    security_platform_logo_light,
    security_platform_logo_dark,
    asset_last_seen,
    asset_tags,
  }) => ({
    asset_name,
    asset_description,
    security_platform_type,
    security_platform_logo_light,
    security_platform_logo_dark,
    asset_last_seen: asset_last_seen ?? undefined,
    asset_tags,
  }))(securityPlatform);

  // Edition
  const [edition, setEdition] = useState(openEditOnInit);

  const handleEdit = () => {
    setEdition(true);
    setAnchorEl(null);
  };
  const submitEdit = (data: SecurityPlatformInput) => {
    dispatch(updateSecurityPlatform(securityPlatform.asset_id, data)).then(
      (result: { result: string, entities: { securityplatforms: Record<string, SecurityPlatformStore> } }) => {
        if (result.entities) {
          if (onUpdate) {
            const securityPlatformUpdated = result.entities.securityplatforms[result.result];
            onUpdate(securityPlatformUpdated);
          }
        }
        return result;
      },
    );
    setEdition(false);
  };

  // Deletion
  const [deletion, setDeletion] = useState(false);

  const handleDelete = () => {
    setDeletion(true);
    setAnchorEl(null);
  };
  const submitDelete = () => {
    dispatch(deleteSecurityPlatform(securityPlatform.asset_id)).then(
      () => {
        if (onDelete) {
          onDelete(securityPlatform.asset_id);
        }
      },
    );
    setDeletion(false);
  };

  return (
    <>
      <IconButton
        color="primary"
        onClick={(ev) => {
          ev.stopPropagation();
          setAnchorEl(ev.currentTarget);
        }}
        aria-label={`securityPlatform menu for ${securityPlatform.asset_name}`}
        aria-haspopup="true"
        size="large"
        disabled={disabled}
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={handleEdit}>
          {t('Update')}
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          {t('Delete')}
        </MenuItem>
      </Menu>
      {inline ? (
        <Dialog
          open={edition}
          handleClose={() => setEdition(false)}
          title={t('Update the security platform')}
        >
          <SecurityPlatformForm
            initialValues={initialValues}
            editing={true}
            onSubmit={submitEdit}
            handleClose={() => setEdition(false)}
          />
        </Dialog>
      ) : (
        <Drawer
          open={edition}
          handleClose={() => setEdition(false)}
          title={t('Update the security platform')}
        >
          <SecurityPlatformForm
            initialValues={initialValues}
            editing
            onSubmit={submitEdit}
            handleClose={() => setEdition(false)}
          />
        </Drawer>
      )}
      <DialogDelete
        open={deletion}
        handleClose={() => setDeletion(false)}
        handleSubmit={submitDelete}
        text={t('Do you want to delete the security platform?')}
      />
    </>
  );
};

export default SecurityPlatformPopover;
