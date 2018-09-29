import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { indigo400 } from 'material-ui/styles/colors';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Snackbar from 'material-ui/Snackbar';
import { NOW_PLAYING_PAGE, togglePlaying, playSong } from './actions';

import MainView from './views/MainView';
import Header from './components/Header';
import PlayingView from './views/PlayingView';

injectTapEventPlugin();

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: indigo400,
  },
});

const mapStateToProps = state => ({
  page: state.page,
  songs: state.songs,
  playState: state.playState,
  repeatType: state.common.repeat,
});

const mapDispatchToProps = dispatch => ({
  toggle: () => dispatch(togglePlaying()),
  playSong: id => dispatch(playSong(id)),
});


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: 0,
      snackBarOpen: false,
    };
  }

  componentDidMount() {
    const { songs } = this.props;
    if (songs[0]) {
      this.audioPlayer.src = URL.createObjectURL(songs[0]);
    }
  }


  componentWillReceiveProps(nextProps) {
    const { playState } = this.props;
    if (nextProps.playState !== playState) {
      if (!nextProps.playState.playing) {
        // PAUSE
        this.audioPlayer.pause();
      } else if (nextProps.playState.songId === 0) {
        this.playSong(0);
      } else if (nextProps.playState.songId === playState.songId) {
        // RESUME
        this.audioPlayer.play();
        // Start playing
      } else {
        this.playSong(nextProps.playState.songId);
      }
    }
  }

  playNext = () => {
    const { songs, playState, playSong: play } = this.props;
    URL.revokeObjectURL(songs[playState.songId]);
    const nextSongId = (playState.songId + 1) % songs.length;
    play(nextSongId);
  }

  songEnded = () => {
    const {
      songs, playState, repeatType, playSong: play,
    } = this.props;
    // No repeat
    if (repeatType === 0) {
      URL.revokeObjectURL(songs[playState.songId]);
      if (playState.songId < songs.length) play(playState.songId + 1);
    } else if (repeatType === 1) playSong(playState.songId);
    // repeat all
    else this.playNext();
  }

  playPrevious = () => {
    const { songs, playState, playSong: play } = this.props;
    URL.revokeObjectURL(songs[playState.songId]);
    const nextSongId = playState.songId === 0 ? songs.length - 1 : playState.songId - 1;
    play(nextSongId);
  }

  updateTime = () => {
    const currentTime = 100 * this.audioPlayer.currentTime / this.audioPlayer.duration;
    this.setState({ currentTime });
  }

  playSong = (id) => {
    const { songs } = this.props;
    if (songs[id]) {
      const fileSrc = URL.createObjectURL(songs[id]);
      this.audioPlayer.src = fileSrc;
      this.audioPlayer.play();
      window.document.title = songs[id].name.replace('.mp3', '');
    }
  }

  timeDrag = (time) => {
    this.audioPlayer.currentTime = this.audioPlayer.duration * (time / 100);
  }

  handleActionClick = () => {
    window.open('https://github.com/ashinzekene/react-music-player', '_blank');
  }

  handleRequestClose = () => {
    this.setState({ snackBarOpen: false });
  }

  render() {
    const { currentTime, snackBarOpen } = this.state;
    const {
      songs, playState, openNowPlaying, toggle, repeatType, page,
    } = this.props;
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <Header
            openSnackbar={() => this.setState({ snackBarOpen: true })}
            playingSong={songs[playState.songId]}
          />
          <audio
            controls
            hidden
            onTimeUpdate={this.updateTime}
            onEnded={this.songEnded}
            ref={(audio) => { this.audioPlayer = audio; }}
          >
            <track kind="captions" {...{}} />
          </audio>
          {
            page === NOW_PLAYING_PAGE ? (
              <PlayingView
                playNext={this.playNext}
                timeDrag={this.timeDrag}
                playPrevious={this.playPrevious}
                currentTime={currentTime}
                playingSong={songs[playState.songId]}
                repeatType={repeatType}
              />) : (
                <MainView
                  songs={songs}
                  playState={playState}
                  openNowPlaying={openNowPlaying}
                  currentTime={currentTime}
                  toggle={toggle}
                />)
          }
          <Snackbar
            open={snackBarOpen}
            message="Not Implemented yet, You can make a PR"
            action="make a PR"
            autoHideDuration={4000}
            onRequestClose={this.handleRequestClose}
            onActionClick={this.handleActionClick}
          />
        </div>
      </MuiThemeProvider>
    );
  }
}

App.propTypes = {
  page: PropTypes.string.isRequired,
  songs: PropTypes.arrayOf(PropTypes.any).isRequired,
  playState: PropTypes.shape({
    playing: PropTypes.bool.isRequired,
    songId: PropTypes.number.isRequired,
  }).isRequired,
  repeatType: PropTypes.oneOf([0, 1, 2]).isRequired,
  toggle: PropTypes.func.isRequired,
  playSong: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
