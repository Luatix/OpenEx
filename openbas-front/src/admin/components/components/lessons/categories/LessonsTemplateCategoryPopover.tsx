import React, { FunctionComponent, useState } from 'react';
import LessonsTemplateCategoryForm from './LessonsTemplateCategoryForm';
import { useFormatter } from '../../../../../components/i18n';
import { deleteLessonsTemplateCategory, updateLessonsTemplateCategory } from '../../../../../actions/Lessons';
import type { LessonsTemplateCategory, LessonsTemplateCategoryInput } from '../../../../../utils/api-types';
import DialogDelete from '../../../../../components/common/DialogDelete';
import Drawer from '../../../../../components/common/Drawer';
import ButtonPopover from '../../../../../components/common/ButtonPopover';
import { useAppDispatch } from '../../../../../utils/hooks';

interface Props {
  lessonsTemplateId: string;
  lessonsTemplateCategory: LessonsTemplateCategory;
}

const LessonsTemplateCategoryPopover: FunctionComponent<Props> = ({
  lessonsTemplateId,
  lessonsTemplateCategory,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const dispatch = useAppDispatch();

  const initialValues = {
    lessons_template_category_name: lessonsTemplateCategory.lessons_template_category_name,
    lessons_template_category_description: lessonsTemplateCategory.lessons_template_category_description,
    lessons_template_category_order: lessonsTemplateCategory.lessons_template_category_order,
  };

  // Edition
  const [openEdit, setOpenEdit] = useState(false);
  const handleOpenEdit = () => setOpenEdit(true);
  const handleCloseEdit = () => setOpenEdit(false);
  const onSubmitEdit = (data: LessonsTemplateCategoryInput) => {
    return dispatch(
      updateLessonsTemplateCategory(
        lessonsTemplateId,
        lessonsTemplateCategory.lessonstemplatecategory_id,
        data,
      ),
    ).then(() => handleCloseEdit());
  };

  // Deletion
  const [openDelete, setOpenDelete] = useState(false);
  const handleOpenDelete = () => setOpenDelete(true);
  const handleCloseDelete = () => setOpenDelete(false);
  const submitDelete = () => {
    dispatch(
      deleteLessonsTemplateCategory(
        lessonsTemplateId,
        lessonsTemplateCategory.lessonstemplatecategory_id,
      ),
    ).then(() => handleCloseDelete());
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
        text={t('Do you want to delete this lessons learned category?')}
      />
      <Drawer
        open={openEdit}
        handleClose={handleCloseEdit}
        title={t('Update the lessons learned category')}
      >
        <LessonsTemplateCategoryForm
          onSubmit={onSubmitEdit}
          handleClose={handleCloseEdit}
          initialValues={initialValues}
          editing
        />
      </Drawer>
    </>
  );
};

export default LessonsTemplateCategoryPopover;
