import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../utils/hooks';
import ImportUploader from '../../../components/common/ImportUploader';
import { importScenario } from '../../../actions/scenarios/scenario-actions';

const ImportUploaderScenario = () => {
  // Standard hooks
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleUpload = async (formData: FormData) => {
    await dispatch(importScenario(formData)).then((result: { [x: string]: string; }) => {
      if (!Object.prototype.hasOwnProperty.call(result, 'FINAL_FORM/form-error')) {
        navigate(0);
      }
    });
  };

  return (
    <ImportUploader
      title={'Import a scenario'}
      handleUpload={handleUpload}
    />
  );
};

export default ImportUploaderScenario;
