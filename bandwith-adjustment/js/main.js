/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* global TimelineDataSeries, TimelineGraphView */

"use strict";

const remoteVideo1 = document.querySelector("video#remoteVideo1");
const remoteVideo2 = document.querySelector("video#remoteVideo2");
const localVideo = document.querySelector("video#localVideo1");

const callButton = document.querySelector("button#callButton");
const callButton2 = document.querySelector("button#callButton2");
const hangupButton = document.querySelector("button#hangupButton");
const hangupButton2 = document.querySelector("button#hangupButton2");
const bandwidthSelector = document.querySelector("select#bandwidth");
const bandwidthSelector2 = document.querySelector("select#bandwidth2");
hangupButton.disabled = true;
hangupButton2.disabled = true;
callButton.onclick = call;
callButton2.onclick = call;
hangupButton.onclick = hangup;
hangupButton2.onclick = hangup;

const rVideoCodec= document.querySelector('span#rVideoCodec');
const rVideoDim = document.querySelector('span#rVideoDim');
const r2VideoCodec= document.querySelector('span#r2VideoCodec');
const r2VideoDim = document.querySelector('span#r2VideoDim');

let localPc1;
let localPc2;
let remotePc1;
let remotePc2;
let localStream;
let localStream2;

// Can be set in the console before making a call to test this keeps
// within the envelope set by the SDP. In kbps.
const maxBandwidth = 0;

let bitrateGraph;
let bitrateSeries;
let packetGraph;
let packetSeries;
let lastResult;

let bitrateGraph2;
let bitrateSeries2;
let packetGraph2;
let packetSeries2;
let lastResult2;

let receiverBitrateGraph;
let receiverBitrateSeries;
let receiverPacketGraph;
let receiverPacketSeries;
let remoteLastResult;

let receiverBitrateGraph2;
let receiverBitrateSeries2;
let receiverPacketGraph2;
let receiverPacketSeries2;
let remoteLastResult2;


const offerOptions = {
  offerToReceiveAudio: 0,
  offerToReceiveVideo: 1
};

async function gotStream(stream, pcIndex) {
  console.log("Received local stream");
  let localOffer;

  if (pcIndex === 1) {
    hangupButton.disabled = false;
    localStream = stream;
    localVideo.srcObject = stream;
    localStream
      .getTracks()
      .forEach(track => localPc1.addTrack(track, localStream));
    console.log("Adding Local Stream to peer connection 1");

    try {
      localOffer = await localPc1.createOffer(offerOptions);
      await gotDescription1(pcIndex, localOffer);

      bitrateSeries = new TimelineDataSeries();
      bitrateGraph = new TimelineGraphView("bitrateGraph", "bitrateCanvas");
      bitrateGraph.updateEndDate();

      packetSeries = new TimelineDataSeries();
      packetGraph = new TimelineGraphView("packetGraph", "packetCanvas");
      packetGraph.updateEndDate();

      receiverBitrateSeries = new TimelineDataSeries();
      receiverBitrateGraph = new TimelineGraphView("receiverBitrateGraph", "receiverBitrateCanvas");
      receiverBitrateGraph.updateEndDate();

      receiverPacketSeries = new TimelineDataSeries();
      receiverPacketGraph = new TimelineGraphView("receiverPacketGraph", "receiverPacketCanvas");
      receiverPacketGraph.updateEndDate();
    } catch (ex) {
      onCreateSessionDescriptionError(ex);
    }
  } else {
    hangupButton2.disabled = false;
    localStream2 = stream;
    localStream2
      .getTracks()
      .forEach(track => localPc2.addTrack(track, localStream2));
    console.log("Adding Local Stream to peer connection 2");
    try {
      localOffer = await localPc2.createOffer(offerOptions);
      await gotDescription1(pcIndex, localOffer);

      bitrateSeries2 = new TimelineDataSeries();
      bitrateGraph2 = new TimelineGraphView("bitrateGraph2", "bitrateCanvas2");
      bitrateGraph2.updateEndDate();

      packetSeries2 = new TimelineDataSeries();
      packetGraph2 = new TimelineGraphView("packetGraph2", "packetCanvas2");
      packetGraph2.updateEndDate();

      receiverBitrateSeries2 = new TimelineDataSeries();
      receiverBitrateGraph2 = new TimelineGraphView("receiverBitrateGraph2", "receiverBitrateCanvas2");
      receiverBitrateGraph2.updateEndDate();

      receiverPacketSeries2 = new TimelineDataSeries();
      receiverPacketGraph2 = new TimelineGraphView("receiverPacketGraph2", "receiverPacketCanvas2");
      receiverPacketGraph2.updateEndDate();

    } catch (ex) {
      onCreateSessionDescriptionError(ex);
    }
  }
}

function onCreateSessionDescriptionError(error) {
  console.log("Failed to create session description: " + error.toString());
}

function call() {
  this.disabled = true;
  const pcIndex = +this.dataset.pc;
  console.log("Starting call");
  const servers = null;
  if (pcIndex === 1) {
    bandwidthSelector.disabled = false;

    localPc1 = new RTCPeerConnection(servers);
    console.log("Created local peer connection object localPc1");
    localPc1.onicecandidate = onIceCandidate.bind(localPc1);

    remotePc1 = new RTCPeerConnection(servers);
    console.log("Created remote peer connection object remotePc1");
    remotePc1.onicecandidate = onIceCandidate.bind(remotePc1);
    remotePc1.ontrack = event => gotRemoteStream(event, pcIndex);
  } else {
    bandwidthSelector2.disabled = false;

    localPc2 = new RTCPeerConnection(servers);
    console.log("Created local peer connection object localPc2");
    localPc2.onicecandidate = onIceCandidate.bind(localPc2);

    remotePc2 = new RTCPeerConnection(servers);
    console.log("Created remote peer connection object remotePc2");
    remotePc2.onicecandidate = onIceCandidate.bind(remotePc2);
    remotePc2.ontrack = event => gotRemoteStream(event, pcIndex);
  }
  (async () => {
    try {
      console.log("Requesting local stream");
      let s = await navigator.mediaDevices.getUserMedia({ video: { height: 720, width: 1280 } });
      gotStream(s, pcIndex);
    } catch (ex) {
      alert("getUserMedia() error: " + ex.name);
    }
  })();
}

async function gotDescription1(index, desc) {
  let remoteAnswer;
  try {
    if (index === 1) {
      console.log("Offer from localPc1 \n" + desc.sdp);
      await localPc1.setLocalDescription(desc);
      await remotePc1.setRemoteDescription(desc);
      remoteAnswer = await remotePc1.createAnswer();
    } else {
      console.log("Offer from localPc2 \n" + desc.sdp);
      await localPc2.setLocalDescription(desc);
      await remotePc2.setRemoteDescription(desc);
      remoteAnswer = await remotePc2.createAnswer();
    }
    gotDescription2(index, remoteAnswer);
  } catch (ex) {
    onSetSessionDescriptionError(ex);
  }
}

async function gotDescription2(index, desc) {
  try {
    if (index === 1) {
      await remotePc1.setLocalDescription(desc);
      console.log("Answer from remotePc1 \n" + desc.sdp);
      if (maxBandwidth) {
        await localPc1.setRemoteDescription({
          type: desc.type,
          sdp: updateBandwidthRestriction(desc.sdp, maxBandwidth)
        });
      } else {
        await localPc1.setRemoteDescription(desc);
      }
    } else {
      await remotePc2.setLocalDescription(desc);
      console.log("Answer from remotePc2 \n" + desc.sdp);
      if (maxBandwidth) {
        await localPc2.setRemoteDescription({
          type: desc.type,
          sdp: updateBandwidthRestriction(desc.sdp, maxBandwidth)
        });
      } else {
        await localPc2.setRemoteDescription(desc);
      }
    }
  } catch (ex) {
    onSetSessionDescriptionError(ex);
  }
}

function hangup() {
  const pcIndex = +this.dataset.pc;
  console.log(`Ending call for ${pcIndex}`);

  if (pcIndex === 1) {
    localStream.getTracks().forEach(track => track.stop());
    localPc1.close();
    remotePc1.close();
    localPc1 = null;
    remotePc1 = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
    bandwidthSelector.disabled = true;
    if (localStream2) {
      localVideo.srcObject = localStream2;
    }
  } else {
    localStream2.getTracks().forEach(track => track.stop());
    localPc2.close();
    remotePc2.close();
    localPc2 = null;
    remotePc2 = null;
    hangupButton2.disabled = true;
    callButton2.disabled = false;
    bandwidthSelector2.disabled = true;
  }
}

function gotRemoteStream(e, index) {
  if (index === 1 && remoteVideo1.srcObject !== e.streams[0]) {
    remoteVideo1.srcObject = e.streams[0];
    console.log("Received remote stream 1");
  } else if (index === 2 && remoteVideo2.srcObject !== e.streams[0]) {
    remoteVideo2.srcObject = e.streams[0];
    console.log("Received remote stream 1");
  }
}

function getOtherPc(pc) {
  switch (pc) {
    case localPc1:
      return remotePc1;
    case localPc2:
      return remotePc2;
    case remotePc1:
      return localPc1;
    case remotePc2:
      return localPc2;
  }
}

function getName(pc) {
  switch (pc) {
    case localPc1:
      return "localPc1";
    case localPc2:
      return "localPc2";
    case remotePc1:
      return "remotePc1";
    case remotePc2:
      return "remotePc2";
  }
}

function onIceCandidate(event) {
  getOtherPc(this)
    .addIceCandidate(event.candidate)
    .then(onAddIceCandidateSuccess)
    .catch(onAddIceCandidateError);

  console.log(
    `${getName(this)} ICE candidate:\n${
      event.candidate ? event.candidate.candidate : "(null)"
    }`
  );
}

function onAddIceCandidateSuccess() {
  console.log("AddIceCandidate success.");
}

function onAddIceCandidateError(error) {
  console.log("Failed to add ICE Candidate: " + error.toString());
}

function onSetSessionDescriptionError(error) {
  console.log("Failed to set session description: " + error.toString());
}

// renegotiate bandwidth on the fly.
bandwidthSelector.onchange = async () => {
  bandwidthSelector.disabled = true;
  const bandwidth =
    bandwidthSelector.options[bandwidthSelector.selectedIndex].value;

  const sender = localPc1.getSenders()[0];
  const parameters = sender.getParameters();
  if (!parameters.encodings) {
    parameters.encodings = [{}];
  }
  if (bandwidth === "unlimited") {
    delete parameters.encodings[0].maxBitrate;
  } else {
    parameters.encodings[0].maxBitrate = bandwidth * 1000;
  }

  try {
    await sender.setParameters(parameters);
    bandwidthSelector.disabled = false;
  } catch (ex) {
    onsole.error(ex);
  }
};

bandwidthSelector2.onchange = async () => {
  bandwidthSelector2.disabled = true;
  const bandwidth =
    bandwidthSelector2.options[bandwidthSelector2.selectedIndex].value;

  const sender = localPc2.getSenders()[0];
  const parameters = sender.getParameters();
  if (!parameters.encodings) {
    parameters.encodings = [{}];
  }
  if (bandwidth === "unlimited") {
    delete parameters.encodings[0].maxBitrate;
  } else {
    parameters.encodings[0].maxBitrate = bandwidth * 1000;
  }
  try {
    await sender.setParameters(parameters);
    bandwidthSelector.disabled = false;
  } catch (ex) {
    onsole.error(ex);
  }
};

function updateBandwidthRestriction(sdp, bandwidth) {
  let modifier = "AS";
  if (adapter.browserDetails.browser === "firefox") {
    bandwidth = (bandwidth >>> 0) * 1000;
    modifier = "TIAS";
  }
  if (sdp.indexOf("b=" + modifier + ":") === -1) {
    // insert b= after c= line.
    sdp = sdp.replace(
      /c=IN (.*)\r\n/,
      "c=IN $1\r\nb=" + modifier + ":" + bandwidth + "\r\n"
    );
  } else {
    sdp = sdp.replace(
      new RegExp("b=" + modifier + ":.*\r\n"),
      "b=" + modifier + ":" + bandwidth + "\r\n"
    );
  }
  return sdp;
}

function removeBandwidthRestriction(sdp) {
  return sdp.replace(/b=AS:.*\r\n/, "").replace(/b=TIAS:.*\r\n/, "");
}

async function senderStatsPc1() {
  if (!localPc1) {
    return;
  }
  const sender = localPc1.getSenders()[0];
  if (!sender) {
    return;
  }

  const res = await sender.getStats();
  res.forEach(report => {
    let bytes;
    let packets;
    if (report.type === "outbound-rtp") {
      if (report.isRemote) {
        return;
      }
      const now = report.timestamp;
      bytes = report.bytesSent;
      packets = report.packetsSent;
      if (lastResult && lastResult.has(report.id)) {
        // calculate bitrate
        const bitrate =
          (8 * (bytes - lastResult.get(report.id).bytesSent)) /
          (now - lastResult.get(report.id).timestamp);

        // append to chart
        bitrateSeries.addPoint(now, bitrate);
        bitrateGraph.setDataSeries([bitrateSeries]);
        bitrateGraph.updateEndDate();

        // calculate number of packets and append to chart
        packetSeries.addPoint(
          now,
          packets - lastResult.get(report.id).packetsSent
        );
        packetGraph.setDataSeries([packetSeries]);
        packetGraph.updateEndDate();
      }
    }
  });
  lastResult = res;
}

async function senderStatsPc2() {
  if (!localPc2) {
    return;
  }
  const sender = localPc2.getSenders()[0];
  if (!sender) {
    return;
  }

  const res = await sender.getStats();
  res.forEach(report => {
    let bytes;
    let packets;
    if (report.type === "outbound-rtp") {
      if (report.isRemote) {
        return;
      }
      const now = report.timestamp;
      bytes = report.bytesSent;
      packets = report.packetsSent;
      if (lastResult2 && lastResult2.has(report.id)) {
        // calculate bitrate
        const bitrate =
          (8 * (bytes - lastResult2.get(report.id).bytesSent)) /
          (now - lastResult2.get(report.id).timestamp);

        // append to chart
        bitrateSeries2.addPoint(now, bitrate);
        bitrateGraph2.setDataSeries([bitrateSeries2]);
        bitrateGraph2.updateEndDate();

        // calculate number of packets and append to chart
        packetSeries2.addPoint(
          now,
          packets - lastResult2.get(report.id).packetsSent
        );
        packetGraph2.setDataSeries([packetSeries2]);
        packetGraph2.updateEndDate();
      }
    }
  });
  lastResult2 = res;
}


async function receiverStatsPc1() {
  if (!remotePc1) {
    return;
  }
  const receiver = remotePc1.getReceivers()[0];
  if (!receiver) {
    return;
  }

  const res = await receiver.getStats();
  res.forEach(report => {
    let bytes;
    let packets;
    if (report.type === "inbound-rtp") {
      if (report.isRemote) {
        return;
      }

      const track = res.get(report.trackId);
      if(track) {
        rVideoDim.innerHTML = `Dim: <b>W: ${track.frameWidth}</b> x <b>H: ${track.frameHeight}</b>`;
      }
      
      const codec = res.get(report.codecId);
      if(codec) {
        rVideoCodec.innerHTML = `Codec: <b>${codec.mimeType.replace('video/', '')}</b>`;
      }
           
      const now = report.timestamp;
      bytes = report.bytesReceived;
      packets = report.packetsReceived;
      if (remoteLastResult && remoteLastResult.has(report.id)) {

        const lastReport = remoteLastResult.get(report.id);
        // calculate bitrate
        const bitrate =
          (8 * (bytes - lastReport.bytesReceived)) /
          (now - lastReport.timestamp);

        // append to chart
        receiverBitrateSeries.addPoint(now, bitrate);
        receiverBitrateGraph.setDataSeries([receiverBitrateSeries]);
        receiverBitrateGraph.updateEndDate();

        // calculate number of packets and append to chart
        
        receiverPacketSeries.addPoint(
          now,
          packets - lastReport.packetsReceived
        );
        receiverPacketGraph.setDataSeries([receiverPacketSeries]);
        receiverPacketGraph.updateEndDate();
      }
    }
  });
  remoteLastResult = res;
}

async function receiverStatsPc2() {
  if (!remotePc2) {
    return;
  }
  const receiver = remotePc2.getReceivers()[0];
  if (!receiver) {
    return;
  }

  const res = await receiver.getStats();
  res.forEach(report => {
    let bytes;
    let packets;
    if (report.type === "inbound-rtp") {
      if (report.isRemote) {
        return;
      }

      const track = res.get(report.trackId);
      if(track) {
        r2VideoDim.innerHTML = `Dim: <b>W: ${track.frameWidth}</b> x <b>H: ${track.frameHeight}</b>`;
      }
      
      const codec = res.get(report.codecId);
      if(codec) {
        r2VideoCodec.innerHTML = `Codec: <b>${codec.mimeType.replace('video/', '')}</b>`;
      }

      const now = report.timestamp;
      bytes = report.bytesReceived;
      packets = report.packetsReceived;
      if (remoteLastResult2 && remoteLastResult2.has(report.id)) {

        const lastReport = remoteLastResult2.get(report.id);
        // calculate bitrate
        const bitrate =
          (8 * (bytes - lastReport.bytesReceived)) /
          (now - lastReport.timestamp);

        // append to chart
        receiverBitrateSeries2.addPoint(now, bitrate);
        receiverBitrateGraph2.setDataSeries([receiverBitrateSeries2]);
        receiverBitrateGraph2.updateEndDate();

        // calculate number of packets and append to chart
        
        receiverPacketSeries2.addPoint(
          now,
          packets - lastReport.packetsReceived
        );
        receiverPacketGraph2.setDataSeries([receiverPacketSeries2]);
        receiverPacketGraph2.updateEndDate();
      }
    }
  });
  remoteLastResult2 = res;
}

// query getStats every second
window.setInterval(() => {
  Promise.all([senderStatsPc1(), senderStatsPc2(), receiverStatsPc1(), receiverStatsPc2()]);
}, 1000);
