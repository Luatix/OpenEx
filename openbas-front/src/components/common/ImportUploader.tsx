import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react';
import { CircularProgress, IconButton, Tooltip, CircularProgressProps } from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';
import { useFormatter } from '../i18n';
import { useHelper } from '../../store';
import type { UsersHelper } from '../../actions/helper';

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
  const userAdmin = useHelper((helper: UsersHelper) => {
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
        <Tooltip
          title={t(title)}
          aria-label={title}
        >
          <IconButton
            onClick={handleOpenUpload}
            aria-haspopup="true"
            size="small"
            style={{ marginRight: 10 }}
            disabled={!userAdmin}
          >
            <CloudUploadOutlined />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default ImportUploader;
