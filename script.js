// 1. SELECCIÓN DE ELEMENTOS DE LA INTERFAZ
const intro = document.getElementById("intro");
const room = document.getElementById("room");
const maze = document.getElementById("maze");
const ending = document.getElementById("ending");
const song = document.getElementById("epicSong");

const odysseus = document.getElementById("odysseus");
const penelope = document.getElementById("penelope");
const timer = document.getElementById("timer");
const introPrompt = document.getElementById("introPrompt");
const mazeBackground = document.getElementById("mazeBackground");

const challengeContainer = document.getElementById("challengeContainer");
const challengeInstruction = document.getElementById("challengeInstruction");
const challengeKeysContainer = document.getElementById("challengeKeys");

const romanceBlock = document.getElementById("romanceBlock");
const creditsBlock = document.getElementById("creditsBlock");
const creditsText = document.getElementById("creditsText");

const pauseBtn = document.getElementById("pauseBtn");
const pauseOverlay = document.getElementById("pauseOverlay");
const thanksBlock = document.getElementById("thanksBlock");
const warningToast = document.getElementById("warningToast");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const retryBtn = document.getElementById("retryBtn");

// 2. VARIABLES GLOBALES DE CONFIGURACIÓN Y ESTADO
let pressCount = 0;
let started = false;
let roomFinished = false;
let isPaused = false;
let gameOverTriggered = false;

let scrollStepCount = 0;
const totalScrollsRequired = 3;

let userPerformance = 0.5; 
const maxLabyrinthY = 1500; 
const totalSeconds = 346; 
const reencuentroSecond = 281; // 4:41 de la canción
const creditsSecond = 297; 

const finalChallengeStartSecond = 275; 

let isEndingTriggered = false;
let isCreditsTriggered = false;
let waitingForClimax = false;

let isUserTyping = false;
let typingTimeout = null;
let absoluteInactivityTimeout = null; 
let gameStartedTypingPhase = false; 
let userHasTypedAtLeastOnce = false; 
let hasShownWarning = false; 

let currentChallenge = {
    requiredKeys: [],
    currentIndex: 0,
    isFinalVictoryChallenge: false 
};

const epicLexicon = [
    "ODYSSEUS", "ATHENA", "POSEIDON", "CIRCE", "TELEMACHUS", "PENELOPE", "EURYLOCHUS", "POLITES", 
    "CYCLOPS", "SCYLLA", "ITHACA", "TROY", "UNDERWORLD", "OCEAN", "HOME", "FLEET", "STORM", 
    "ISLAND", "CAVE", "HORIZON", "RUTHLESSNESS", "MERCY", "MONSTER", "WARRIOR", "CAPTAIN", 
    "MUTINY", "GUILT", "SURVIVAL", "SACRIFICE", "CHOICE", "GOODBYE", "THUNDER", "BLOOD", "ROAR", 
    "LOTUS", "WINE", "TORCH", "ARROW", "WHIRLPOOL", "SIRENS", "LEGENDARY", "VENGEANCE", "WISDOM", 
    "SUFFERING", "PRIDE", "TIME", "FATE", "LOVE", "BEAST", "EPIC"
];

const rutaOdiseoX = [23, 20, 25, 18, 22, 26, 20, 24, 28, 32, 35, 42];
const rutaPenelopeX = [73, 76, 71, 78, 74, 70, 76, 72, 68, 64, 61, 55];

// 3. CAPTURA DE TECLADO
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") e.preventDefault();

    if (isPaused && e.code === "Space") {
        togglePause();
        return;
    }

    if (isPaused || gameOverTriggered) return; 

    if (!started) {
        if (e.code === "Space") {
            pressCount++;
            if (pressCount === 1) {
                introPrompt.innerText = "Presiona una vez más para entrar...";
                introPrompt.style.color = "#dfcbf2";
            }
            if (pressCount >= 2) {
                startExperience();
            }
        }
        return;
    }

    if (started && roomFinished && !isEndingTriggered && song.currentTime >= 19) {
        verifyUserKey(e.key.toUpperCase());
    }
});

function startExperience() {
    started = true;
    intro.classList.remove("active");
    room.classList.add("active");
    song.play(); 
    requestAnimationFrame(updateLoop);
}

// 4. CONTROL DE SCROLL EXCLUSIVO
window.addEventListener("wheel", (e) => {
    if (room.classList.contains("active") && !roomFinished) {
        if (e.deltaY < 0) { 
            scrollStepCount++;
            
            const roomBackground = document.querySelector(".room-background");
            let targetZoom = 1 + (scrollStepCount * 1.15);
            if (roomBackground) {
                roomBackground.style.transform = `scale(${targetZoom})`;
            }

            if (scrollStepCount >= totalScrollsRequired || song.currentTime >= 18) {
                roomFinished = true;
                if (roomBackground) {
                    roomBackground.style.filter = "blur(15px) brightness(0.2)";
                    roomBackground.style.transform = "scale(5)"; 
                }

                setTimeout(() => {
                    room.classList.remove("active");
                    maze.classList.add("active");
                    runIntroNarrative(); 
                    setPreGameState();
                }, 600);
            }
        }
    }
});

function runIntroNarrative() {
    challengeInstruction.innerText = "Veinte años de espera en las gélidas costas de Ítaca...";
    setTimeout(() => { if (!isEndingTriggered && !gameOverTriggered) challengeInstruction.innerText = "Odiseo lucha incansablemente contra monstruos, deidades y su propio destino para volver a casa."; }, 5500);
    setTimeout(() => { if (!isEndingTriggered && !gameOverTriggered) challengeInstruction.innerText = "Penélope resiste en el palacio, tejiendo y destejiendo el destino de un reino que se desmorona."; }, 11500);
    setTimeout(() => { if (!isEndingTriggered && !gameOverTriggered) challengeInstruction.innerText = "¡PREPÁRATE! Escribe las palabras rítmicas para entrelazar sus caminos y guiar el reencuentro."; }, 15500);
}

pauseBtn.addEventListener("click", togglePause);

function togglePause() {
    if (!started || isEndingTriggered || gameOverTriggered) return;
    isPaused = !isPaused;

    if (isPaused) {
        song.pause();
        pauseOverlay.style.display = "flex";
        pauseBtn.innerText = "▶️ Continuar";
        clearTimeout(typingTimeout);
        clearTimeout(absoluteInactivityTimeout);
    } else {
        song.play();
        pauseOverlay.style.display = "none";
        pauseBtn.innerText = "⏸️ Pausa";
        if (gameStartedTypingPhase) {
            setTypingState(isUserTyping);
        }
    }
}

retryBtn.addEventListener("click", () => {
    gameOverOverlay.style.display = "none";
    maze.classList.remove("active");
    
    song.pause();
    song.currentTime = 0;

    pressCount = 0;
    started = false;
    roomFinished = false;
    isPaused = false;
    gameOverTriggered = false;
    isEndingTriggered = false;
    isCreditsTriggered = false;
    waitingForClimax = false;
    gameStartedTypingPhase = false;
    userHasTypedAtLeastOnce = false; 
    hasShownWarning = false;
    
    clearTimeout(typingTimeout);
    clearTimeout(absoluteInactivityTimeout);
    scrollStepCount = 0;
    userPerformance = 0.5;
    
    currentChallenge.requiredKeys = [];
    currentChallenge.currentIndex = 0;
    currentChallenge.isFinalVictoryChallenge = false;

    challengeKeysContainer.innerHTML = "";
    challengeContainer.style.opacity = "1";
    document.getElementById("timerContainer").style.opacity = "1";
    pauseBtn.style.display = "block";
    warningToast.classList.remove("show");
    
    odysseus.style.transition = "none";
    penelope.style.transition = "none";
    odysseus.style.opacity = "1";
    penelope.style.opacity = "1";
    mazeBackground.style.opacity = "0.3";

    const roomBackground = document.querySelector(".room-background");
    if (roomBackground) {
        roomBackground.style.transform = "scale(1)";
        roomBackground.style.filter = "none";
    }

    introPrompt.innerText = "Presiona ESPACIO dos veces para entrar";
    introPrompt.style.color = "#bca0dc";

    intro.classList.add("active");
});

// 5. MOTOR DE RETOS
function generateNewChallenge() {
    if (isPaused || gameOverTriggered) return;
    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M", "N", "O", "P", "R", "S", "T", "U", "V", "X", "Y", "Z"];
    const time = song.currentTime;
    
    challengeKeysContainer.innerHTML = "";
    currentChallenge.currentIndex = 0;

    let keysToPress = [];
    let instructionsText = "";

    if (time >= finalChallengeStartSecond) {
        currentChallenge.isFinalVictoryChallenge = true;
        keysToPress = "REENCUENTRO".split("");
        instructionsText = "¡EL LABERINTO SE ABRE! COMPLETA LA PALABRA PARA UNIRLOS:";
    } 
    else if (time >= 19 && time < 112) {
        if (time < 45) { 
            let target = alphabet[Math.floor(Math.random() * alphabet.length)];
            keysToPress = Array(2).fill(target);
            instructionsText = `Reto Bajo - Pulsa la letra:`;
        } else {
            let shortWords = ["HOME", "LOVE", "TIME", "FATE", "EPIC", "CAVE", "TROY"];
            let word = shortWords[Math.floor(Math.random() * shortWords.length)];
            keysToPress = word.split("");
            instructionsText = "Dificultad Media - Escribe:";
        }
    } 
    else if (time >= 114 && time < 162) {
        if (Math.random() > 0.5) {
            let filtered = epicLexicon.filter(w => w.length >= 4 && w.length <= 6);
            let word = filtered[Math.floor(Math.random() * filtered.length)];
            keysToPress = word.split("");
            instructionsText = "Dificultad Medio-Alto - Escribe:";
        } else {
            for(let i=0; i<5; i++) keysToPress.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
            instructionsText = "Secuencia de ritmo rápido:";
        }
    } 
    else if (time >= 162 && time < 229) {
        if (Math.random() > 0.4) {
            let filtered = epicLexicon.filter(w => w.length >= 6 && w.length <= 8);
            let word = filtered[Math.floor(Math.random() * filtered.length)];
            keysToPress = word.split("");
            instructionsText = "¡DIFICULTAD ALTA! Teclea:";
        } else {
            for(let i=0; i<6; i++) keysToPress.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
            instructionsText = "¡Mantén el ritmo acelerado!:";
        }
    } 
    else {
        if (Math.random() > 0.5) {
            let filtered = epicLexicon.filter(w => w.length >= 8);
            let word = filtered[Math.floor(Math.random() * filtered.length)];
            keysToPress = word.split("");
            instructionsText = "¡DIFICULTAD MÁXIMA!:";
        } else {
            for(let i=0; i<7; i++) keysToPress.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
            instructionsText = "¡RÁPIDO, NO TE DETENGAS!:";
        }
    }

    currentChallenge.requiredKeys = keysToPress;
    challengeInstruction.innerText = instructionsText;

    currentChallenge.requiredKeys.forEach(key => {
        const box = document.createElement("div");
        box.className = "key-box";
        box.innerText = key;
        challengeKeysContainer.appendChild(box);
    });
}

function verifyUserKey(pressedKey) {
    if (currentChallenge.requiredKeys.length === 0 || isPaused || gameOverTriggered || waitingForClimax) return;
    
    let expectedKey = currentChallenge.requiredKeys[currentChallenge.currentIndex];

    if (pressedKey === expectedKey) {
        const boxes = challengeKeysContainer.getElementsByClassName("key-box");
        if (boxes[currentChallenge.currentIndex]) {
            boxes[currentChallenge.currentIndex].classList.add("completed");
        }

        currentChallenge.currentIndex++;
        userPerformance += 0.05;
        userHasTypedAtLeastOnce = true; 
        setTypingState(true);

        if (currentChallenge.currentIndex >= currentChallenge.requiredKeys.length) {
            userPerformance += 0.04; 
            
            if (currentChallenge.isFinalVictoryChallenge) {
                waitingForClimax = true;
                challengeContainer.style.opacity = "0"; 
                clearTimeout(typingTimeout);
                clearTimeout(absoluteInactivityTimeout);
                warningToast.classList.remove("show");
            } else {
                setTimeout(generateNewChallenge, 100); 
            }
        }
    } else {
        userPerformance -= 0.04;
        setTypingState(false);
    }
}

// CORRECCIÓN: Rutas estricta de nombres con mayúscula inicial según tu repositorio
function setPreGameState() {
    odysseus.style.backgroundImage = "url('./img/Odiseo_parado.png')";
    penelope.style.backgroundImage = "url('./img/Penelope_parada.png')";
}

// CORRECCIÓN: Nombres exactos de archivos para el estado de tecleo dinámico
function setTypingState(typing) {
    isUserTyping = typing;
    clearTimeout(typingTimeout);
    clearTimeout(absoluteInactivityTimeout);

    if (isUserTyping) {
        odysseus.style.backgroundImage = "url('./img/Odiseo.gif')";
        penelope.style.backgroundImage = "url('./img/Penelope.gif')";

        typingTimeout = setTimeout(() => {
            setTypingState(false);
        }, 5000);
        
    } else {
        odysseus.style.backgroundImage = "url('./img/Odiseo_parado.png')";
        penelope.style.backgroundImage = "url('./img/Penelope_parada.png')";

        if (gameStartedTypingPhase && userHasTypedAtLeastOnce && !isEndingTriggered && !gameOverTriggered && !waitingForClimax) {
            if (!hasShownWarning) {
                hasShownWarning = true;
                warningToast.classList.add("show");
                setTimeout(() => {
                    warningToast.classList.remove("show");
                }, 6000);
            }

            absoluteInactivityTimeout = setTimeout(() => {
                if (!isUserTyping && !isPaused && !isEndingTriggered && !waitingForClimax) {
                    triggerGameOverSequence();
                }
            }, 7000);
        }
    }
}

// 6. BUCLE MAESTRO DE RENDERIZADO
function updateLoop() {
    if (started && roomFinished && !isPaused && !gameOverTriggered) {
        const time = song.currentTime;

        if (time >= 19 && !gameStartedTypingPhase) {
            gameStartedTypingPhase = true;
            setTypingState(false); 
            generateNewChallenge();
        }

        if (time >= finalChallengeStartSecond && !currentChallenge.isFinalVictoryChallenge && !isEndingTriggered) {
            generateNewChallenge();
        }

        if (time >= reencuentroSecond && !isEndingTriggered && !gameOverTriggered) {
            if (waitingForClimax) {
                triggerVictorySequence(); 
            } else {
                triggerGameOverSequence(); 
                return;
            }
        }

        if (!isEndingTriggered) {
            let tiempoProgreso = Math.min(1, time / reencuentroSecond);
            let labyrinthY = tiempoProgreso * maxLabyrinthY;
            mazeBackground.style.transform = `translateY(${labyrinthY}px)`;

            if (gameStartedTypingPhase && !waitingForClimax) {
                if (!isUserTyping) {
                    userPerformance -= 0.0045; 
                } else {
                    userPerformance -= 0.0008; 
                }
            }

            if (userPerformance < 0) userPerformance = 0;
            if (userPerformance > 1) userPerformance = 1;

            let segmentPos = tiempoProgreso * (rutaOdiseoX.length - 1);
            let baseIndex = Math.floor(segmentPos);
            let fraction = segmentPos - baseIndex;

            let currentX_O = rutaOdiseoX[baseIndex] + (rutaOdiseoX[baseIndex + 1] - rutaOdiseoX[baseIndex]) * fraction;
            let currentX_P = rutaPenelopeX[baseIndex] + (rutaPenelopeX[baseIndex + 1] - rutaPenelopeX[baseIndex]) * fraction;

            let swing = Math.sin(labyrinthY * 0.02) * 4;
            odysseus.style.left = `calc(${currentX_O}% + ${swing}px)`;
            penelope.style.left = `calc(${currentX_P}% - ${swing}px)`;

            if (time < 19) {
                odysseus.style.bottom = "15%";
                penelope.style.bottom = "15%";
            } else {
                let variableHeight = waitingForClimax ? 62 : 38 + (userPerformance * 24); 
                odysseus.style.bottom = `${variableHeight}%`;
                penelope.style.bottom = `${variableHeight}%`;
            }

            updateActColorsAndBox(time);
            updateTimer(time);
        }

        if (isEndingTriggered && time >= creditsSecond && !isCreditsTriggered) {
            launchCreditsStyle();
        }
    }

    requestAnimationFrame(updateLoop);
}

function updateTimer(currentTime) {
    let remaining = Math.max(0, reencuentroSecond - Math.floor(currentTime));
    let minutes = Math.floor(remaining / 60);
    let seconds = remaining % 60;
    timer.innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateActColorsAndBox(time) {
    if (time >= 19 && time < 112) { 
        maze.style.background = "linear-gradient(180deg, #131c33, #23163a)";
        challengeContainer.style.borderColor = "#bca0dc";
    } 
    else if (time >= 114 && time < 162) { 
        maze.style.background = "linear-gradient(180deg, #8a1f51, #a82828)"; 
        challengeContainer.style.borderColor = "#a82828";
    } 
    else if (time >= 162 && time < 211) { 
        maze.style.background = "linear-gradient(180deg, #131c33, #1c132e)";
        challengeContainer.style.borderColor = "#7209b7";
    } 
    else if (time >= 211 && time < 229) { 
        maze.style.background = "linear-gradient(180deg, #24
