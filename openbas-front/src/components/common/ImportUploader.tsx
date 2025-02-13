import { CloudUploadOutlined } from '@mui/icons-material';
import { CircularProgress, type CircularProgressProps, IconButton, ToggleButton, Tooltip } from '@mui/material';
import { type ChangeEvent, type FunctionComponent, useRef, useState } from 'react';

import { type UserHelper } from '../../actions/helper';
import { useHelper } from '../../store';
import { useFormatter } from '../i18n';

interface Props {
  title: string;
  handleUpload: (formData: FormData) => void;
  color?: CircularProgressProps['color'];
}

const ImportUploader: FunctionComponent<Props> = ({
  title,
  handleUpload,
  color,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [upload, setUpload] = useState(false);
  const handleOpenUpload = () => uploadRef.current && uploadRef.current.click();
  const userAdmin = useHelper((helper: UserHelper) => {
    const me = helper.getMe();
    return me?.user_admin ?? false;
  });

  const onUpload = async (file: File) => {
    setUpload(true);
    const formData = new FormData();
    formData.append('file', file);
    setUpload(false);
    handleUpload(formData);
  };

  return (
    <>
      <input
        ref={uploadRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(event: ChangeEvent) => {
          const target = event.target as HTMLInputElement;
          const file: File = (target.files as FileList)[0];
          if (target.validity.valid) {
            onUpload(file);
          }
        }}
      />
      {upload ? (
        <Tooltip
          title={`Uploading ${upload}`}
          aria-label={`Uploading ${upload}`}
        >
          <IconButton disabled={true} style={{ marginRight: 10 }}>
            <CircularProgress
              size={24}
              thickness={2}
              color={color || 'primary'}
            />
          </IconButton>
        </Tooltip>
      ) : (
        <ToggleButton
          value="import"
          aria-label="import"
          size="small"
          onClick={handleOpenUpload}
          disabled={!userAdmin}
        >
          <Tooltip
            title={t(title)}
            aria-label={title}
          >
            <CloudUploadOutlined
              color="primary"
              fontSize="small"
            />
          </Tooltip>
        </ToggleButton>
      )}
    </>
  );
};

export default ImportUploader;
