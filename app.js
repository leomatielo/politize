const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const enableCameraButton = document.getElementById("enableCamera");
const matchButton = document.getElementById("matchButton");
const skipButton = document.getElementById("skipButton");
const endButton = document.getElementById("endButton");
const statusText = document.getElementById("statusText");
const localBadge = document.getElementById("localBadge");
const remoteBadge = document.getElementById("remoteBadge");
const localOverlay = document.getElementById("localOverlay");
const remoteOverlay = document.getElementById("remoteOverlay");
const remoteMessage = document.getElementById("remoteMessage");
const onlineCount = document.getElementById("onlineCount");
const callTimer = document.getElementById("callTimer");

let localStream = null;
let matchTimeout = null;
let timerInterval = null;
let secondsElapsed = 0;

const setStatus = (text) => {
  statusText.textContent = text;
};

const updateTimer = () => {
  const minutes = String(Math.floor(secondsElapsed / 60)).padStart(2, "0");
  const seconds = String(secondsElapsed % 60).padStart(2, "0");
  callTimer.textContent = `${minutes}:${seconds}`;
};

const stopTimer = () => {
  clearInterval(timerInterval);
  timerInterval = null;
  secondsElapsed = 0;
  updateTimer();
};

const startTimer = () => {
  stopTimer();
  timerInterval = setInterval(() => {
    secondsElapsed += 1;
    updateTimer();
  }, 1000);
};

const updateOnlineCount = () => {
  const randomCount = 120 + Math.floor(Math.random() * 280);
  onlineCount.textContent = randomCount.toString();
};

const setRemoteState = (state, message = "") => {
  remoteMessage.textContent = message;
  remoteOverlay.style.opacity = state === "connected" ? "0" : "1";
  remoteOverlay.style.pointerEvents = state === "connected" ? "none" : "auto";
  if (state === "connected") {
    remoteBadge.textContent = "Conectado";
    remoteBadge.classList.add("badge--online");
    remoteBadge.classList.remove("badge--offline");
  } else {
    remoteBadge.textContent = "Sem conexão";
    remoteBadge.classList.remove("badge--online");
    remoteBadge.classList.add("badge--offline");
  }
};

const setLocalState = (enabled) => {
  if (enabled) {
    localBadge.textContent = "Online";
    localBadge.classList.add("badge--online");
    localBadge.classList.remove("badge--offline");
    localOverlay.style.opacity = "0";
    localOverlay.style.pointerEvents = "none";
  } else {
    localBadge.textContent = "Câmera desligada";
    localBadge.classList.remove("badge--online");
    localBadge.classList.add("badge--offline");
    localOverlay.style.opacity = "1";
    localOverlay.style.pointerEvents = "auto";
  }
};

const resetMatch = () => {
  clearTimeout(matchTimeout);
  matchTimeout = null;
  setStatus("Pronto para conectar");
  setRemoteState("idle", "Clique em “Encontrar alguém” para começar.");
  matchButton.disabled = !localStream;
  skipButton.disabled = true;
  endButton.disabled = true;
  stopTimer();
};

const connectToRandom = () => {
  if (!localStream) {
    return;
  }
  setStatus("Procurando alguém online...");
  setRemoteState("searching", "Procurando alguém disponível...");
  matchButton.disabled = true;
  skipButton.disabled = true;
  endButton.disabled = true;
  remoteVideo.srcObject = null;

  matchTimeout = setTimeout(() => {
    remoteVideo.srcObject = localStream;
    remoteVideo.play();
    setStatus("Conectado com uma pessoa aleatória");
    setRemoteState("connected");
    skipButton.disabled = false;
    endButton.disabled = false;
    startTimer();
  }, 2000 + Math.random() * 2000);
};

const endMatch = () => {
  clearTimeout(matchTimeout);
  matchTimeout = null;
  remoteVideo.srcObject = null;
  setRemoteState("idle", "Conexão encerrada. Clique em “Encontrar alguém” para recomeçar.");
  setStatus("Conexão encerrada");
  matchButton.disabled = !localStream;
  skipButton.disabled = true;
  endButton.disabled = true;
  stopTimer();
};

const enableCamera = async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;
    await localVideo.play();
    setLocalState(true);
    matchButton.disabled = false;
    setStatus("Câmera ativa. Pronto para conectar.");
  } catch (error) {
    setStatus("Não foi possível acessar a câmera.");
    alert("Permissão negada ou dispositivo indisponível. Verifique sua câmera/microfone.");
  }
};

enableCameraButton.addEventListener("click", enableCamera);
matchButton.addEventListener("click", connectToRandom);
skipButton.addEventListener("click", () => {
  setStatus("Buscando outra pessoa...");
  setRemoteState("searching", "Trocando para outra pessoa... aguarde.");
  stopTimer();
  connectToRandom();
});
endButton.addEventListener("click", endMatch);

updateTimer();
updateOnlineCount();
setInterval(updateOnlineCount, 6000);
setLocalState(false);
resetMatch();
