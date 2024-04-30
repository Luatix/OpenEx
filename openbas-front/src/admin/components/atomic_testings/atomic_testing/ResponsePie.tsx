import Chart from 'react-apexcharts';
import React, { FunctionComponent } from 'react';
import { makeStyles, useTheme } from '@mui/styles';
import { Box, Button, Typography } from '@mui/material';
import { InfoOutlined, SensorOccupied, Shield, TrackChanges } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useFormatter } from '../../../../components/i18n';
import type { ExpectationResultsByType, ResultDistribution } from '../../../../utils/api-types';
import type { Theme } from '../../../../components/Theme';

const useStyles = makeStyles(() => ({
  inline: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  chartContainer: {
    position: 'relative',
    width: '350px',
    height: '350px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContainer: {
    display: 'flex',
    gap: '8',
    placeContent: 'center',
    placeItems: 'center',
  },
  chartTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  iconOverlay: {
    position: 'absolute',
    top: '36%',
    left: '43%',
    fontSize: '50px',
  },
}));

interface Props {
  expectations: ExpectationResultsByType[];
  humanValidationLink?: string;
}

const ResponsePie: FunctionComponent<Props> = ({
  expectations,
  humanValidationLink,
}) => {
  // Standard hooks
  const classes = useStyles();
  const { t } = useFormatter();
  const theme = useTheme<Theme>();

  // Sytle
  const getColor = (result: string | undefined): string => {
    const colorMap: Record<string, string> = {
      Blocked: 'rgb(107, 235, 112)',
      Detected: 'rgb(107, 235, 112)',
      Successful: 'rgb(107, 235, 112)',
      Pending: 'rgb(128,128,128)',
    };

    return colorMap[result ?? ''] ?? 'rgb(220, 81, 72)';
  };

  const getChartIcon = (type: 'PREVENTION' | 'DETECTION' | 'HUMAN_RESPONSE' | undefined) => {
    switch (type) {
      case 'PREVENTION':
        return <Shield className={classes.iconOverlay} />;
      case 'DETECTION':
        return <TrackChanges className={classes.iconOverlay} />;
      default:
        return <SensorOccupied className={classes.iconOverlay} />;
    }
  };

  const getTotal = (distribution: ResultDistribution[]) => {
    return distribution.reduce((sum, item) => sum + (item.value!), 0)!;
  };

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
        },
      },
    },
    legend: {
      position: 'bottom',
      show: true,
      labels: {
        colors: theme.palette.mode === 'dark' ? ['rgb(202,203,206)', 'rgb(202,203,206)', 'rgb(202,203,206)'] : [],
      },
    },
    stroke: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
  };

  return (
    <Box margin={1}> {
      <div className={classes.inline}>
        {expectations?.map((expectation, index) => {
          const pending = expectation.distribution?.filter((res) => res.label === 'Pending' && (res.value ?? 0) > 0) ?? [];
          const displayHumanValidationBtn = humanValidationLink && expectation.type === 'HUMAN_RESPONSE' && (pending.length > 0);
          return (
            <div key={index} className={classes.container}>
              <div className={classes.chartContainer}>
                <Typography variant="h1"
                  className={classes.chartTitle}
                >{t(`TYPE_${expectation.type}`)}</Typography>
                {getChartIcon(expectation.type)}
                {expectation.distribution && expectation.distribution.length > 0 ? (
                  <Chart
                    key={index}
                    options={{
                      ...chartOptions,
                      labels: expectation.distribution.map((e) => `${t(e.label)} (${(((e.value!) / getTotal(expectation.distribution!)) * 100).toFixed(1)}%)`),
                      colors: expectation.distribution.map((e) => getColor(e.label)),
                    }}
                    series={expectation.distribution.map((e) => (e.value!))}
                    type="donut"
                    width="100%"
                    height="100%"
                  />
                ) : (
                  <Chart
                    options={{
                      ...chartOptions,
                      colors: ['rgba(202,203,206,0.18)'],
                      labels: [t('Unknown Data')],
                    }}
                    series={[1]}
                    type="donut"
                    width="100%"
                    height="100%"
                  />
                )}
              </div>
              {displayHumanValidationBtn
                && <div className={classes.btnContainer}>
                  <InfoOutlined color="primary" />
                  <Button
                    color="primary"
                    component={Link}
                    to={humanValidationLink}
                  >
                    {`${pending.length} ${t('validations needed')}`}
                  </Button>
                </div>
              }
            </div>
          );
        })}
        {!expectations || expectations.length === 0 ? (
          <div className={classes.chartContainer}>
            <Chart
              options={{
                ...chartOptions,
                colors: ['rgba(202,203,206,0.18)'],
                labels: [t('No data available')],
              }}
              series={[1]}
              type="donut"
              width="100%"
              height="100%"
            />
          </div>
        ) : null}
      </div>
    }
    </Box>
  );
};

export default ResponsePie;
