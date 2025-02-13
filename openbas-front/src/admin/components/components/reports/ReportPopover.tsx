import { type FunctionComponent, useContext, useState } from 'react';

import ButtonPopover, { type VariantButtonPopover } from '../../../../components/common/ButtonPopover';
import Dialog from '../../../../components/common/Dialog';
import DialogDelete from '../../../../components/common/DialogDelete';
import { useFormatter } from '../../../../components/i18n';
import { type Report, type ReportInput } from '../../../../utils/api-types';
import { ReportContext } from '../../common/Context';

type ReportActionType = 'Update' | 'Delete';

interface Props {
  actions: ReportActionType[];
  report: Report;
  variant?: VariantButtonPopover;
}

const ReportPopover: FunctionComponent<Props> = ({
  report,
  actions,
  variant = 'icon',
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const { onDeleteReport, renderReportForm, onUpdateReport } = useContext(ReportContext);

  // Update
  const [openEdit, setOpenEdit] = useState(false);
  const handleCloseEdit = () => setOpenEdit(false);
  const submitUpdate = (data: ReportInput) => {
    onUpdateReport(report.report_id, data);
    setOpenEdit(false);
  };

  // Deletion
  const [openDelete, setOpenDelete] = useState(false);
  const submitDelete = () => {
    onDeleteReport(report);
    setOpenDelete(false);
  };

  // Button Popover
  const entries = [];
  if (actions.includes('Update')) entries.push({ label: 'Update', action: () => setOpenEdit(true) });
  if (actions.includes('Delete')) entries.push({ label: 'Delete', action: () => setOpenDelete(true) });

  return (
    <>
      <ButtonPopover entries={entries} variant={variant} />
      <DialogDelete
        open={openDelete}
        handleClose={() => setOpenDelete(false)}
        handleSubmit={submitDelete}
        text={t('Do you want to delete this report ?')}
      />
      <Dialog
        title={t('Update the report')}
        open={openEdit}
        handleClose={handleCloseEdit}
      >
        {renderReportForm(submitUpdate, handleCloseEdit, report)}
      </Dialog>
    </>
  );
};

export default ReportPopover;
