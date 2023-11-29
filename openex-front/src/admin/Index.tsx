import React from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import TopBar from './components/nav/TopBar';
import LeftBar from './components/nav/LeftBar';
import Message from '../components/Message';
import IndexProfile from './components/profile/Index';
import Dashboard from './components/Dashboard';
import Exercises from './components/exercises/Exercises';
import IndexExercise from './components/exercises/Index';
import Players from './components/players/Players';
import Organizations from './components/organizations/Organizations';
import Documents from './components/documents/Documents';
import Medias from './components/medias/Medias';
import IndexMedia from './components/medias/Index';
import IndexIntegrations from './components/integrations/Index';
import { errorWrapper } from '../components/Error';
import IndexSettings from './components/settings/Index';
import useDataLoader from '../utils/ServerSideEvent';
import { useHelper } from '../store';
import Challenges from './components/challenges/Challenges';
import LessonsTemplates from './components/lessons/LessonsTemplates';
import IndexLessonsTemplate from './components/lessons/Index';
import { Theme } from '../components/Theme';
import { LoggedHelper } from '../actions/helper';

const useStyles = makeStyles<Theme>((theme) => ({
  root: {
    minWidth: 1280,
    height: '100%',
  },
  content: {
    height: '100%',
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: '24px 24px 24px 214px',
    minWidth: 0,
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: theme.spacing(1),
  },
  toolbar: theme.mixins.toolbar,
}));

const Index = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const logged = useHelper((helper: LoggedHelper) => helper.logged());
  if (logged.isOnlyPlayer) {
    navigate('/private');
  }
  useDataLoader();
  return (
    <div className={classes.root}>
      <TopBar />
      <LeftBar />
      <Message />
      <main className={classes.content} style={{ paddingRight: 24 }}>
        <div className={classes.toolbar} />
        <Routes>
          <Route path="" element={errorWrapper(Dashboard)()} />
          <Route path="profile/*" element={errorWrapper(IndexProfile)()} />
          <Route path="exercises" element={errorWrapper(Exercises)()} />
          <Route path="exercises/:exerciseId/*" element={errorWrapper(IndexExercise)()} />
          <Route path="players" element={errorWrapper(Players)()} />
          <Route path="organizations" element={errorWrapper(Organizations)()} />
          <Route path="documents" element={errorWrapper(Documents)()} />
          <Route path="medias" element={errorWrapper(Medias)()} />
          <Route path="medias/:mediaId/*" element={errorWrapper(IndexMedia)()} />
          <Route path="challenges" element={errorWrapper(Challenges)()} />
          <Route path="lessons" element={errorWrapper(LessonsTemplates)()} />
          <Route path="lessons/:lessonsTemplateId/*" element={errorWrapper(IndexLessonsTemplate)()} />
          <Route path="integrations/*" element={errorWrapper(IndexIntegrations)()} />
          <Route path="settings/*" element={errorWrapper(IndexSettings)()} />
        </Routes>
      </main>
    </div>
  );
};

export default Index;
