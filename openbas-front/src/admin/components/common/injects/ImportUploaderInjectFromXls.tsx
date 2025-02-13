import { CloudUploadOutlined } from '@mui/icons-material';
import { ToggleButton, Tooltip } from '@mui/material';
import { useContext, useState } from 'react';

import { storeXlsFile } from '../../../../actions/mapper/mapper-actions';
import Dialog from '../../../../components/common/Dialog';
import { useFormatter } from '../../../../components/i18n';
import { type ImportMessage, type ImportPostSummary, type ImportTestSummary, type InjectsImportInput } from '../../../../utils/api-types';
import { MESSAGING$ } from '../../../../utils/Environment';
import { InjectContext } from '../Context';
import ImportUploaderInjectFromXlsFile from './ImportUploaderInjectFromXlsFile';
import ImportUploaderInjectFromXlsInjects from './ImportUploaderInjectFromXlsInjects';

interface Props {
  onImportedInjects?: () => void;
}

const ImportUploaderInjectFromXls = ({ onImportedInjects = () => {} }: Props) => {
  // Standard hooks
  const { t } = useFormatter();
  const injectContext = useContext(InjectContext);

  const [importId, setImportId] = useState<string | undefined>(undefined);
  const [sheets, setSheets] = useState<string[]>([]);

  // Dialog
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setImportId(undefined);
    setSheets([]);
    setOpen(false);
  };

  const onSubmitImportFile = (values: { file: File }) => {
    storeXlsFile(values.file).then((result: { data: ImportPostSummary }) => {
      const { data } = result;
      setImportId(data.import_id);
      setSheets(data.available_sheets);
    });
  };

  const onSubmitImportInjects = (input: InjectsImportInput) => {
    if (importId) {
      injectContext.onImportInjectFromXls?.(importId, input).then((value: ImportTestSummary) => {
        const criticalMessages = value.import_message?.filter((importMessage: ImportMessage) => importMessage.message_level === 'CRITICAL');
        if (criticalMessages && criticalMessages?.length > 0) {
          MESSAGING$.notifyError(t(criticalMessages[0].message_code), true);
        }
        onImportedInjects();
        handleClose();
      });
    }
  };

  return (
    <>
      <ToggleButton
        value="import"
        aria-label="import"
        size="small"
        onClick={handleOpen}
      >
        <Tooltip
          title={t('Import injects')}
          aria-label="Import injects"
        >
          <CloudUploadOutlined
            color="primary"
            fontSize="small"
          />
        </Tooltip>
      </ToggleButton>
      <Dialog
        open={open}
        handleClose={handleClose}
        title={t('Import injects')}
        maxWidth="sm"
      >
        <>
          {!importId
          && (
            <ImportUploaderInjectFromXlsFile
              handleClose={handleClose}
              handleSubmit={onSubmitImportFile}
            />
          )}
          {importId
          && (
            <ImportUploaderInjectFromXlsInjects
              sheets={sheets}
              handleClose={handleClose}
              importId={importId}
              handleSubmit={onSubmitImportInjects}
            />
          )}
        </>
      </Dialog>
    </>
  );
};

export default ImportUploaderInjectFromXls;
