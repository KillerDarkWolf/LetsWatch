import React, { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import { Input, Label } from "reactstrap";
import socketIOClient from "socket.io-client";
import qs from "querystring";

const opts = {
  height: "390",
  width: "640",
  playerVars: {
    // https://developers.google.com/youtube/player_parameters
    controls: 2,
    rel: 0,
    modestbranding: 1,
    autoplay: 1,
  },
};

const VideoPlayer = ({ room, socket }) => {
  //URL submit handlers
  let [videoURL, setVideoURL] = useState(
    "https://www.youtube.com/watch?v=O4ldpyIE5t4",
  );
  let [queue, setQueue] = useState([]);
  let [formURL, setFormURL] = useState("");
  //Player Controls
  let [playing, setPlaying] = useState(true);
  //Player Ref
  let playerRef = useRef();
  let [videoProps, setVideoProps] = useState({});

  useEffect(() => {
    console.log("useEffect!", playerRef);
    socket.emit("joinRoom", {
      room: room,
    });
    console.log("socket joined room, socket obj :", socket);
    console.log("current URL :", videoURL);

    socket.emit("ASK_FOR_VIDEO_INFORMATION");

    socket.on("PAUSE", (currentTime) => {
      console.log("Recieved PAUSE");
      syncTime(currentTime);
      setPlaying(false);
    });

    socket.on("PLAY", () => {
      console.log("Recieved PLAY");
      setPlaying(true);
    });

    socket.on("SYNC_TIME", (currentTime) => {
      console.log("Asked to sync!");
      syncTime(currentTime);
    });

    socket.on("NEW_VIDEO", (data) => {
      if (data !== videoURL) {
        console.log("new video acquired :", data);
        setVideoURL(data);
      }
    });

    socket.on("ASK_FOR_VIDEO_INFORMATION", () => {
      console.log(videoURL);
      let data = {
        url: playerRef.current.player.props.url,
        currentTime: playerRef.current.getCurrentTime() + 1,
      };
      console.log("recieved request, data to send :", data);
      socket.emit("SYNC_VIDEO_INFORMATION", data);
    });

    socket.on("SYNC_VIDEO_INFORMATION", (data) => {
      console.log("got data :", data);
      if (data.url !== videoURL) {
        setVideoURL(data.url);
        syncTime(data.currentTime);
        console.log("URL set and time synced");
      } else if (data.url == videoURL) {
        console.log("playing same URL, syncing time");
        syncTime(data.currentTime);
      }
    });
  }, []);

  //Player emit functions

  const ready = (e) => {
    console.log("player is ready. player object: ", playerRef.current);
    const currentURL = playerRef.current.player.props.url;
    //console.log(videoURL);
    // setTimeout(() => {
    //   setPlaying(true);
    //   console.log("delayed start");
    // }, 1500);
    setPlaying(true);
  };

  const pause = (e) => {
    console.log(playerRef.current.getCurrentTime());
    socket.emit("PAUSE", playerRef.current.getCurrentTime());
  };

  const play = (e) => {
    socket.emit("PLAY");
  };

  const seek = (e) => {
    console.log("seek", e.target.value);
    playerRef.current.seekTo(e.target.value, seconds);
    socket.emit("SYNC_TIME", playerRef.current.getCurrentTime());
  };

  //Socket on Functions

  const syncTime = (currentTime) => {
    if (
      playerRef.current.getCurrentTime() < currentTime - 0.5 ||
      playerRef.current.getCurrentTime() > currentTime + 0.5
    ) {
      console.log("Time synced to :", currentTime);
      playerRef.current.seekTo(currentTime);
      setPlaying(true);
    }
  };

  const checkQueue = () => {};

  const handleSubmit = (e) => {
    e.preventDefault();
    setVideoURL(formURL);
    socket.emit("NEW_VIDEO", formURL);
    setFormURL("");
  };

  const handleChange = (e) => {
    setFormURL(e.target.value);
  };

  return (
    <div style={{ color: "white" }}>
      <div className="playerHolder">
        <ReactPlayer
          className="player"
          onReady={ready}
          onPause={pause}
          onPlay={play}
          onSeek={seek}
          onEnded={checkQueue}
          playing={playing}
          ref={playerRef}
          url={videoURL}
          width={"90vw"}
          height={"75vh"}
          controls={true}
        />

        <h3 style={{ color: "white" }}>Current URL : {videoURL}</h3>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          className="white-text"
          type="text"
          placeholder="Insert video link into queue"
          id="videoUrl"
          value={formURL}
          onChange={handleChange}
        />

        <button type="submit" className="black">
          Load new Video
        </button>
      </form>
    </div>
  );
};

export default VideoPlayer;
