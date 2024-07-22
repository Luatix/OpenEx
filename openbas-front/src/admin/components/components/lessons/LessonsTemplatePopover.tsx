import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LessonsTemplateForm from './LessonsTemplateForm';
import { useFormatter } from '../../../../components/i18n';
import { deleteLessonsTemplate, updateLessonsTemplate } from '../../../../actions/Lessons';
import type { LessonsTemplate, LessonsTemplateInput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import Drawer from '../../../../components/common/Drawer';
import DialogDelete from '../../../../components/common/DialogDelete';
import ButtonPopover from '../../../../components/common/ButtonPopover';

interface Props {
  lessonsTemplate: LessonsTemplate;
}

const LessonsTemplatePopover: React.FC<Props> = ({ lessonsTemplate }) => {
  // Standard hooks
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const initialValues = {
    lessons_template_name: lessonsTemplate.lessons_template_name,
    lessons_template_description: lessonsTemplate.lessons_template_description ?? '',
  };

  // Edition
  const [openEdit, setOpenEdit] = useState(false);
  const handleOpenEdit = () => setOpenEdit(true);
  const handleCloseEdit = () => setOpenEdit(false);
  const onSubmitEdit = (data: LessonsTemplateInput) => {
    return dispatch(
      updateLessonsTemplate(lessonsTemplate.lessonstemplate_id, data),
    ).then(() => handleCloseEdit());
  };

  // Deletion
  const [openDelete, setOpenDelete] = useState(false);
  const handleOpenDelete = () => setOpenDelete(true);
  const handleCloseDelete = () => setOpenDelete(false);
  const submitDelete = () => {
    dispatch(deleteLessonsTemplate(lessonsTemplate.lessonstemplate_id)).then(
      () => {
        navigate('/admin/components/lessons');
      },
    );
  };

  const entries = [
    { label: 'Update', action: handleOpenEdit },
    { label: 'Delete', action: handleOpenDelete },
  ];

  return (
    <>
      <ButtonPopover entries={entries} variant={'icon'} />
      <DialogDelete
        open={openDelete}
        handleClose={handleCloseDelete}
        handleSubmit={submitDelete}
        text={t('Do you want to delete this lessons learned template?')}
      />
      <Drawer
        open={openEdit}
        handleClose={handleCloseEdit}
        title={t('Update the lessons learned template')}
      >
        <LessonsTemplateForm
          onSubmit={onSubmitEdit}
          handleClose={handleCloseEdit}
          initialValues={initialValues}
          editing
        />
      </Drawer>
    </>
  );
};

export default LessonsTemplatePopover;
