import { type FunctionComponent, useState } from 'react';

import { deleteTagRule } from '../../../../actions/tag_rules/tagrule-actions';
import { type PopoverEntry } from '../../../../components/common/ButtonPopover';
import DialogDelete from '../../../../components/common/DialogDelete';
import Drawer from '../../../../components/common/Drawer';
import IconPopover from '../../../../components/common/IconPopover';
import { useFormatter } from '../../../../components/i18n';
import { type TagRuleOutput } from '../../../../utils/api-types';
import OPEN_CTI_TAG_NAME from './TagRuleConstants';
import TagRuleUpdate from './TagRuleUpdate';

interface Props {
  onDelete?: (result: string) => void;
  onUpdate?: (result: TagRuleOutput) => void;
  tagRule: TagRuleOutput;
}
const TagRulePopover: FunctionComponent<Props> = ({
  onDelete, onUpdate,
  tagRule,
}) => {
  const { t } = useFormatter();

  // Edition
  const [openEdit, setOpenEdit] = useState(false);
  const handleOpenEdit = () => setOpenEdit(true);
  const handleCloseEdit = () => setOpenEdit(false);

  // Deletion
  const [openDelete, setOpenDelete] = useState(false);
  const handleOpenDelete = () => setOpenDelete(true);
  const handleCloseDelete = () => setOpenDelete(false);
  const submitDelete = () => {
    deleteTagRule(tagRule.tag_rule_id);
    if (onDelete) {
      onDelete(tagRule.tag_rule_id);
    }
    handleCloseDelete();
  };

  const entries: PopoverEntry[] = [
    { label: 'Update', action: handleOpenEdit },
  ];

  // we don't allow the deletion of the rule with the tag opencti
  if (tagRule.tag_name != OPEN_CTI_TAG_NAME) {
    entries.push({ label: 'Delete', action: handleOpenDelete });
  }

  return (
    <>
      <IconPopover entries={entries} />

      <Drawer
        open={openEdit}
        handleClose={handleCloseEdit}
        title={t('Update the asset rule')}
      >
        <TagRuleUpdate
          tagRule={tagRule}
          onUpdate={onUpdate}
          handleClose={handleCloseEdit}
        />
      </Drawer>
      <DialogDelete
        open={openDelete}
        handleClose={handleCloseDelete}
        handleSubmit={submitDelete}
        text={t('Do you want to delete this asset rule ?')}
      />
    </>
  );
};

export default TagRulePopover;
