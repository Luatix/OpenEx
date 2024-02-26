import React, { FunctionComponent, useContext, useState } from 'react';
import { Fab, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Add, ControlPointOutlined } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { useFormatter } from '../../../../components/i18n';
import Dialog from '../../../../components/common/Dialog';
import type { Theme } from '../../../../components/Theme';
import { Option } from '../../../../utils/Option';
import type { TeamInputForm } from '../../../../actions/teams/Team';
import TeamForm from './TeamForm';
import type { TeamCreateInput } from '../../../../utils/api-types';
import { addTeam } from '../../../../actions/teams/team-actions';
import { useAppDispatch } from '../../../../utils/hooks';
import { TeamContext } from '../Context';

const useStyles = makeStyles((theme: Theme) => ({
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
  },
  text: {
    fontSize: theme.typography.h2.fontSize,
    color: theme.palette.primary.main,
    fontWeight: theme.typography.h2.fontWeight,
  },
}));

interface CreateTeamProps {
  inline?: boolean;
  onCreate: (result: string) => void;
}

const CreateTeam: FunctionComponent<CreateTeamProps> = ({
  inline,
  onCreate,
}) => {
  const dispatch = useAppDispatch();
  const classes = useStyles();
  const { t } = useFormatter();
  const [openDialog, setOpenDialog] = useState(false);
  const { onCreateTeam } = useContext(TeamContext);
  const handleOpen = () => setOpenDialog(true);
  const handleClose = () => setOpenDialog(false);
  const onSubmit = async (data: TeamInputForm) => {
    const inputValues: TeamCreateInput = {
      ...data,
      team_organization: data.team_organization?.id,
      team_tags: data.team_tags?.map((tag: Option) => tag.id),
    };
    let value;
    if (inputValues.team_contextual) {
      value = await onCreateTeam!(inputValues);
    } else {
      value = await dispatch(addTeam(inputValues));
    }
    if (value.result) {
      if (onCreate) {
        onCreate(value.result);
      }
      handleClose();
    }
    return value;
  };

  return (
    <div>
      {inline ? (
        <ListItemButton divider={true} onClick={handleOpen} color="primary">
          <ListItemIcon color="primary">
            <ControlPointOutlined color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={t('Create a new team')}
            classes={{ primary: classes.text }}
          />
        </ListItemButton>
      ) : (
        <Fab
          onClick={handleOpen}
          color="primary"
          aria-label="Add"
          className={classes.createButton}
        >
          <Add />
        </Fab>
      )}
      <Dialog
        open={openDialog}
        handleClose={handleClose}
        title={t('Create a new team')}
      >
        <TeamForm
          initialValues={{ team_tags: [] }}
          handleClose={handleClose}
          onSubmit={onSubmit}
        />
      </Dialog>
    </div>
  );
};

export default CreateTeam;
