import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { type FunctionComponent, useState } from 'react';
import { useNavigate } from 'react-router';

import { deleteExercise, duplicateExercise, updateExercise } from '../../../../actions/Exercise';
import { checkExerciseTagRules } from '../../../../actions/exercises/exercise-action';
import { type TagHelper, type UserHelper } from '../../../../actions/helper';
import ButtonPopover from '../../../../components/common/ButtonPopover';
import DialogApplyTagRule from '../../../../components/common/DialogApplyTagRule';
import DialogDelete from '../../../../components/common/DialogDelete';
import DialogDuplicate from '../../../../components/common/DialogDuplicate';
import Drawer from '../../../../components/common/Drawer';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import {
  type CheckScenarioRulesOutput,
  type Exercise,
  type UpdateExerciseInput,
} from '../../../../utils/api-types';
import { usePermissions } from '../../../../utils/Exercise';
import { useAppDispatch } from '../../../../utils/hooks';
import ExerciseForm from './ExerciseForm';
import ExerciseReports from './reports/ExerciseReports';

export type ExerciseActionPopover = 'Duplicate' | 'Update' | 'Delete' | 'Export' | 'Access reports';

interface ExercisePopoverProps {
  exercise: Exercise;
  actions: ExerciseActionPopover[];
  onDelete?: (result: string) => void;
  inList?: boolean;
}

const ExercisePopover: FunctionComponent<ExercisePopoverProps> = ({
  exercise,
  actions = [],
  onDelete,
  inList = false,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Form
  const initialValues: UpdateExerciseInput = {
    exercise_name: exercise.exercise_name,
    exercise_subtitle: exercise.exercise_subtitle ?? '',
    exercise_description: exercise.exercise_description,
    exercise_category: exercise.exercise_category ?? 'attack-scenario',
    exercise_main_focus: exercise.exercise_main_focus ?? 'incident-response',
    exercise_severity: exercise.exercise_severity ?? 'high',
    exercise_tags: exercise.exercise_tags ?? [],
    exercise_mail_from: exercise.exercise_mail_from ?? '',
    exercise_mails_reply_to: exercise.exercise_mails_reply_to ?? [],
    exercise_message_header: exercise.exercise_message_header ?? '',
    exercise_message_footer: exercise.exercise_message_footer ?? '',
    apply_tag_rule: false,
  };

  // Edit
  const [openEdit, setOpenEdit] = useState(false);
  const handleOpenEdit = () => setOpenEdit(true);
  const handleCloseEdit = () => setOpenEdit(false);
  const [exerciseFormData, setExerciseFormData] = useState<UpdateExerciseInput>(initialValues);

  // Delete
  const [openDelete, setOpenDelete] = useState(false);
  const handleOpenDelete = () => setOpenDelete(true);
  const handleCloseDelete = () => setOpenDelete(false);

  const submitDelete = () => {
    dispatch(deleteExercise(exercise.exercise_id)).then(() => {
      handleCloseDelete();
      if (onDelete) onDelete(exercise.exercise_id);
    });
  };

  // Duplicate
  const [openDuplicate, setOpenDuplicate] = useState(false);
  const handleOpenDuplicate = () => setOpenDuplicate(true);
  const handleCloseDuplicate = () => setOpenDuplicate(false);

  const submitDuplicate = () => {
    dispatch(duplicateExercise(exercise.exercise_id)).then((result: { result: string; entities: { exercises: Exercise } }) => {
      handleCloseDuplicate();
      navigate(`/admin/simulations/${result.result}`);
    });
  };

  // Export
  const [openExport, setOpenExport] = useState(false);
  const [exportTeams, setExportTeams] = useState(false);
  const [exportPlayers, setExportPlayers] = useState(false);
  const [exportVariableValues, setExportVariableValues] = useState(false);
  const handleOpenExport = () => setOpenExport(true);
  const handleCloseExport = () => setOpenExport(false);

  // Reports
  const [openReports, setOpenReports] = useState(false);
  const handleOpenReports = () => setOpenReports(true);
  const handleCloseReports = () => setOpenReports(false);

  // apply rule dialog
  const [openApplyRule, setOpenApplyRule] = useState(false);
  const handleOpenApplyRule = () => setOpenApplyRule(true);
  const handleCloseApplyRule = () => setOpenApplyRule(false);

  const submitExport = () => {
    const link = document.createElement('a');
    link.href = `/api/exercises/${exercise.exercise_id}/export?isWithTeams=${exportTeams}&isWithPlayers=${exportPlayers}&isWithVariableValues=${exportVariableValues}`;
    link.click();
    handleCloseExport();
  };

  const handleToggleExportTeams = () => setExportTeams(!exportTeams);
  const handleToggleExportPlayers = () => setExportPlayers(!exportPlayers);
  const handleToggleExportVariableValues = () => setExportVariableValues(!exportVariableValues);

  const permissions = usePermissions(exercise.exercise_id);

  // Fetching data
  const { userAdmin } = useHelper((helper: TagHelper & UserHelper) => ({
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));

  // Button Popover
  const entries = [];
  if (actions.includes('Duplicate')) entries.push({ label: 'Duplicate', action: () => handleOpenDuplicate() });
  if (actions.includes('Update')) entries.push({ label: 'Update', action: () => handleOpenEdit(), disabled: !permissions.canWriteBypassStatus });
  if (actions.includes('Delete')) entries.push({ label: 'Delete', action: () => handleOpenDelete(), disabled: !userAdmin });
  if (actions.includes('Export')) entries.push({ label: 'Export', action: () => handleOpenExport() });
  if (actions.includes('Access reports')) entries.push({ label: 'Access reports', action: () => handleOpenReports() });

  const submitExerciseUpdate = (data: UpdateExerciseInput) => {
    const input = {
      exercise_name: data.exercise_name,
      exercise_subtitle: data.exercise_subtitle,
      exercise_severity: data.exercise_severity,
      exercise_category: data.exercise_category,
      exercise_description: data.exercise_description,
      exercise_main_focus: data.exercise_main_focus,
      exercise_tags: data.exercise_tags,
      exercise_start_date: data.exercise_start_date,
      exercise_mails_reply_to: data.exercise_mails_reply_to,
      exercise_mail_from: data.exercise_mail_from,
      exercise_message_header: data.exercise_message_header,
      exercise_message_footer: data.exercise_message_footer,
      apply_tag_rule: data.apply_tag_rule,

    };
    return dispatch(updateExercise(exercise.exercise_id, input)).then(() => handleCloseEdit());
  };

  const handleTagRuleChoice = (shouldApply: boolean) => {
    exerciseFormData.apply_tag_rule = shouldApply;
    submitExerciseUpdate(exerciseFormData);
    handleCloseApplyRule();
  };

  const onSubmit = (data: UpdateExerciseInput) => {
    setExerciseFormData(data);
    // before updating the exercise we are checking if tag rules could apply
    // -> if yes we ask the user to apply or not apply the rules at the update
    checkExerciseTagRules(exercise.exercise_id, data.exercise_tags ?? []).then(
      (result: { data: CheckScenarioRulesOutput }) => {
        if (result.data.rules_found) {
          handleOpenApplyRule();
        } else {
          submitExerciseUpdate(data);
        }
      },
    );
  };
  return (
    <>
      <ButtonPopover entries={entries} variant={inList ? 'icon' : 'toggle'} />
      <Drawer
        open={openEdit}
        handleClose={handleCloseEdit}
        title={t('Update simulation')}
      >
        <ExerciseForm
          onSubmit={onSubmit}
          initialValues={initialValues}
          disabled={permissions.readOnly}
          handleClose={handleCloseEdit}
          edit
        />

      </Drawer>
      <DialogApplyTagRule
        open={openApplyRule}
        handleClose={handleCloseApplyRule}
        handleApplyRule={() => handleTagRuleChoice(true)}
        handleDontApplyRule={() => handleTagRuleChoice(false)}
      />
      <Drawer
        open={openReports}
        containerStyle={{ padding: '0px' }}
        handleClose={handleCloseReports}
        title={t('Reports')}
      >
        <ExerciseReports exerciseId={exercise.exercise_id} exerciseName={exercise.exercise_name} />
      </Drawer>
      <DialogDelete
        open={openDelete}
        handleClose={handleCloseDelete}
        handleSubmit={submitDelete}
        text={`${t('Do you want to delete this simulation:')} ${exercise.exercise_name} ?`}
      />
      <DialogDuplicate
        open={openDuplicate}
        handleClose={handleCloseDuplicate}
        handleSubmit={submitDuplicate}
        text={`${t('Do you want to duplicate this simulation:')} ${exercise.exercise_name} ?`}
      />
      <Dialog
        open={openExport}
        TransitionComponent={Transition}
        onClose={handleCloseExport}
        PaperProps={{ elevation: 1 }}
      >
        <DialogTitle>{t('Export the simulation')}</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table aria-label="export table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('Elements')}</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {t('Export')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    {t('Injects (including attached files)')}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    <Checkbox checked={true} disabled={true} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t('Teams')}</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={exportTeams}
                      onChange={handleToggleExportTeams}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t('Players')}</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={exportPlayers}
                      onChange={handleToggleExportPlayers}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t('Variable values')}</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={exportVariableValues}
                      onChange={handleToggleExportVariableValues}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExport}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={submitExport}>
            {t('Export')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExercisePopover;
