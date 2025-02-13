import { Alert, Button, Paper, ToggleButtonGroup, Typography } from '@mui/material';
import { FunctionComponent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { updateReportForExercise, updateReportInjectCommentForExercise } from '../../../../../actions/reports/report-actions';
import ExportPdfButton from '../../../../../components/ExportPdfButton';
import { useFormatter } from '../../../../../components/i18n';
import Loader from '../../../../../components/Loader';
import type { Exercise, LessonsQuestion, Report, ReportInput } from '../../../../../utils/api-types';
import { usePermissions } from '../../../../../utils/Exercise';
import { useAppDispatch } from '../../../../../utils/hooks';
import { ReportContext, ReportContextType } from '../../../common/Context';
import ResponsePie from '../../../common/injects/ResponsePie';
import ReportComment from '../../../components/reports/ReportComment';
import ReportPopover from '../../../components/reports/ReportPopover';
import AnswersByQuestionDialog from '../../../lessons/exercises/AnswersByQuestionDialog';
import LessonsCategories from '../../../lessons/exercises/LessonsCategories';
import ExerciseMainInformation from '../ExerciseMainInformation';
import ExerciseDistribution from '../overview/ExerciseDistribution';
import ExerciseReportForm from './ExerciseReportForm';
import getExerciseReportPdfDocDefinition from './getExerciseReportPdfDoc';
import InjectReportResult from './InjectReportResult';
import ReportInformationType from './ReportInformationType';
import useExerciseReportData from './useExerciseReportData';

const ExerciseReportPage: FunctionComponent = () => {
  // Standard hooks
  const dispatch = useAppDispatch();
  const { t, tPick, fldt } = useFormatter();

  const { exerciseId, reportId } = useParams() as { exerciseId: Exercise['exercise_id']; reportId: Report['report_id'] };
  const { loading, report, displayModule, setReloadReportDataCount, reportData } = useExerciseReportData(reportId, exerciseId);
  const [selectedQuestion, setSelectedQuestion] = useState<LessonsQuestion | null>(null);
  const selectedQuestionAnswers = selectedQuestion && selectedQuestion.lessonsquestion_id
    ? reportData.lessonsAnswers.filter(answer => answer.lessons_answer_question === selectedQuestion.lessonsquestion_id)
    : [];

  const permissions = usePermissions(exerciseId);
  const [canEditReport, setCanEditReport] = useState(permissions.canWrite);
  useEffect(() => {
    setCanEditReport(permissions.canWrite);
  }, [permissions.canWrite]);

  // Context
  const context: ReportContextType = {
    onUpdateReport: (_reportId: Report['report_id'], data: ReportInput) => dispatch(updateReportForExercise(exerciseId, reportId, data))
      .then(() => setReloadReportDataCount((prev: number) => prev + 1)),
    renderReportForm: (onSubmitForm, onHandleCancel, _report) => {
      return (
        <ExerciseReportForm
          onSubmit={onSubmitForm}
          handleCancel={onHandleCancel}
          initialValues={report}
          editing
        />
      );
    },
  } as ReportContextType;

  const saveGlobalObservation = (comment: string) => dispatch(updateReportForExercise(
    exerciseId,
    report.report_id,
    {
      ...report,
      report_global_observation: comment,
    } as ReportInput,
  ));

  if (loading) {
    return <Loader />;
  }
  if (!report) {
    return <Alert severity="warning">{t('This report is not available')}</Alert>;
  }

  return (
    <ReportContext.Provider value={context}>
      <div style={{ margin: 20, display: 'flex' }}>
        <Button
          color="primary"
          variant="outlined"
          component={Link}
          to={`/admin/simulations/${exerciseId}`}
        >
          {t('Back to administration')}
        </Button>

        <ToggleButtonGroup style={{ marginLeft: 'auto' }}>
          <ExportPdfButton pdfName={report.report_name} getPdfDocDefinition={() => getExerciseReportPdfDocDefinition({ report, reportData, displayModule, tPick, fldt, t })} />
          {permissions.canWrite && <ReportPopover variant="toggle" report={report} actions={['Update']} />}
        </ToggleButtonGroup>
      </div>

      <div
        id={`reportId_${report.report_id}`}
        style={{ padding: 20, display: 'flex', flexFlow: 'wrap', maxWidth: '1400px', margin: 'auto' }}
      >
        <div style={{ width: '100%', textAlign: 'center', fontSize: 25, fontWeight: 500, margin: '10px' }}>
          {report.report_name}
        </div>
        {displayModule(ReportInformationType.MAIN_INFORMATION)
        && (
          <div style={{ width: '50%', paddingRight: '25px' }}>
            <Typography variant="h4" gutterBottom>
              {t('General information')}
            </Typography>
            <ExerciseMainInformation exercise={reportData.exercise} />
          </div>
        )}
        {displayModule(ReportInformationType.SCORE_DETAILS)
        && (
          <div style={{ width: '50%', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
            <Typography variant="h4" gutterBottom>
              {t('Results')}
            </Typography>
            <Paper variant="outlined" style={{ display: 'flex', alignItems: 'center' }}>
              <ResponsePie expectationResultsByTypes={reportData.exerciseExpectationResults} disableChartAnimation />
            </Paper>
          </div>
        )}
        {displayModule(ReportInformationType.INJECT_RESULT)
        && (
          <InjectReportResult
            canEditComment={canEditReport}
            injectsComments={report?.report_injects_comments}
            injects={reportData.injects}
            style={{ width: '100%', marginTop: 20 }}
            onCommentSubmit={value => dispatch(updateReportInjectCommentForExercise(exerciseId, report.report_id, value))}
          />
        )}
        {displayModule(ReportInformationType.GLOBAL_OBSERVATION)
        && (
          <div style={{ width: '100%', marginTop: 20 }}>
            <Typography variant="h4" gutterBottom>
              {t('Global observation')}
            </Typography>

            <Paper variant="outlined" sx={{ padding: '10px 15px 10px 15px' }}>
              <ReportComment canEditComment={canEditReport} initialComment={report.report_global_observation || ''} saveComment={saveGlobalObservation} />
            </Paper>
          </div>
        )}
        {displayModule(ReportInformationType.PLAYER_SURVEYS)
        && (
          <LessonsCategories
            style={{ width: '100%', paddingBottom: '60px' }}
            lessonsCategories={reportData.lessonsCategories}
            lessonsAnswers={reportData.lessonsAnswers}
            lessonsQuestions={reportData.lessonsQuestions}
            teamsMap={reportData.teamsMap}
            teams={reportData.teams}
            setSelectedQuestion={setSelectedQuestion}
            isReport
          />
        )}
        {displayModule(ReportInformationType.EXERCISE_DETAILS)
        && <ExerciseDistribution exerciseId={exerciseId} isReport />}
        <AnswersByQuestionDialog
          open={!!selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          question={selectedQuestion?.lessons_question_content || ''}
          answers={selectedQuestionAnswers}
          anonymized={!!reportData.exercise.exercise_lessons_anonymized}
          usersMap={reportData.usersMap}
        />
      </div>
    </ReportContext.Provider>
  );
};

export default ExerciseReportPage;
