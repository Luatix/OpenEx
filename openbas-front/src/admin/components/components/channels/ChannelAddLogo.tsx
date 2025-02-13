import { Button } from '@mui/material';
import { type FunctionComponent, useEffect, useState } from 'react';

import { fetchDocuments } from '../../../../actions/Document';
import FileTransferDialog from '../../../../components/fields/FileTransferDialog';
import { useFormatter } from '../../../../components/i18n';
import { type RawDocument } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import useDataLoader from '../../../../utils/hooks/useDataLoader';

interface Props {
  handleAddLogo: (documentId: string) => void;
}

const ChannelAddLogo: FunctionComponent<Props> = ({ handleAddLogo }) => {
  const { t } = useFormatter();
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<RawDocument | null>(null);

  useDataLoader(() => {
    dispatch(fetchDocuments());
  });

  useEffect(() => {
    if (selectedDocument && selectedDocument.document_id) {
      handleAddLogo(selectedDocument.document_id);
    }
  }, [selectedDocument]);

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <div>
      <Button
        variant="outlined"
        color="secondary"
        onClick={handleOpen}
        style={{ marginTop: 20 }}
      >
        {t('Change logo')}
      </Button>
      {open && (
        <FileTransferDialog
          label={t('Select an image')}
          open={open}
          setOpen={setOpen}
          onAddDocument={setSelectedDocument}
          extensions={['png', 'jpg', 'jpeg', 'svg', 'gif']}
        >
        </FileTransferDialog>
      )}
    </div>
  );
};

export default ChannelAddLogo;
