/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect, useRef, useState } from "react";

import "./App.css";
// import { justTestFunction } from "./modelHelper";
import { inferModel, loadPhonemizerModel } from "./PhonemizerModel/modelHelper";

import { loadVitsModel, vitsInferModel } from "./Vits/vitsModelHelper";

// import { postProcessing } from "./postProcessing";
function App() {
  const [selectedText, setSelectedText]: any = useState("");
  const [isPlaying, setIsPlaying]: any = useState(false);
  const [playButtonVisible, setPlayButtonVisible]: any = useState(false);
  const [isSettingsVisible, setIsSettingsVisible]: any = useState(false);
  const [imagePossition, setImagePossition]: any = useState({
    top: "100px",
    left: "100px",
  });
  const [showBackDrop, setShowBackDrop] = useState(false);

  const totalAudioNumber: any = useRef(0);
  const settingsButton: any = useRef(null);
  const audioBufferForPlay: any = useRef({});
  const audioRef: any = useRef(null);

  const testImage = chrome.runtime.getURL("images/testImage.jpg");
  useEffect(() => {
    async function loadModels() {
      try {
        await loadPhonemizerModel();
        alert("phonemizer model loaded....");

        await loadVitsModel();
        alert("vits model loaded.......");
      } catch (error) {
        alert(error);
      }
    }
    loadModels();
    document.addEventListener("mouseup", function (event) {
      const text: any = window.getSelection()?.toString().trim();
      console.log("the selected text is : ", text);
      let playButton: any = document.getElementById("playButton");
      let settingsButton: any = document.getElementById("settingsButton");
      let popup: any = document.getElementById("popup");
      if (text !== "") {
        // // console.log(`Change found?: ${changeFound}`);
        // if (
        //   containsBengaliCharacters(selectedText) &&
        //   changeFound &&
        //   selectedText !== ""
        // ) {
        //   hidePlayButton();
        // }
        setSelectedText(text);
        if (!playButtonVisible) {
          console.log("before show button................");
          showPlayButton(text);
        } else if (
          event.target !== playButton &&
          event.target !== settingsButton &&
          !popup.contains(event.target)
        ) {
          hidePlayButton();
        }
      } else {
        hidePlayButton();
      }
    });
  }, []);
  function hidePlayButton() {
    let playButton: any = document.getElementById("playButton");
    if (playButton) {
      playButton.removeEventListener("click", playSelectedText);
      playButton.remove();
      setPlayButtonVisible(false);
    }

    let settingsButton: any = document.getElementById("settingsButton");
    if (settingsButton) {
      settingsButton.removeEventListener("click", togglePopup);
      settingsButton.remove();
    }

    // console.log("Hidden play button");
  }

  function showPlayButton(selectedText: string) {
    // let playButton: any = document.createElement("div");
    // playButton.id = "playButton";
    // playButton.innerHTML = isPlaying ? "&#10074;&#10074;" : "&#9658;"; // Play or pause button symbol
    // document.body.appendChild(playButton);
    setPlayButtonVisible(true);
    positionPlayButton();
    console.log("inside show play button.......................");
    // playButton.addEventListener("click", playSelectedText());
    // console.log("Play button created");

    let settingsButton = document.createElement("div");
    settingsButton.id = "settingsButton";
    settingsButton.innerHTML = "&#9881;"; // Gear icon
    document.body.appendChild(settingsButton);
    positionSettingsButton();
    settingsButton.addEventListener("click", togglePopup);
  }
  function positionPlayButton() {
    const selectedRange: any = window.getSelection()?.getRangeAt(0);
    const rect = selectedRange.getBoundingClientRect();
    // const buttonDiv: any = document.getElementById("playButton");
    // buttonDiv.style.top = rect.top + window.scrollY - 35 + "px";
    // buttonDiv.style.left = rect.left + window.scrollX + "px";
    // (buttonDiv.style.position = "absolute"),
    setImagePossition({
      top: rect.top + window.scrollY - 35 + "px",
      left: rect.left + window.scrollX + "px",
    });

    console.log(
      "the possition is :",
      rect.top + window.scrollY - 35 + "px",
      rect.left + window.scrollX + "px"
    );
  }
  function playSelectedText() {
    console.log("play button clicked................");
  }
  function positionSettingsButton() {
    const selectedRange: any = window.getSelection()?.getRangeAt(0);
    const rect: any = selectedRange.getBoundingClientRect();
    const settingsButton: any = document.getElementById("settingsButton");
    settingsButton.style.top = rect.top + window.scrollY - 25 + "px";
    settingsButton.style.left = rect.left + window.scrollX + 35 + "px";
  }
  function togglePopup(event: any) {
    event.stopPropagation();
    if (isSettingsVisible) {
      hidePopup();
    } else {
      showPopup();
    }
  }
  function hidePopup() {
    const popup = document.getElementById("popup");
    if (popup) {
      popup.remove();
      document.removeEventListener("click", hidePopupOnClickOutside);
      setIsSettingsVisible(false);
    }
  }
  function hidePopupOnClickOutside(event: any) {
    const popup = document.getElementById("popup");
    if (popup && !popup.contains(event.target)) {
      hidePopup();
    }
  }
  function showPopup() {
    if (isSettingsVisible) return;

    const popup = document.createElement("div");
    popup.id = "popup";
    popup.innerHTML = `
    <h2> কণ্ঠ </h2>

    
    <div class="dropdown">
      <button class="dropbtn">গতি </button>
      <div class="dropdown-content">
        <a>-২x</a>
        <a>-১x</a>
        <a>0x</a>
        <a>১x</a>
        <a>২x</a>
      </div>
    </div>
    
    <hr>
    
    <div class="dropdown">
      <button class="dropbtn">পিচ </button>
      <div class="dropdown-content">
        <a>-২x</a>
        <a>-১x</a>
        <a>0x</a>
        <a>১x</a>
        <a>২x</a>
      </div>
    </div>
    `;

    document.body.appendChild(popup);
    positionPopup();

    // Add a click event listener to the document to close the popup if the user clicks outside it
    document.addEventListener("click", hidePopupOnClickOutside);
    setIsSettingsVisible(true);
  }

  function positionPopup() {
    const selectedRange: any = window.getSelection()?.getRangeAt(0);
    const rect: any = selectedRange.getBoundingClientRect();
    const popup: any = document.getElementById("popup");
    popup.style.top = rect.top + window.scrollY - 35 + "px";
    popup.style.left = rect.left + window.scrollX + 70 + "px";
  }
  const handlePlayButtonClick = async () => {
    setShowBackDrop(true);

    // pre-processing.............
    const messageList = selectedText
      .split(/([,;।?!]+)|\r?\n+/)
      .filter((line: any) => {
        if (line && line.trim() !== "") {
          return line.trim();
        }
      });

    let sendToServer = true;

    const punctuationList = [",", ";", "।", "!", "?"];
    let newList: any = [];
    let j = 0;
    for (let i = 0; i < messageList.length; i++) {
      if (punctuationList.includes(messageList[i])) {
        newList[j - 1] = newList[j - 1] + messageList[i];
      } else {
        newList.push(messageList[i]);
        j += 1;
      }
    }
    totalAudioNumber.current = newList.length; // to determine the end of all audio clips

    for (const [index, message] of newList.entries()) {
      if (message !== "") {
        let phonemizerOutput = await inferModel(message, index);
        console.log("the out put phoneme is :", phonemizerOutput.phoneme);
        let vitsOutput = await vitsInferModel(
          phonemizerOutput.phoneme,
          phonemizerOutput.index
        );
        audioBufferForPlay.current[vitsOutput.index] = vitsOutput.blob;
        console.log("the index is : ", vitsOutput.index);
        if (vitsOutput.index === 0) {
          console.log("inside , now play will start");
          setShowBackDrop(false);
          startPlay(0);
        }
      }
    }
  };

  const startPlay = async (index: any) => {
    async () => {
      await setShowBackDrop(true);
    };

    if (index <= totalAudioNumber.current) {
      while (!(index in audioBufferForPlay.current)) {
        console.log("audio is in audioBufferForPlay..............");
        setShowBackDrop(true);
        if (index === totalAudioNumber.current) {
          setShowBackDrop(false);
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setShowBackDrop(false);
      audioRef.current.onended = () => {
        if (index + 1 === totalAudioNumber.current) {
          setIsPlaying(false);
        } else {
          startPlay(index + 1);
        }
      };

      if (audioRef.current) {
        if (!audioBufferForPlay.current[index]) {
          setIsPlaying(false);
          return;
        }

        audioRef.current.src = audioBufferForPlay.current[index];
        audioRef.current.load();

        try {
          console.log("before play ............");
          await audioRef.current.play();
          console.log("after play.............");
          if (!isPlaying) {
            setIsPlaying(true);

            setShowBackDrop(false);
          }
        } catch (e: any) {
          console.log(e.message);
        }
      }
    }
  };

  return (
    <div>
      {playButtonVisible ? (
        <PlayCircleOutlineIcon
          fontSize="large"
          sx={{
            position: "absolute",
            top: imagePossition["top"],
            left: imagePossition["left"],
            cursor: "pointer",
            zIndex: 99,
          }}
          onClick={handlePlayButtonClick}
        />
      ) : null}
      {showBackDrop ? (
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={true}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      ) : null}

      <audio ref={audioRef} />
    </div>
  );
}

export default App;
