import { AddOutlined, RouteOutlined } from '@mui/icons-material';
import { Autocomplete, Box, Dialog, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import * as R from 'ramda';
import { type FunctionComponent, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { type AttackPatternHelper } from '../actions/attack_patterns/attackpattern-helper';
import { addAttackPattern } from '../actions/AttackPattern';
import { type UserHelper } from '../actions/helper';
import { type KillChainPhaseHelper } from '../actions/kill_chain_phases/killchainphase-helper';
import AttackPatternForm from '../admin/components/settings/attack_patterns/AttackPatternForm';
import { useHelper } from '../store';
import { type AttackPattern, type AttackPatternCreateInput } from '../utils/api-types';
import { useAppDispatch } from '../utils/hooks';
import { type Option } from '../utils/Option';
import { useFormatter } from './i18n';

const useStyles = makeStyles()(() => ({
  icon: {
    paddingTop: 4,
    display: 'inline-block',
  },
  text: {
    display: 'inline-block',
    flexGrow: 1,
    marginLeft: 10,
  },
  autoCompleteIndicator: {
    display: 'none',
  },
}));

interface Props {
  fieldValues: string[];
  label: string;
  useExternalId?: string;
  onChange: (id: string[]) => void;
}

type AttackPatternCreateInputForm = Omit<AttackPatternCreateInput, 'attack_pattern_kill_chain_phases'> & { attack_pattern_kill_chain_phases?: Option[] };

const AttackPatternField: FunctionComponent<Props> = ({
  fieldValues,
  label,
  useExternalId,
  onChange,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const { t } = useFormatter();
  const dispatch = useAppDispatch();

  // Fetching data
  const { attackPatterns, killChainPhasesMap, userAdmin } = useHelper((helper: AttackPatternHelper & KillChainPhaseHelper & UserHelper) => ({
    attackPatterns: helper.getAttackPatterns(),
    killChainPhasesMap: helper.getKillChainPhasesMap(),
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));

  const [attackPatternCreation, setAttackPatternCreation] = useState(false);

  const handleOpenAttackPatternCreation = () => {
    setAttackPatternCreation(true);
  };

  const handleCloseAttackPatternCreation = () => {
    setAttackPatternCreation(false);
  };

  const onSubmit = (data: AttackPatternCreateInputForm) => {
    const inputValues: AttackPatternCreateInput = {
      ...data,
      attack_pattern_kill_chain_phases: data.attack_pattern_kill_chain_phases?.map(k => k.id),
    };
    dispatch(addAttackPattern(inputValues)).then((result: { result: string; entities: { attackpatterns: Record<string, AttackPattern> } }) => {
      if (result.result) {
        const newAttackPattern = result.entities.attackpatterns[result.result];
        const newAttackPatterns = [...fieldValues, useExternalId ? newAttackPattern.attack_pattern_external_id : newAttackPattern.attack_pattern_id];
        onChange(newAttackPatterns);
        return handleCloseAttackPatternCreation();
      }
      return result;
    });
  };

  const attackPatternsOptions = attackPatterns.map(
    (n: AttackPattern) => {
      const killChainPhase = R.head(n.attack_pattern_kill_chain_phases);
      const killChainName = killChainPhase ? killChainPhasesMap[killChainPhase]?.phase_kill_chain_name ?? null : null;
      return {
        id: useExternalId ? n.attack_pattern_external_id : n.attack_pattern_id,
        label: killChainName ? `[${killChainName}] [${n.attack_pattern_external_id}] ${n.attack_pattern_name}` : `[${n.attack_pattern_external_id}] ${n.attack_pattern_name}`,
      };
    },
  );

  const openCreate = () => {
    if (userAdmin) {
      handleOpenAttackPatternCreation();
    }
  };

  return (
    <>
      <Autocomplete
        size="small"
        multiple
        options={attackPatternsOptions}
        openOnFocus
        autoHighlight
        noOptionsText={t('No available options')}
        disableClearable
        renderInput={
          params => (
            <TextField
              {...params}
              label={t(label)}
              fullWidth
              style={{ marginTop: 20 }}
              variant="standard"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {
                      typeof openCreate === 'function' && (
                        <IconButton
                          onClick={() => openCreate()}
                          style={{ position: 'absolute', top: '-8px', right: '22px' }}
                        >
                          <AddOutlined />
                        </IconButton>
                      )
                    }
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )
        }
        value={attackPatternsOptions.filter((a: { id: string; label: string }) => fieldValues?.includes(a.id)) ?? null}
        onChange={(_event, pattern) => {
          onChange(pattern.map(p => p.id));
        }}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <div className={classes.icon}>
              <RouteOutlined />
            </div>
            <div className={classes.text}>{option.label}</div>
          </Box>
        )}
        classes={{ clearIndicator: classes.autoCompleteIndicator }}
      />
      {userAdmin && (
        <Dialog
          open={attackPatternCreation}
          onClose={handleCloseAttackPatternCreation}
          PaperProps={{ elevation: 1 }}
        >
          <DialogTitle>{t('Create a new attack pattern')}</DialogTitle>
          <DialogContent>
            <AttackPatternForm
              onSubmit={onSubmit}
              handleClose={handleCloseAttackPatternCreation}
              initialValues={{ attack_pattern_kill_chain_phases: [] }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AttackPatternField;
