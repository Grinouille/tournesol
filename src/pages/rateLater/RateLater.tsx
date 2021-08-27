import React, { useEffect, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Grid } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import PlayCircleFilledWhiteIcon from '@material-ui/icons/PlayCircleFilledWhite';
import { useAppSelector } from 'src/app/hooks';
import { selectLogin } from 'src/features/login/loginSlice';
import {
  fetchRateLaterList,
  addToRateLaterList,
} from 'src/features/rateLater/rateLaterAPI';
import RateLaterPagination from 'src/features/rateLater/RateLaterPagination';
import RateLaterAddForm from 'src/features/rateLater/RateLaterAddForm';
import { VideoRateLater, Video } from 'src/services/openapi';
import { topBarHeight } from 'src/features/frame/components/topbar/TopBar';

const useStyles = makeStyles({
  rateLaterIntro: {
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  rateLaterContent: {
    flexDirection: 'column',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '20px',
    scrollMarginTop: `${topBarHeight}px`,
  },
  videoList: {
    paddingTop: '20px',
    width: '100%',
    maxWidth: '1100px',
  },
  stickyPagination: {
    position: 'sticky',
    top: `${topBarHeight}px`,
    padding: '6px',
  },
});

// Temporary placeholder for the VideoCard component
const VideoCard = ({ video }: { video: Video }) => (
  <Paper elevation={4} style={{ margin: '12px 0' }}>
    <Grid container justifyContent="space-between">
      <Grid item>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '320px',
            height: '180px',
            background:
              'linear-gradient(135deg, rgba(131,58,180,1) 0%, rgba(253,29,29,1) 50%, rgba(252,176,69,1) 100%)',
          }}
        >
          <PlayCircleFilledWhiteIcon
            style={{ fontSize: 60, flex: 1, color: '#0008' }}
          />
        </div>
      </Grid>
      <Grid
        item
        xs={true}
        container
        direction="column"
        alignItems="flex-start"
        style={{ padding: '12px' }}
      >
        <Grid item>
          <Typography variant="h5">Title</Typography>
        </Grid>
        <Grid item>
          <a href={`https://youtu.be/${video.video_id}`}>{video.video_id}</a>
        </Grid>
      </Grid>
    </Grid>
  </Paper>
);

const RateLaterPage = () => {
  const classes = useStyles();
  const loginState = useAppSelector(selectLogin);
  const [isLoading, setIsLoading] = React.useState(true);
  const [offset, setOffset] = React.useState(0);
  const [videoCount, setVideoCount] = React.useState<number | null>(null);
  const videoListTopRef = React.useRef<HTMLDivElement>(null);
  const [rateLaterList, setRateLaterList] = React.useState<VideoRateLater[]>(
    []
  );

  const limit = 5;

  const loadList = useCallback(async () => {
    setIsLoading(true);
    let rateLaterResponse;
    try {
      rateLaterResponse = await fetchRateLaterList(loginState, {
        offset: offset,
        limit: limit,
      });
    } catch (err) {
      console.error('Fetch rater list failed.', err);
      setIsLoading(false);
      return;
    }
    if (rateLaterResponse.count != null) {
      setVideoCount(rateLaterResponse.count);
    }
    if (rateLaterResponse.results != null) {
      setRateLaterList(rateLaterResponse.results);
    }
    setIsLoading(false);
  }, [offset, setVideoCount, setRateLaterList, loginState]);

  const addToRateLater = async (video_id: string) => {
    await addToRateLaterList(loginState, { video_id });
    await loadList();
  };

  const onOffsetChange = (newOffset: number) => {
    setOffset(newOffset);
    videoListTopRef.current?.scrollIntoView();
  };

  useEffect(() => {
    loadList();
  }, [loadList]);

  return (
    <>
      <div className={classes.rateLaterIntro}>
        <Typography variant="h5">Add videos to your rate-later list</Typography>
        <br />
        <span>
          Copy-paste the id or the URL of a favorite video of yours:
          <br />
          You can search them in your{' '}
          <a href="https://www.youtube.com/feed/history">
            YouTube history page
          </a>
          , or your{' '}
          <a href="https://www.youtube.com/playlist?list=LL">
            liked video playlist
          </a>
          .<br />
          Our{' '}
          <a href="https://chrome.google.com/webstore/detail/tournesol-extension/nidimbejmadpggdgooppinedbggeacla?hl=en">
            Google chrome extension
          </a>{' '}
          can also help you import videos effortlessly.
          <br />
          You will then be able to rate the videos you imported.
        </span>
        <br />
      </div>

      <RateLaterAddForm addVideo={addToRateLater} />

      <div className={classes.rateLaterContent} ref={videoListTopRef}>
        {videoCount !== null && (
          <Typography variant="subtitle1">
            Your rate-later list now has <strong>{videoCount}</strong> video(s).
          </Typography>
        )}

        {videoCount && (
          <div className={classes.stickyPagination}>
            <RateLaterPagination
              offset={offset}
              count={videoCount}
              onOffsetChange={onOffsetChange}
              limit={limit}
            />
          </div>
        )}

        {isLoading && <p>Loading...</p>}

        <div
          className={classes.videoList}
          style={{
            visibility: isLoading ? 'hidden' : undefined,
          }}
        >
          {rateLaterList.map(({ video }) => (
            <VideoCard key={video.video_id} video={video} />
          ))}
        </div>
      </div>
    </>
  );
};

export default RateLaterPage;
