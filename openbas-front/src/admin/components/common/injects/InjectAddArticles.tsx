import { ControlPointOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText } from '@mui/material';
import { makeStyles } from '@mui/styles';
import * as R from 'ramda';
import { FunctionComponent, useContext, useState } from 'react';

import type { FullArticleStore } from '../../../../actions/channels/Article';
import type { ArticlesHelper } from '../../../../actions/channels/article-helper';
import { fetchChannels } from '../../../../actions/channels/channel-action';
import type { ChannelsHelper } from '../../../../actions/channels/channel-helper';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import SearchFilter from '../../../../components/SearchFilter';
import type { Theme } from '../../../../components/Theme';
import { useHelper } from '../../../../store';
import { Article } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import { truncate } from '../../../../utils/String';
import ChannelIcon from '../../components/channels/ChannelIcon';
import CreateArticle from '../articles/CreateArticle';
import { PermissionsContext } from '../Context';

const useStyles = makeStyles((theme: Theme) => ({
  box: {
    width: '100%',
    minHeight: '100%',
    padding: 20,
    border: '1px dashed rgba(255, 255, 255, 0.3)',
  },
  chip: {
    margin: '0 10px 10px 0',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  text: {
    fontSize: 15,
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
}));

interface Props {
  articles: Article[];
  handleAddArticles: (articleIds: string[]) => void;
  injectArticlesIds: string[];
}

const InjectAddArticles: FunctionComponent<Props> = ({
  articles,
  handleAddArticles,
  injectArticlesIds,
}) => {
  // Standard hooks
  const classes = useStyles();
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const { permissions } = useContext(PermissionsContext);

  const { articlesMap, channelsMap } = useHelper((helper: ArticlesHelper & ChannelsHelper) => ({
    articlesMap: helper.getArticlesMap(),
    channelsMap: helper.getChannelsMap(),
  }));

  useDataLoader(() => {
    dispatch(fetchChannels());
  });

  const [open, setopen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [articleIds, setArticleIds] = useState<string[]>([]);

  const handleOpen = () => setopen(true);

  const handleClose = () => {
    setopen(false);
    setKeyword('');
    setArticleIds([]);
  };

  const handleSearchArticles = (value?: string) => {
    setKeyword(value || '');
  };

  const addArticle = (articleId: string) => setArticleIds(R.append(articleId, articleIds));

  const removeArticle = (articleId: string) => setArticleIds(articleIds.filter(u => u !== articleId));

  const submitAddArticles = () => {
    handleAddArticles(articleIds);
    handleClose();
  };

  // Creation
  const [openCreate, setOpenCreate] = useState(false);
  const handleOpenCreate = () => setOpenCreate(true);
  const handleCloseCreate = () => setOpenCreate(false);
  const onCreate = (result: string) => {
    addArticle(result);
  };

  const filterByKeyword = (n: FullArticleStore) => keyword === ''
    || (n.article_name || '').toLowerCase().indexOf(keyword.toLowerCase())
    !== -1
    || (n.article_fullchannel?.channel_name || '')
      .toLowerCase()
      .indexOf(keyword.toLowerCase()) !== -1;
  const fullArticles = articles.map(item => ({
    ...item,
    article_fullchannel: item.article_channel ? channelsMap[item.article_channel] : {},
  }));
  const filteredArticles = R.pipe(
    R.filter(filterByKeyword),
    R.take(10),
  )(fullArticles);
  return (
    <div>
      <ListItemButton
        classes={{ root: classes.item }}
        divider
        onClick={handleOpen}
        color="primary"
        disabled={permissions.readOnly}
      >
        <ListItemIcon color="primary">
          <ControlPointOutlined color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={t('Add media pressure')}
          classes={{ primary: classes.text }}
        />
      </ListItemButton>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        onClose={handleClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          elevation: 1,
          sx: {
            minHeight: 580,
            maxHeight: 580,
          },
        }}
      >
        <DialogTitle>{t('Add media pressure in this inject')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} style={{ marginTop: -15 }}>
            <Grid item xs={8}>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <SearchFilter
                    onChange={handleSearchArticles}
                    fullWidth
                  />
                </Grid>
              </Grid>
              <List>
                {filteredArticles.map((article: FullArticleStore) => {
                  const disabled = articleIds.includes(article.article_id)
                    || injectArticlesIds.includes(article.article_id);
                  return (
                    <ListItemButton
                      key={article.article_id}
                      disabled={disabled}
                      divider
                      dense
                      onClick={() => addArticle(article.article_id)}
                    >
                      <ListItemIcon>
                        <ChannelIcon
                          type={article.article_fullchannel?.channel_type}
                          variant="inline"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={article.article_name}
                        secondary={article.article_author}
                      />
                    </ListItemButton>
                  );
                })}
                <CreateArticle
                  inline
                  openCreate={openCreate}
                  onCreate={onCreate}
                  handleOpenCreate={handleOpenCreate}
                  handleCloseCreate={handleCloseCreate}
                />
              </List>
            </Grid>
            <Grid item xs={4}>
              <Box className={classes.box}>
                {articleIds.map((articleId) => {
                  const article = articlesMap[articleId];
                  const channel = article
                    ? channelsMap[article.article_channel] || {}
                    : {};
                  return (
                    <Chip
                      key={articleId}
                      onDelete={() => removeArticle(articleId)}
                      label={truncate(article?.article_name, 22)}
                      icon={
                        <ChannelIcon type={channel.channel_type} variant="chip" />
                      }
                      classes={{ root: classes.chip }}
                    />
                  );
                })}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('Cancel')}</Button>
          <Button
            color="secondary"
            onClick={submitAddArticles}
          >
            {t('Add')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InjectAddArticles;
