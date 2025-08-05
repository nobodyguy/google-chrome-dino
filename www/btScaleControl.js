import { Progressor } from '@hangtime/grip-connect';

// Progressor Control Variables
let progressor = null;
let currentWeight = 0;
let jumpThreshold = 5;
let lastJumpTime = 0;
let isProgressorConnected = false;
let panelExpanded = false;
let isInitialized = false;

// UI Control Functions
function togglePanel() {
  const panel = document.getElementById("controlPanel");
  const overlay = document.getElementById("overlay");

  if (!panel || !overlay) {
    console.error('Panel or overlay elements not found');
    return;
  }

  panelExpanded = !panelExpanded;

  if (panelExpanded) {
    panel.classList.add("expanded");
    overlay.classList.add("active");
  } else {
    panel.classList.remove("expanded");
    overlay.classList.remove("active");
  }
}

function closePanel() {
  if (panelExpanded) {
    togglePanel();
  }
}

function updateMiniStatus(status, weight) {
  const miniStatus = document.getElementById("miniStatus");
  const miniWeight = document.getElementById("miniWeight");
  const controlMini = document.getElementById("controlMini");

  if (!miniStatus || !miniWeight || !controlMini) {
    console.error('Mini status elements not found');
    return;
  }

  miniStatus.textContent = status.toUpperCase();
  miniWeight.textContent = weight + "kg";

  controlMini.className = "control-mini";
  if (status === "connected") {
    controlMini.classList.add("connected");
  } else if (status === "connecting") {
    controlMini.classList.add("connecting");
  }
}

function updateConnectionStatus(status) {
  const statusElement = document.getElementById("connectionStatus");
  const connectBtn = document.getElementById("connectBtn");
  const tareBtn = document.getElementById("tareBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (!statusElement) {
    console.error('Status elements not found');
    return;
  }

  switch (status) {
    case "connected":
      statusElement.textContent = "Connected";
      statusElement.className = "status-value connected";
      if (connectBtn) connectBtn.disabled = true;
      if (tareBtn) tareBtn.disabled = false;
      if (disconnectBtn) disconnectBtn.disabled = false;
      isProgressorConnected = true;
      updateMiniStatus("connected", currentWeight.toFixed(1));
      break;
    case "connecting":
      statusElement.textContent = "Connecting...";
      statusElement.className = "status-value";
      if (connectBtn) connectBtn.disabled = true;
      updateMiniStatus("connecting", "--");
      break;
    case "disconnected":
      statusElement.textContent = "Disconnected";
      statusElement.className = "status-value disconnected";
      if (connectBtn) connectBtn.disabled = false;
      if (tareBtn) tareBtn.disabled = true;
      if (disconnectBtn) disconnectBtn.disabled = true;
      isProgressorConnected = false;
      updateMiniStatus("disconnected", "--");
      break;
  }
}

function updateWeightDisplay(weight) {
  const weightDisplay = document.getElementById("weightDisplay");
  
  if (!weightDisplay) {
    console.error('Weight display element not found');
    return;
  }

  weightDisplay.textContent = `${weight} kg`;

  updateMiniStatus(
    isProgressorConnected ? "connected" : "disconnected",
    parseFloat(weight).toFixed(1)
  );

  if (parseFloat(weight) >= jumpThreshold) {
    weightDisplay.classList.add("jumping");
  } else {
    weightDisplay.classList.remove("jumping");
  }
}

function lipoVoltageToPercent(millivolts) {
  const volts = millivolts / 1000;

  if (volts >= 4.20) return 100;
  if (volts >= 4.15) return 95;
  if (volts >= 4.11) return 90;
  if (volts >= 4.08) return 85;
  if (volts >= 4.02) return 80;
  if (volts >= 3.98) return 75;
  if (volts >= 3.95) return 70;
  if (volts >= 3.91) return 65;
  if (volts >= 3.87) return 60;
  if (volts >= 3.85) return 55;
  if (volts >= 3.84) return 50;
  if (volts >= 3.82) return 45;
  if (volts >= 3.80) return 40;
  if (volts >= 3.79) return 35;
  if (volts >= 3.77) return 30;
  if (volts >= 3.75) return 25;
  if (volts >= 3.73) return 20;
  if (volts >= 3.71) return 15;
  if (volts >= 3.69) return 10;
  if (volts >= 3.61) return 5;
  if (volts >= 3.50) return 1;
  return 0;
}

async function connectProgressor() {
  try {
    console.log('Attempting to connect to Progressor...');
    updateConnectionStatus("connecting");
    progressor = new Progressor();

    await progressor.connect(
      async () => {
        console.log('Progressor connected successfully');
        updateConnectionStatus("connected");

        progressor.notify((massData) => {
          currentWeight = parseFloat(massData.massTotal);
          //console.log('Weight received:', currentWeight, 'kg');
          updateWeightDisplay(massData.massTotal);

          if (
            currentWeight >= jumpThreshold &&
            Date.now() - lastJumpTime > 300
          ) {
            console.log('Triggering jump - weight:', currentWeight, 'threshold:', jumpThreshold);
            triggerProgressorJump();
            lastJumpTime = Date.now();
          }
        });

        // Get battery info
        try {
          const battery = lipoVoltageToPercent(await progressor.battery());
          const batteryElement = document.getElementById("batteryLevel");
          if (batteryElement) {
            batteryElement.textContent = battery + '%';
          }
          console.log('Battery level:', battery, '%');
        } catch (e) {
          console.error('Error getting battery level:', e);
        }

        console.log('Performing tare...');
        await progressor.tare();
        console.log('Starting stream...');
        await progressor.stream();
      },
      (error) => {
        console.error('Connection failed:', error);
        updateConnectionStatus("disconnected");
        alert("Connection failed: " + error.message);
      }
    );
  } catch (error) {
    console.error('Connection error:', error);
    updateConnectionStatus("disconnected");
    alert("Connection error: " + error.message);
  }
}

async function performTare() {
  if (progressor) {
    console.log('Performing manual tare...');
    await progressor.tare();
  } else {
    console.error('Progressor not connected');
  }
}

function disconnectProgressor() {
  if (progressor) {
    console.log('Disconnecting Progressor...');
    progressor.disconnect();
    progressor = null;
  }
  updateConnectionStatus("disconnected");
  updateWeightDisplay("--");
  const batteryElement = document.getElementById("batteryLevel");
  if (batteryElement) {
    batteryElement.textContent = "--";
  }
}

function triggerProgressorJump() {
  console.log('Triggering dino jump from Progressor');
  if (document.ontouchstart) {
    document.ontouchstart();
  }
}

function bindEventHandlers() {
  console.log('Binding event handlers...');
  
  // Threshold input handler
  const thresholdInput = document.getElementById("thresholdInput");
  if (thresholdInput) {
    thresholdInput.addEventListener("input", (e) => {
      jumpThreshold = parseFloat(e.target.value) || 5;
      console.log('Jump threshold updated to:', jumpThreshold, 'kg');
    });
  }

  // Panel toggle handlers
  const controlMini = document.getElementById("controlMini");
  if (controlMini) {
    controlMini.addEventListener("click", () => {
      console.log('Control mini clicked');
      togglePanel();
    });
  }

  const panelHandle = document.getElementById("panelHandle");
  if (panelHandle) {
    panelHandle.addEventListener("click", () => {
      console.log('Panel handle clicked');
      togglePanel();
    });
  }

  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.addEventListener("click", () => {
      console.log('Overlay clicked');
      closePanel();
    });
  }

  // Button handlers
  const connectBtn = document.getElementById("connectBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", () => {
      console.log('Connect button clicked');
      connectProgressor();
    });
  }

  const tareBtn = document.getElementById("tareBtn");
  if (tareBtn) {
    tareBtn.addEventListener("click", () => {
      console.log('Tare button clicked');
      performTare();
    });
  }

  const disconnectBtn = document.getElementById("disconnectBtn");
  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", () => {
      console.log('Disconnect button clicked');
      disconnectProgressor();
    });
  }

  console.log('Event handlers bound successfully');
}

export function initBtScaleControl() {
  if (isInitialized) {
    return;
  }

  console.log('Initializing BT Scale Control...');
  
  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
      console.log('DOM loaded, binding handlers...');
      bindEventHandlers();
      // Initialize UI
      updateConnectionStatus("disconnected");
      updateMiniStatus("disconnected", "--");
    });
  } else {
    // DOM is already loaded
    console.log('DOM already loaded, binding handlers immediately...');
    bindEventHandlers();
    // Initialize UI
    updateConnectionStatus("disconnected");
    updateMiniStatus("disconnected", "--");
  }

  isInitialized = true;
}