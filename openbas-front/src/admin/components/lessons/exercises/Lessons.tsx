import {
  BallotOutlined,
  ContactMailOutlined,
  ContentPasteGoOutlined,
  DeleteSweepOutlined,
  SpeakerNotesOutlined,
  SportsScoreOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  Link,
  Paper,
  Radio,
  RadioGroup,
  Switch,
  Typography,
  useTheme,
} from '@mui/material';
import * as R from 'ramda';
import { ChangeEvent, FunctionComponent, useContext, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import type { Inject, LessonsAnswer, LessonsCategory, LessonsQuestion, LessonsSendInput, LessonsTemplate, Objective, Team, User } from '../../../../utils/api-types';
import { LessonContext } from '../../common/Context';
import CreateLessonsTemplate from '../../components/lessons/CreateLessonsTemplate';
import CreateLessonsCategory from '../categories/CreateLessonsCategory';
import ObjectiveEvaluations from '../ObjectiveEvaluations';
import SendLessonsForm from '../SendLessonsForm';
import AnswersByQuestionDialog from './AnswersByQuestionDialog';
import LessonsCategories from './LessonsCategories';
import LessonsObjectives from './LessonsObjectives';

const useStyles = makeStyles()(theme => ({
  metric: {
    position: 'relative',
    padding: 20,
    height: 100,
    overflow: 'hidden',
  },
  title: {
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: 500,
    color: theme.palette.secondary.main,
  },
  number: {
    fontSize: 30,
    fontWeight: 800,
    float: 'left',
  },
  icon: {
    position: 'absolute',
    top: 25,
    right: 15,
  },
  paper: {
    position: 'relative',
    padding: 0,
    overflow: 'hidden',
    height: '100%',
  },
  paperPadding: {
    position: 'relative',
    padding: '20px 20px 0 20px',
    overflow: 'hidden',
    height: '100%',
  },
}));

interface GenericSource {
  id: string;
  type: string;
  name: string;
  score: number;
  lessons_answers_number: number;
  communications_number: number;
  start_date: string;
  end_date: string;
  users_number: number;
  logs_number: number;
  lessons_anonymized: boolean;
  isReadOnly: boolean;
  isUpdatable: boolean;
}

interface Props {
  source: GenericSource;
  objectives: Objective[];
  injects: Inject[];
  teamsMap: Record<string, Team>;
  teams: Team[];
  lessonsCategories: LessonsCategory[];
  lessonsQuestions: LessonsQuestion[];
  lessonsAnswers: LessonsAnswer[];
  lessonsTemplates: LessonsTemplate[];
  usersMap: Record<string, User>;
}

const Lessons: FunctionComponent<Props> = ({
  source,
  objectives,
  injects,
  teams,
  teamsMap,
  lessonsCategories,
  lessonsQuestions,
  lessonsAnswers,
  lessonsTemplates,
  usersMap,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const theme = useTheme();
  const { t, nsdt } = useFormatter();

  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [openApplyTemplate, setOpenApplyTemplate] = useState<boolean>(false);
  const [openResetAnswers, setOpenResetAnswers] = useState<boolean>(false);
  const [openEmptyLessons, setOpenEmptyLessons] = useState<boolean>(false);
  const [openSendLessons, setOpenSendLessons] = useState<boolean>(false);
  const [openAnonymize, setOpenAnonymize] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = useState<LessonsQuestion | null>(null);
  const [templateValue, setTemplateValue] = useState<string | null>(null);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTemplateValue(event.target.value);
  };

  // Context
  const {
    onApplyLessonsTemplate,
    onResetLessonsAnswers,
    onEmptyLessonsCategories,
    onUpdateSourceLessons,
    onSendLessons,
  } = useContext(LessonContext);

  const applyTemplate = async () => {
    if (templateValue !== null) {
      await onApplyLessonsTemplate(templateValue);
      return setOpenApplyTemplate(false);
    }
    return setOpenApplyTemplate(true);
  };
  const resetAnswers = async () => {
    if (onResetLessonsAnswers) {
      await onResetLessonsAnswers();
    }
    return setOpenResetAnswers(false);
  };
  const emptyLessons = async () => {
    await onEmptyLessonsCategories();
    return setOpenEmptyLessons(false);
  };
  const toggleAnonymize = async () => {
    const updatedSource = { ...source };
    await onUpdateSourceLessons(!updatedSource.lessons_anonymized);
    updatedSource.lessons_anonymized = !updatedSource.lessons_anonymized;
    return setOpenAnonymize(false);
  };

  const handleSubmitSendLessons = async (data: LessonsSendInput) => {
    if (onSendLessons) {
      await onSendLessons(data);
    }
    return setOpenSendLessons(false);
  };
  const answers = R.groupBy(R.prop('lessons_answer_question'), lessonsAnswers);
  const selectedQuestionAnswers = selectedQuestion && selectedQuestion.lessonsquestion_id
    ? answers[selectedQuestion.lessonsquestion_id] || []
    : [];
  const getHoursDiff = (startDate: Date, endDate: Date): number => {
    const msInHour = 1000 * 60 * 60;
    return Math.round(Math.abs(endDate.getTime() - startDate.getTime()) / msInHour);
  };
  return (
    <div style={{ marginBottom: '30px' }}>
      <Grid container spacing={3} style={{ marginTop: -14, marginBottom: '30px' }}>
        <Grid item xs={3} style={{ marginTop: -14 }}>
          <Paper variant="outlined" classes={{ root: classes.metric }}>
            <div className={classes.icon}>
              <SportsScoreOutlined color="primary" sx={{ fontSize: 50 }} />
            </div>
            <div className={classes.title}>{t('Overall objectives score')}</div>
            <div className={classes.number}>
              {source.score}
              %
            </div>
          </Paper>
        </Grid>
        <Grid item xs={3} style={{ marginTop: -14 }}>
          <Paper variant="outlined" classes={{ root: classes.metric }}>
            <div className={classes.icon}>
              <SpeakerNotesOutlined color="primary" sx={{ fontSize: 50 }} />
            </div>
            <div className={classes.title}>{t('Simulation logs')}</div>
            <div className={classes.number}>
              {source.logs_number}
            </div>
          </Paper>
        </Grid>
        <Grid item xs={3} style={{ marginTop: -14 }}>
          <Paper variant="outlined" classes={{ root: classes.metric }}>
            <div className={classes.icon}>
              <BallotOutlined color="primary" sx={{ fontSize: 50 }} />
            </div>
            <div className={classes.title}>{t('Poll replies')}</div>
            <div className={classes.number}>
              {source.lessons_answers_number}
            </div>
          </Paper>
        </Grid>
        <Grid item xs={3} style={{ marginTop: -14 }}>
          <Paper variant="outlined" classes={{ root: classes.metric }}>
            <div className={classes.icon}>
              <ContactMailOutlined color="primary" sx={{ fontSize: 50 }} />
            </div>
            <div className={classes.title}>{t('Messages')}</div>
            <div className={classes.number}>
              {source.communications_number}
            </div>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3} style={{ marginBottom: '50px' }}>
        <Grid item xs={4}>
          <Typography variant="h4">{t('Details')}</Typography>
          <Paper variant="outlined" classes={{ root: classes.paperPadding }}>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="h3">{t('Start date')}</Typography>
                {nsdt(source.start_date)}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">{t('End date')}</Typography>
                {nsdt(source.end_date)}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">{t('Duration')}</Typography>
                {getHoursDiff(
                  source.start_date
                    ? new Date(source.start_date)
                    : new Date(),
                  source.end_date
                    ? new Date(source.end_date)
                    : new Date(),
                )}
                {' '}
                {t('hours')}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">{t('Team')}</Typography>
                {source.users_number}
                {' '}
                {t('players')}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h4">{t('Parameters')}</Typography>
          <Paper variant="outlined" classes={{ root: classes.paperPadding }}>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="h3">{t('Questionnaire mode')}</Typography>
                <FormControlLabel
                  control={(
                    <Switch
                      disabled={source.lessons_anonymized}
                      checked={source.lessons_anonymized}
                      onChange={() => setOpenAnonymize(true)}
                      name="anonymized"
                    />
                  )}
                  label={t('Anonymize answers')}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">{t('Template')}</Typography>
                <Button
                  startIcon={<ContentPasteGoOutlined />}
                  color="primary"
                  variant="contained"
                  onClick={() => setOpenApplyTemplate(true)}
                >
                  {t('Apply')}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">{t('Check')}</Typography>
                <Button
                  startIcon={<VisibilityOutlined />}
                  color="secondary"
                  variant="contained"
                  component={Link}
                  href={`/lessons/${source.type}/${source.id}?preview=true`}
                >
                  {t('Preview')}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">
                  {t('Categories and questions')}
                </Typography>
                <Button
                  startIcon={<DeleteSweepOutlined />}
                  color="error"
                  variant="contained"
                  onClick={() => setOpenEmptyLessons(true)}
                >
                  {t('Clear out')}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h4">{t('Control')}</Typography>
          <Paper variant="outlined" classes={{ root: classes.paperPadding }}>
            <Alert severity="info">
              {t(
                'Sending the questionnaire will emit an email to each player with a unique link to access and fill it.',
              )}
            </Alert>
            <Grid container spacing={3} style={{ marginTop: 0 }}>
              <Grid item xs={6}>
                <Typography variant="h3">{t('Questionnaire')}</Typography>
                <Button
                  startIcon={<ContentPasteGoOutlined />}
                  color="success"
                  variant="contained"
                  onClick={() => setOpenSendLessons(true)}
                >
                  {t('Send')}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">{t('Answers')}</Typography>
                <Button
                  startIcon={<ContentPasteGoOutlined />}
                  color="error"
                  variant="contained"
                  onClick={() => setOpenResetAnswers(true)}
                >
                  {t('Reset')}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      <LessonsObjectives
        objectives={objectives}
        injects={injects}
        setSelectedObjective={setSelectedObjective}
        source={source}
        isReport={false}
      />
      <LessonsCategories
        lessonsCategories={lessonsCategories}
        lessonsAnswers={lessonsAnswers}
        setSelectedQuestion={setSelectedQuestion}
        lessonsQuestions={lessonsQuestions}
        teamsMap={teamsMap}
        teams={teams}
        isReport={false}
        style={{ marginTop: '60px' }}
      />
      <CreateLessonsCategory />
      <Dialog
        TransitionComponent={Transition}
        keepMounted={false}
        open={selectedObjective !== null}
        onClose={() => setSelectedObjective(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{ elevation: 1 }}
      >
        <DialogTitle>{t('Objective achievement evaluation')}</DialogTitle>
        <DialogContent>
          <ObjectiveEvaluations
            objectiveId={selectedObjective}
            isUpdatable={source.isUpdatable}
            handleClose={() => setSelectedObjective(null)}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        TransitionComponent={Transition}
        keepMounted={false}
        open={openApplyTemplate}
        onClose={() => setOpenApplyTemplate(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ elevation: 1 }}
      >
        <DialogTitle>{t('Apply a lessons learned template')}</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            {t(
              `Applying a template will add all categories and questions of the selectedtemplate to this ${source.type}.`,
            )}
          </Alert>
          <FormControl style={{ margin: '10px 0 0 5px', width: '100%' }}>
            <RadioGroup
              style={{ width: '100%' }}
              aria-labelledby="controlled-radio-buttons-group"
              name="template"
              value={templateValue}
              onChange={handleChange}
            >
              {lessonsTemplates.map((template: LessonsTemplate) => {
                return (
                  <FormControlLabel
                    key={template.lessonstemplate_id}
                    style={{
                      width: '100%',
                      borderBottom: `1px solid ${theme.palette.background.paper}`,
                      margin: 0,
                    }}
                    value={template.lessonstemplate_id}
                    control={<Radio />}
                    label={(
                      <div style={{ margin: '15px 0 15px 10px' }}>
                        <Typography variant="h4">
                          {template.lessons_template_name}
                        </Typography>
                        <Typography variant="body2">
                          {template.lessons_template_description || t('No description')}
                        </Typography>
                      </div>
                    )}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
          <CreateLessonsTemplate inline />
          <div className="clearfix" />
          <div style={{ float: 'right', marginTop: 20 }}>
            <Button
              onClick={() => setOpenApplyTemplate(false)}
              style={{ marginRight: 10 }}
            >
              {t('Cancel')}
            </Button>
            <Button
              color="secondary"
              onClick={applyTemplate}
              disabled={templateValue === null}
            >
              {t('Apply')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={openResetAnswers}
        TransitionComponent={Transition}
        onClose={() => setOpenResetAnswers(false)}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to reset lessons learned answers?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetAnswers(false)}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={resetAnswers}>
            {t('Reset')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openEmptyLessons}
        TransitionComponent={Transition}
        onClose={() => setOpenEmptyLessons(false)}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t(
              'Do you want to empty lessons learned categories and questions?',
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmptyLessons(false)}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={emptyLessons}>
            {t('Clear out')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openSendLessons}
        TransitionComponent={Transition}
        onClose={() => setOpenSendLessons(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ elevation: 1 }}
      >
        <DialogTitle>{t('Send the lessons learned questionnaire')}</DialogTitle>
        <DialogContent style={{ overflowX: 'hidden' }}>
          <SendLessonsForm
            onSubmit={handleSubmitSendLessons}
            initialValues={{
              // eslint-disable-next-line no-template-curly-in-string
              subject: t('[${exercise.name}] Lessons learned questionnaire'),
              body: `${t('Hello')},<br /><br />${t(
                // eslint-disable-next-line no-template-curly-in-string
                'We would like thank your for your participation in this simulation. You are kindly requested to fill this lessons learned questionnaire: <a href="${lessons_uri}">${lessons_uri}</a>.',
              )}<br /><br />${t('Best regards')},<br />${t(
                'The simulation control team',
              )}`,
            }}
            handleClose={() => setOpenSendLessons(false)}
          />
        </DialogContent>
      </Dialog>
      <AnswersByQuestionDialog
        open={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        question={selectedQuestion?.lessons_question_content || ''}
        answers={selectedQuestionAnswers}
        anonymized={source.lessons_anonymized}
        usersMap={usersMap}
      />
      <Dialog
        open={openAnonymize}
        TransitionComponent={Transition}
        onClose={() => setOpenAnonymize(false)}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to anonymize lessons learned questionnaire?')}
          </DialogContentText>
          <Alert severity="warning" style={{ marginTop: 10 }}>
            {t('You will not be able to change this setting later.')}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAnonymize(false)}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={toggleAnonymize}>
            {t('Anonymize')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Lessons;
