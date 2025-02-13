import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { type FunctionComponent, useState } from 'react';

import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';

interface Props {
  open: boolean;
  handleClose: () => void;
  handleSubmit: (exportTeams: boolean, exportPlayers: boolean, exportVariableValues: boolean) => void;
}

const ScenarioExportDialog: FunctionComponent<Props> = ({
  open,
  handleClose,
  handleSubmit,
}) => {
  // Standard hooks
  const { t } = useFormatter();

  const [exportTeams, setExportTeams] = useState(false);
  const handleToggleExportTeams = () => setExportTeams(!exportTeams);

  const [exportPlayers, setExportPlayers] = useState(false);
  const handleToggleExportPlayers = () => setExportPlayers(!exportPlayers);

  const [exportVariableValues, setExportVariableValues] = useState(false);
  const handleToggleExportVariableValues = () => setExportVariableValues(!exportVariableValues);

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={handleClose}
      PaperProps={{ elevation: 1 }}
    >
      <DialogTitle>{t('Export the scenario')}</DialogTitle>
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
                  {t('Scenario (including attached files)')}
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <Checkbox checked disabled />
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
        <Button onClick={handleClose}>{t('Cancel')}</Button>
        <Button color="secondary" onClick={() => handleSubmit(exportTeams, exportPlayers, exportVariableValues)}>
          {t('Export')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ScenarioExportDialog;
