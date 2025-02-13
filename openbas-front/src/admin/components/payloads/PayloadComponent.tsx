import { Chip, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { type FunctionComponent } from 'react';
import { makeStyles } from 'tss-react/mui';

import { type AttackPatternHelper } from '../../../actions/attack_patterns/attackpattern-helper';
import { useFormatter } from '../../../components/i18n';
import ItemCopy from '../../../components/ItemCopy';
import ItemTags from '../../../components/ItemTags';
import PlatformIcon from '../../../components/PlatformIcon';
import { useHelper } from '../../../store';
import { type AttackPattern, type Command, type DnsResolution, type Executable, type FileDrop, type Payload as PayloadType, type PayloadArgument, type PayloadPrerequisite } from '../../../utils/api-types';
import { emptyFilled } from '../../../utils/String';

const useStyles = makeStyles()(() => ({
  chip: {
    fontSize: 12,
    height: 25,
    margin: '0 7px 7px 0',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 180,
  },
}));

interface Props {
  selectedPayload: PayloadType | null;
}

const PayloadComponent: FunctionComponent<Props> = ({
  selectedPayload,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const { t } = useFormatter();

  const { attackPatternsMap } = useHelper((helper: AttackPatternHelper) => ({
    attackPatternsMap: helper.getAttackPatternsMap(),
  }));

  const getAttackCommand = (payload: PayloadType | null): string => {
    if (!payload) return '';

    switch (payload.payload_type) {
      case 'Command':
        return (payload as Command).command_content || '';
      case 'Dns':
        return (payload as DnsResolution).dns_resolution_hostname || '';
      case 'File':
        return (payload as FileDrop).file_drop_file || '';
      case 'Executable':
        return (payload as Executable).executable_file || '';
      default:
        return '';
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} style={{ paddingTop: 10 }}>
        <Typography
          variant="h2"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {selectedPayload?.payload_name}
        </Typography>

        <Typography
          variant="body2"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {emptyFilled(selectedPayload?.payload_description)}
        </Typography>
      </Grid>

      <Grid item xs={6} style={{ paddingTop: 10 }}>
        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('Platforms')}
        </Typography>
        {(selectedPayload?.payload_platforms ?? []).length === 0 ? (
          <PlatformIcon platform={t('No inject in this scenario')} tooltip width={25} />
        ) : selectedPayload?.payload_platforms?.map(
          platform => <PlatformIcon key={platform} platform={platform} tooltip width={25} marginRight={10} />,
        )}
        {(selectedPayload?.payload_execution_arch) && (
          <>
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Architecture')}
            </Typography>
            {t(selectedPayload?.payload_execution_arch)}
          </>
        )}
        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('Tags')}
        </Typography>
        <ItemTags
          variant="reduced-view"
          tags={selectedPayload?.payload_tags}
        />
      </Grid>
      <Grid item xs={6} style={{ paddingTop: 10 }}>
        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('Attack patterns')}
        </Typography>
        {selectedPayload?.payload_attack_patterns && selectedPayload?.payload_attack_patterns.length === 0 ? '-' : selectedPayload?.payload_attack_patterns?.map((attackPatternId: string) => attackPatternsMap[attackPatternId]).map((attackPattern: AttackPattern) => (
          <Tooltip key={attackPattern.attack_pattern_id} title={`[${attackPattern.attack_pattern_external_id}] ${attackPattern.attack_pattern_name}`}>
            <Chip
              variant="outlined"
              classes={{ root: classes.chip }}
              color="primary"
              label={`[${attackPattern.attack_pattern_external_id}] ${attackPattern.attack_pattern_name}`}
            />
          </Tooltip>
        ))}
        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('External ID')}
        </Typography>
        {emptyFilled(selectedPayload?.payload_external_id)}
      </Grid>
      <Grid item xs={12} style={{ paddingTop: 10 }}>
        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('Command executor')}
        </Typography>
        {selectedPayload?.payload_type === 'Command' && selectedPayload.command_executor && (
          <>{selectedPayload.command_executor}</>
        )}
        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('Attack command')}
        </Typography>
        <pre>
          <ItemCopy content={getAttackCommand(selectedPayload)} />
        </pre>
        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('Arguments')}
        </Typography>
        {
          !selectedPayload?.payload_arguments?.length ? '-'
            : (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                        <TableCell width="30%">{t('Type')}</TableCell>
                        <TableCell width="30%">{t('Key')}</TableCell>
                        <TableCell width="30%">{t('Default value')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPayload?.payload_arguments?.map((argument: PayloadArgument) => {
                        return (
                          <>
                            <TableRow
                              key={argument.key}
                            >
                              <TableCell>
                                {argument.type}
                              </TableCell>
                              <TableCell>
                                {argument.key}
                              </TableCell>
                              <TableCell>
                                <pre>
                                  <ItemCopy content={argument.default_value} />
                                </pre>
                              </TableCell>
                            </TableRow>
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
        }

        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('Prerequisites')}
        </Typography>
        {
          selectedPayload?.payload_prerequisites && selectedPayload?.payload_prerequisites.length === 0 ? '-'
            : (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650, justifyContent: 'center' }}>
                    <TableHead>
                      <TableRow sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                        <TableCell width="30%">{t('Command executor')}</TableCell>
                        <TableCell width="30%">{t('Get command')}</TableCell>
                        <TableCell width="30%">{t('Check command')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPayload?.payload_prerequisites?.map((prerequisite: PayloadPrerequisite) => {
                        return (
                          <>
                            <TableRow
                              key={prerequisite.executor}
                            >
                              <TableCell>
                                {prerequisite.executor}
                              </TableCell>
                              <TableCell>
                                <pre>
                                  <ItemCopy content={prerequisite.get_command} />
                                </pre>
                              </TableCell>
                              <TableCell>
                                {prerequisite.check_command !== undefined
                                  ? (
                                      <pre>
                                        <ItemCopy content={prerequisite.check_command} />
                                      </pre>
                                    ) : '-'}

                              </TableCell>
                            </TableRow>
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
        }
        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('Cleanup executor')}
        </Typography>
        {emptyFilled(selectedPayload?.payload_cleanup_executor)}
        <Typography
          variant="h3"
          gutterBottom
          style={{ marginTop: 20 }}
        >
          {t('Cleanup command')}
        </Typography>
        {selectedPayload?.payload_cleanup_command && selectedPayload?.payload_cleanup_command.length > 0
          ? <pre><ItemCopy content={selectedPayload?.payload_cleanup_command} /></pre> : '-'}

      </Grid>
    </Grid>
  );
};

export default PayloadComponent;
