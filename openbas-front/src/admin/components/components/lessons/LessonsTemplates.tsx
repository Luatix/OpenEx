import { ChevronRightOutlined, SchoolOutlined } from '@mui/icons-material';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import { type CSSProperties, useState } from 'react';
import { Link } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { type UserHelper } from '../../../../actions/helper';
import { searchLessonsTemplates } from '../../../../actions/Lessons';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import PaginationComponent from '../../../../components/common/pagination/PaginationComponent.js';
import SortHeadersComponent from '../../../../components/common/pagination/SortHeadersComponent';
import { initSorting } from '../../../../components/common/queryable/Page';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import { type LessonsTemplate, type SearchPaginationInput } from '../../../../utils/api-types';
import CreateLessonsTemplate from './CreateLessonsTemplate';

const useStyles = makeStyles()(() => ({
  itemHead: {
    paddingLeft: 17,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    height: 50,
  },
  bodyItems: {
    display: 'flex',
    alignItems: 'center',
  },
  bodyItem: {
    height: 20,
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  lessons_template_name: {
    width: '25%',
  },
  lessons_template_description: {
    width: '50%',
  },
};

const LessonsTemplates = () => {
  // Standard hooks
  const { t } = useFormatter();
  const { classes } = useStyles();

  // Fetching data
  const { userAdmin } = useHelper((helper: UserHelper) => {
    return {
      userAdmin: helper.getMe()?.user_admin ?? false,
    };
  });

  // Headers
  const headers = [
    {
      field: 'lessons_template_name',
      label: 'Name',
      isSortable: true,
      value: (lessonsTemplate: LessonsTemplate) => lessonsTemplate.lessons_template_name,
    },
    {
      field: 'lessons_template_description',
      label: 'Description',
      isSortable: true,
      value: (lessonsTemplate: LessonsTemplate) => lessonsTemplate.lessons_template_description,
    },
  ];

  const [lessonTemplates, setLessonTemplates] = useState<LessonsTemplate[]>([]);
  const [searchPaginationInput, setSearchPaginationInput] = useState<SearchPaginationInput>(buildSearchPagination({
    sorts: initSorting('lessons_template_name'),
  }));

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Components') }, { label: t('Lessons learned'), current: true }]} />
      <PaginationComponent
        fetch={searchLessonsTemplates}
        searchPaginationInput={searchPaginationInput}
        setContent={setLessonTemplates}
      />
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon />
          <ListItemText
            primary={(
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                searchPaginationInput={searchPaginationInput}
                setSearchPaginationInput={setSearchPaginationInput}
              />
            )}
          />
          <ListItemSecondaryAction />
        </ListItem>
        {lessonTemplates.map((lessonsTemplate) => {
          return (
            <ListItemButton
              key={lessonsTemplate.lessonstemplate_id}
              classes={{ root: classes.item }}
              divider
              component={Link}
              to={`/admin/components/lessons/${lessonsTemplate.lessonstemplate_id}`}
            >
              <ListItemIcon>
                <SchoolOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={(
                  <div className={classes.bodyItems}>
                    {headers.map(header => (
                      <div
                        key={header.field}
                        className={classes.bodyItem}
                        style={inlineStyles[header.field]}
                      >
                        {header.value(lessonsTemplate)}
                      </div>
                    ))}
                  </div>
                )}
              />
              <ListItemSecondaryAction>
                <ChevronRightOutlined />
              </ListItemSecondaryAction>
            </ListItemButton>
          );
        })}
      </List>
      {userAdmin && <CreateLessonsTemplate onCreate={result => setLessonTemplates([result, ...lessonTemplates])} />}
    </>
  );
};

export default LessonsTemplates;
