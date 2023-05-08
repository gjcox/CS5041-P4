/* This code is adapted from https://github.com/atorov/react-hooks-p5js by Veselin. Accessed 04/05/2023.*/

import { Activity } from "../components/RabbitSim";
import {
  checkNearDawnDusk,
  seasonalDawnDusk,
} from "../helper_functions/dateAndTime";
import {
  DIRT,
  GRASS,
  ROOM,
  SKY,
  WALL,
  canvasHeight,
  canvasWidth,
  pixelHeight,
  pixelWidth,
  skyDepth,
  skyGridDepth,
} from "./canvasSettings";

export default function (s) {
  s.state = {};
  // s.dispatch = () => { }

  s.setup = () => {
    s.createCanvas(canvasWidth, canvasHeight);
  };

  s.draw = () => {
    s.noStroke();

    // draw the sky
    s.colorMode(s.HSB);
    s.fill(...pixelColour(SKY));
    for (let row = 0; row < skyGridDepth; row++) {
      let y = row * s.state.pixelHeight;
      for (let col = 0; col < s.state.pixels[row].length; col++) {
        let x = col * s.state.pixelWidth;
        s.rect(x, y, s.state.pixelWidth, s.state.pixelHeight);
      }
    }

    drawWeather();

    // draw the ground and burrow
    s.colorMode(s.HSB);
    for (let row = skyGridDepth; row < s.state.pixels.length; row++) {
      let y = row * s.state.pixelHeight;
      for (let col = 0; col < s.state.pixels[row].length; col++) {
        let x = col * s.state.pixelWidth;
        let colour = pixelColour(s.state.pixels[row][col]);
        if (typeof colour == "string") {
          s.fill(colour);
        } else {
          s.fill(...colour);
        }
        s.rect(x, y, s.state.pixelWidth, s.state.pixelHeight);
      }
    }

    // draw the grey and white rabbits
    renderRabbit(s.state.greyRabbit);
    renderRabbit(s.state.whiteRabbit);

    // conditionally draw visitor
    if (s.state.simEnvData.visitor.value) renderVisitor(s.state.visitor);

    // draw little rabbit
    renderRabbit(s.state.littleRabbit);
    s.textSize(pixelHeight * 1.5);
    s.textAlign(s.CENTER, s.BOTTOM);
    s.text(
      activityText(),
      s.state.littleRabbit.x + s.state.littleRabbit.w / 2,
      s.state.littleRabbit.y - s.state.littleRabbit.h
    );
  };

  function pixelColour(int) {
    switch (int) {
      case SKY:
        return skyColour(
          s.state.simEnvData.time.value,
          s.state.simEnvData.season.value,
          s.state.raining
        );
      case DIRT:
        return "sienna";
      case WALL:
        return "saddlebrown";
      case ROOM:
        return "sandybrown";
      case GRASS:
        return "forestgreen";
    }
  }

  function skyColour(time, season, raining) {
    let { dawn, dusk } = seasonalDawnDusk[season];
    if (raining) {
      if (time > 720) {
        time = 1440 - time;
      }
      let brightness = s.map(time, 0, 720, 15, 75);
      return [215, 20, brightness];
    } else if (checkNearDawnDusk(season, time, 0.5)) {
      // sunrise/sunset
      return [345, 70, 75];
    } else if (time < dawn || time > dusk) {
      //nighttime
      return [252, 35, 16];
    } else {
      //daytime
      return [180, 75, 75];
    }
  }

  function renderRabbit(npc) {
    npc.applyGravity();
    s.noStroke();
    s.fill(npc.colour);
    s.rect(npc.x, npc.y - npc.h, npc.w, npc.h);
  }

  function renderVisitor(npc) {
    npc.applyGravity();
    s.noStroke();
    s.fill(npc.colour);
    s.triangle(
      npc.x,
      npc.y,
      npc.x + npc.w,
      npc.y,
      npc.x + npc.w / 2,
      npc.y - npc.h
    );
  }

  function activityText() {
    switch (s.state.rabbitActivity) {
      case Activity.sleep:
        return "Zzzzz...";
      case Activity.feed:
        return "*munching*";
      case Activity.play:
        return "*playing*";
      case Activity.exercise:
        return "*exercising*";
      case Activity.hide:
        return "*hiding*";
      case Activity.shelter:
        return "*sheltering*";
    }
  }

  function drawWeather() {
    // TODO stop sun and moon clipping with the dirt
    let time = s.state.simEnvData.time.value;
    let season = s.state.simEnvData.season.value;
    let { dawn, dusk } = seasonalDawnDusk[season];
    if (s.state.raining) {
      s.state.raindrops.map(drawRainDrop);
    } else if (time < dawn || time > dusk) {
      drawMoon(time, dawn, dusk);
    } else {
      drawSun(time, dawn, dusk);
    }
  }

  function drawRainDrop(drop) {
    s.noStroke();
    s.fill(255);
    s.ellipse(drop.x, drop.y, s.random(1, 5), s.random(1, 5));
    drop.update();
  }

  function drawSun(time, dawn, dusk) {
    let y;
    let x = s.map(time, dawn, dusk, 0, canvasWidth);
    if (time < 720) {
      y = skyDepth - s.map(time, dawn, 720, 0, skyDepth);
    } else {
      y = skyDepth - s.map(time, 720, dusk, 0, skyDepth);
    }
    s.fill("gold");
    s.circle(x, y, pixelWidth * 15);
  }

  function drawMoon(time, dawn, dusk) {
    // TODO check this works
    let x, y;
    if (time < 720) {
      y = skyDepth - s.map(time, 0, dawn, 0, skyDepth);
      x = s.map(time, 0, dawn, canvasWidth / 2, canvasWidth);
    } else {
      y = skyDepth - s.map(time, dusk, 1440, skyDepth, 0);
      x = s.map(time, dusk, 1440, 0, canvasWidth / 2);
    }
    s.fill("ghostwhite");
    s.circle(x, y, pixelWidth * 10);
  }
}

/* End of adapted code */
