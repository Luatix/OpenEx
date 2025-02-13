import { Chip, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { type Props } from 'html-react-parser/lib/attributes-to-props';
import { type FunctionComponent, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { fetchAtomicTestingPayload } from '../../../../actions/atomic_testings/atomic-testing-actions';
import { useFormatter } from '../../../../components/i18n';
import ItemCopy from '../../../../components/ItemCopy';
import ItemTags from '../../../../components/ItemTags';
import PlatformIcon from '../../../../components/PlatformIcon';
import { type AttackPatternSimple, type PayloadArgument, type PayloadCommandBlock, type PayloadPrerequisite, type StatusPayloadOutput } from '../../../../utils/api-types';
import { emptyFilled } from '../../../../utils/String';

const useStyles = makeStyles()(() => ({
  paper: {
    position: 'relative',
    padding: 20,
    overflow: 'hidden',
    height: '100%',
  },
  chip: {
    fontSize: 12,
    height: 25,
    margin: '0 7px 7px 0',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 180,
  },
}));

const AtomicTestingPayloadInfo: FunctionComponent<Props> = () => {
  const { classes } = useStyles();
  const { t } = useFormatter();
  const { injectId } = useParams();
  const [payloadOutput, setPayloadOutput] = useState<StatusPayloadOutput>();

  // Fetching data
  useEffect(() => {
    if (injectId) {
      fetchAtomicTestingPayload(injectId).then((result: { data: StatusPayloadOutput }) => {
        setPayloadOutput(result.data);
      });
    }
  }, [injectId]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} style={{ marginBottom: 30 }}>
        <Typography variant="h4">{t('Payload')}</Typography>
        {payloadOutput ? (
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            <Typography
              variant="h2"
              gutterBottom
            >
              {payloadOutput.payload_name}
            </Typography>

            <Typography
              variant="body2"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {emptyFilled(payloadOutput.payload_description)}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Platforms')}
                </Typography>
                {(payloadOutput.payload_platforms ?? []).length === 0 ? (
                  <PlatformIcon platform={t('No inject in this scenario')} tooltip width={25} />
                ) : payloadOutput.payload_platforms?.map(
                  platform => <PlatformIcon key={platform} platform={platform} tooltip width={25} marginRight={10} />,
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Attack patterns')}
                </Typography>
                {payloadOutput.payload_attack_patterns && payloadOutput.payload_attack_patterns.length === 0 ? '-' : payloadOutput.payload_attack_patterns?.map((attackPattern: AttackPatternSimple) => (
                  <Tooltip key={attackPattern.attack_pattern_id} title={`[${attackPattern.attack_pattern_external_id}] ${attackPattern.attack_pattern_name}`}>
                    <Chip
                      variant="outlined"
                      classes={{ root: classes.chip }}
                      color="primary"
                      label={`[${attackPattern.attack_pattern_external_id}] ${attackPattern.attack_pattern_name}`}
                    />
                  </Tooltip>
                ))}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Tags')}
                </Typography>
                <ItemTags
                  variant="reduced-view"
                  tags={payloadOutput.payload_tags}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('External ID')}
                </Typography>
                {emptyFilled(payloadOutput.payload_external_id)}
              </Grid>
            </Grid>

          </Paper>
        ) : (
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            <Typography variant="body1">{t('No data available')}</Typography>
          </Paper>
        )}
      </Grid>
      <Grid item xs={12} style={{ marginBottom: 30 }}>
        <Typography variant="h4">{t('Commands')}</Typography>
        {payloadOutput ? (
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            {payloadOutput.payload_type === 'Command' && (
              <>
                <Typography
                  variant="h3"
                  gutterBottom
                >
                  {t('Command executor')}
                </Typography>
                {!payloadOutput.payload_command_blocks?.length ? '-'
                  : (
                      payloadOutput.payload_command_blocks?.map((commandBlock: PayloadCommandBlock) => {
                        return (
                          <Typography key={commandBlock.command_executor} variant="body2">
                            {emptyFilled(commandBlock.command_executor)}
                          </Typography>
                        );
                      })
                    )}
                { payloadOutput.payload_obfuscator
                && (
                  <>
                    <Typography
                      variant="h3"
                      gutterBottom
                      style={{ marginTop: 20 }}
                    >
                      {t('Obfuscator')}
                    </Typography>
                    <Typography key="obfuscator" variant="body2">
                      {payloadOutput.payload_obfuscator}
                    </Typography>
                  </>

                )}
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Attack command')}
                </Typography>
                {!payloadOutput.payload_command_blocks?.length ? '-'
                  : (
                      payloadOutput.payload_command_blocks?.map((commandBlock: PayloadCommandBlock) => {
                        return (
                          <pre key={commandBlock.command_content}>
                            <ItemCopy content={
                              commandBlock.command_content ?? ''
                            }
                            />
                          </pre>
                        );
                      })
                    )}
              </>
            )}
            {payloadOutput.payload_type === 'Executable' && (
              <>
                <Typography
                  variant="h3"
                  gutterBottom
                >
                  {t('Executable files')}
                </Typography>
                {
                  payloadOutput.executable_file !== undefined
                    ? (
                        <Typography variant="body1">
                          {payloadOutput.executable_file.document_name ?? '-'}
                        </Typography>
                      )
                    : (
                        <Typography variant="body1" gutterBottom>
                          -
                        </Typography>
                      )
                }
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Architecture')}
                </Typography>
                {payloadOutput.executable_arch}
              </>
            )}
            {payloadOutput.payload_type === 'File' && (
              <>
                <Typography
                  variant="h3"
                  gutterBottom
                >
                  {t('File drop file')}
                </Typography>
                {
                  payloadOutput.file_drop_file !== undefined
                    ? (
                        <Typography variant="body1">
                          {payloadOutput.file_drop_file.document_name ?? '-'}
                        </Typography>
                      )
                    : (
                        <Typography variant="body1" gutterBottom>
                          -
                        </Typography>
                      )
                }
              </>
            )}
            {payloadOutput.payload_type === 'Dns' && (
              <>
                <Typography
                  variant="h3"
                  gutterBottom
                >
                  {t('Dns resolution hostname')}
                </Typography>
                {payloadOutput.dns_resolution_hostname}
              </>
            )}
            {payloadOutput.payload_type === 'Network' && (
              <>
                <Typography
                  variant="h3"
                  gutterBottom
                >
                  {t('Network traffic ip destination')}
                </Typography>
                {payloadOutput.network_traffic_ip_dst}
                <Typography
                  variant="h3"
                  gutterBottom
                >
                  {t('Network traffic port destination')}
                </Typography>
                {payloadOutput.network_traffic_port_dst}
                <Typography
                  variant="h3"
                  gutterBottom
                >
                  {t('Network traffic ip source')}
                </Typography>
                {payloadOutput.network_traffic_ip_src}
                <Typography
                  variant="h3"
                  gutterBottom
                >
                  {t('Network traffic port source')}
                </Typography>
                {payloadOutput.network_traffic_port_src}
                <Typography
                  variant="h3"
                  gutterBottom
                >
                  {t('Network traffic protocol')}
                </Typography>
                {payloadOutput.network_traffic_protocol}
              </>
            )}
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Arguments')}
            </Typography>
            {
              !payloadOutput.payload_arguments?.length ? '-'
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
                          {payloadOutput.payload_arguments?.map((argument: PayloadArgument) => {
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
              !payloadOutput.payload_prerequisites?.length ? '-'
                : (
                    <TableContainer component={Paper}>
                      <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                          <TableRow sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                            <TableCell width="30%">{t('Command executor')}</TableCell>
                            <TableCell width="30%">{t('Get command')}</TableCell>
                            <TableCell width="30%">{t('Check command')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payloadOutput.payload_prerequisites?.map((prerequisite: PayloadPrerequisite) => {
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
            {emptyFilled(payloadOutput.payload_cleanup_executor)}
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Cleanup command')}
            </Typography>
            {
              payloadOutput.payload_command_blocks?.map((commandBlock: PayloadCommandBlock) => {
                return (
                  !commandBlock.payload_cleanup_command?.length
                    ? '-'
                    : (
                        <pre key={commandBlock.command_content}>
                          {
                            commandBlock.payload_cleanup_command?.map((cleanupCommand: string) => {
                              return (
                                <ItemCopy
                                  key={cleanupCommand}
                                  content={
                                    cleanupCommand
                                  }
                                />
                              );
                            })
                          }

                        </pre>
                      )

                );
              })
            }

          </Paper>
        ) : (
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            <Typography variant="body1">{t('No data available')}</Typography>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
};

export default AtomicTestingPayloadInfo;
