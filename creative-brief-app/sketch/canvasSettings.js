import RainDrop from "./RainDrop";

// canvas
export const canvasSideLength = 500;
export const gridDims = [100, 100];
export const skyDepthFactor = 0.5; // how much of the sketch is sky
export const skyDepth = skyDepthFactor * canvasSideLength;
export const skyGridDepth = skyDepthFactor * gridDims[1];
export const pixelWidth = canvasSideLength / gridDims[0];
export const pixelHeight = canvasSideLength / gridDims[1];

// NPCs
export const npcRabbitWidth = pixelWidth * 2;
export const npcRabbitHeight = pixelHeight * 3;
export const visitorWidth = pixelWidth * 10;
export const visitorHeight = pixelHeight * 20;

// simulated rabbit
export const littleRabbitWidth = pixelWidth * 2;
export const littleRabbitHeight = pixelHeight * 2;

// pixel materials
export const SKY = 0;
export const DIRT = 1;
export const WALL = 2;
export const ROOM = 3;
export const GRASS = 4;

// rain
export const rain = new Array(200)
  .fill(null)
  .map(() => new RainDrop(canvasSideLength, skyDepth));
