"use client";

import { useEffect, useRef } from "react";

const DOT_SIZE = 2.5;
const DOT_SPACING = 3.5;
const BG_COLOR: [number, number, number] = [0.078, 0.086, 0.118];
const PROXIMITY_RADIUS = 8;

const COLOR_STORY: [number, number, number][] = [
  [0.05, 0.15, 0.45],
  [0.1, 0.4, 1.0],
  [0.0, 0.6, 0.8],
  [0.0, 0.7, 0.4],
  [0.0, 0.85, 0.3],
  [0.5, 0.9, 0.1],
  [1.0, 0.65, 0.0],
  [1.0, 0.15, 0.45],
  [0.7, 0.0, 0.9],
  [0.55, 0.1, 1.0],
  [0.0, 0.5, 0.9],
  [0.0, 0.7, 0.6],
];

const PIXEL_DATA = {
  text: "TOONE",
  gridCols: 58,
  gridRows: 20,
  pixelSize: 200,
  pixels: [
    { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 },
    { col: 4, row: 0 }, { col: 5, row: 0 }, { col: 6, row: 0 }, { col: 7, row: 0 },
    { col: 8, row: 0 }, { col: 9, row: 0 }, { col: 10, row: 0 }, { col: 11, row: 0 },
    { col: 14, row: 0 }, { col: 15, row: 0 }, { col: 16, row: 0 }, { col: 17, row: 0 },
    { col: 18, row: 0 }, { col: 19, row: 0 }, { col: 20, row: 0 }, { col: 21, row: 0 },
    { col: 26, row: 0 }, { col: 27, row: 0 }, { col: 28, row: 0 }, { col: 29, row: 0 },
    { col: 30, row: 0 }, { col: 31, row: 0 }, { col: 32, row: 0 }, { col: 33, row: 0 },
    { col: 36, row: 0 }, { col: 37, row: 0 }, { col: 38, row: 0 }, { col: 39, row: 0 },
    { col: 40, row: 0 }, { col: 41, row: 0 }, { col: 42, row: 0 }, { col: 43, row: 0 },
    { col: 44, row: 0 }, { col: 45, row: 0 }, { col: 48, row: 0 }, { col: 49, row: 0 },
    { col: 50, row: 0 }, { col: 51, row: 0 }, { col: 52, row: 0 }, { col: 53, row: 0 },
    { col: 54, row: 0 }, { col: 55, row: 0 }, { col: 56, row: 0 }, { col: 57, row: 0 },
    { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 },
    { col: 4, row: 1 }, { col: 5, row: 1 }, { col: 6, row: 1 }, { col: 7, row: 1 },
    { col: 8, row: 1 }, { col: 9, row: 1 }, { col: 10, row: 1 }, { col: 11, row: 1 },
    { col: 13, row: 1 }, { col: 14, row: 1 }, { col: 15, row: 1 }, { col: 16, row: 1 },
    { col: 17, row: 1 }, { col: 18, row: 1 }, { col: 19, row: 1 }, { col: 20, row: 1 },
    { col: 21, row: 1 }, { col: 22, row: 1 }, { col: 25, row: 1 }, { col: 26, row: 1 },
    { col: 27, row: 1 }, { col: 28, row: 1 }, { col: 29, row: 1 }, { col: 30, row: 1 },
    { col: 31, row: 1 }, { col: 32, row: 1 }, { col: 33, row: 1 }, { col: 34, row: 1 },
    { col: 36, row: 1 }, { col: 37, row: 1 }, { col: 38, row: 1 }, { col: 39, row: 1 },
    { col: 40, row: 1 }, { col: 41, row: 1 }, { col: 42, row: 1 }, { col: 43, row: 1 },
    { col: 44, row: 1 }, { col: 45, row: 1 }, { col: 46, row: 1 }, { col: 48, row: 1 },
    { col: 49, row: 1 }, { col: 50, row: 1 }, { col: 51, row: 1 }, { col: 52, row: 1 },
    { col: 53, row: 1 }, { col: 54, row: 1 }, { col: 55, row: 1 }, { col: 56, row: 1 },
    { col: 57, row: 1 },
    { col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 },
    { col: 4, row: 2 }, { col: 5, row: 2 }, { col: 6, row: 2 }, { col: 7, row: 2 },
    { col: 8, row: 2 }, { col: 9, row: 2 }, { col: 10, row: 2 }, { col: 11, row: 2 },
    { col: 12, row: 2 }, { col: 13, row: 2 }, { col: 14, row: 2 }, { col: 15, row: 2 },
    { col: 16, row: 2 }, { col: 17, row: 2 }, { col: 18, row: 2 }, { col: 19, row: 2 },
    { col: 20, row: 2 }, { col: 21, row: 2 }, { col: 22, row: 2 }, { col: 23, row: 2 },
    { col: 24, row: 2 }, { col: 25, row: 2 }, { col: 26, row: 2 }, { col: 27, row: 2 },
    { col: 28, row: 2 }, { col: 29, row: 2 }, { col: 30, row: 2 }, { col: 31, row: 2 },
    { col: 32, row: 2 }, { col: 33, row: 2 }, { col: 34, row: 2 }, { col: 35, row: 2 },
    { col: 36, row: 2 }, { col: 37, row: 2 }, { col: 38, row: 2 }, { col: 39, row: 2 },
    { col: 40, row: 2 }, { col: 41, row: 2 }, { col: 42, row: 2 }, { col: 43, row: 2 },
    { col: 44, row: 2 }, { col: 45, row: 2 }, { col: 46, row: 2 }, { col: 47, row: 2 },
    { col: 48, row: 2 }, { col: 49, row: 2 }, { col: 50, row: 2 }, { col: 51, row: 2 },
    { col: 52, row: 2 }, { col: 53, row: 2 }, { col: 54, row: 2 }, { col: 55, row: 2 },
    { col: 56, row: 2 }, { col: 57, row: 2 },
    { col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 },
    { col: 4, row: 3 }, { col: 5, row: 3 }, { col: 6, row: 3 }, { col: 7, row: 3 },
    { col: 8, row: 3 }, { col: 9, row: 3 }, { col: 10, row: 3 }, { col: 11, row: 3 },
    { col: 12, row: 3 }, { col: 13, row: 3 }, { col: 14, row: 3 }, { col: 15, row: 3 },
    { col: 16, row: 3 }, { col: 17, row: 3 }, { col: 18, row: 3 }, { col: 19, row: 3 },
    { col: 20, row: 3 }, { col: 21, row: 3 }, { col: 22, row: 3 }, { col: 23, row: 3 },
    { col: 24, row: 3 }, { col: 25, row: 3 }, { col: 26, row: 3 }, { col: 27, row: 3 },
    { col: 28, row: 3 }, { col: 29, row: 3 }, { col: 30, row: 3 }, { col: 31, row: 3 },
    { col: 32, row: 3 }, { col: 33, row: 3 }, { col: 34, row: 3 }, { col: 35, row: 3 },
    { col: 36, row: 3 }, { col: 37, row: 3 }, { col: 38, row: 3 }, { col: 39, row: 3 },
    { col: 40, row: 3 }, { col: 41, row: 3 }, { col: 42, row: 3 }, { col: 43, row: 3 },
    { col: 44, row: 3 }, { col: 45, row: 3 }, { col: 46, row: 3 }, { col: 47, row: 3 },
    { col: 48, row: 3 }, { col: 49, row: 3 }, { col: 50, row: 3 }, { col: 51, row: 3 },
    { col: 52, row: 3 }, { col: 53, row: 3 }, { col: 54, row: 3 }, { col: 55, row: 3 },
    { col: 56, row: 3 }, { col: 57, row: 3 },
    { col: 4, row: 4 }, { col: 5, row: 4 }, { col: 6, row: 4 }, { col: 7, row: 4 },
    { col: 12, row: 4 }, { col: 13, row: 4 }, { col: 14, row: 4 }, { col: 15, row: 4 },
    { col: 20, row: 4 }, { col: 21, row: 4 }, { col: 22, row: 4 }, { col: 23, row: 4 },
    { col: 24, row: 4 }, { col: 25, row: 4 }, { col: 26, row: 4 }, { col: 27, row: 4 },
    { col: 32, row: 4 }, { col: 33, row: 4 }, { col: 34, row: 4 }, { col: 35, row: 4 },
    { col: 36, row: 4 }, { col: 37, row: 4 }, { col: 38, row: 4 }, { col: 39, row: 4 },
    { col: 44, row: 4 }, { col: 45, row: 4 }, { col: 46, row: 4 }, { col: 47, row: 4 },
    { col: 48, row: 4 }, { col: 49, row: 4 }, { col: 50, row: 4 }, { col: 51, row: 4 },
    { col: 4, row: 5 }, { col: 5, row: 5 }, { col: 6, row: 5 }, { col: 7, row: 5 },
    { col: 12, row: 5 }, { col: 13, row: 5 }, { col: 14, row: 5 }, { col: 15, row: 5 },
    { col: 20, row: 5 }, { col: 21, row: 5 }, { col: 22, row: 5 }, { col: 23, row: 5 },
    { col: 24, row: 5 }, { col: 25, row: 5 }, { col: 26, row: 5 }, { col: 27, row: 5 },
    { col: 32, row: 5 }, { col: 33, row: 5 }, { col: 34, row: 5 }, { col: 35, row: 5 },
    { col: 36, row: 5 }, { col: 37, row: 5 }, { col: 38, row: 5 }, { col: 39, row: 5 },
    { col: 44, row: 5 }, { col: 45, row: 5 }, { col: 46, row: 5 }, { col: 47, row: 5 },
    { col: 48, row: 5 }, { col: 49, row: 5 }, { col: 50, row: 5 }, { col: 51, row: 5 },
    { col: 4, row: 6 }, { col: 5, row: 6 }, { col: 6, row: 6 }, { col: 7, row: 6 },
    { col: 12, row: 6 }, { col: 13, row: 6 }, { col: 14, row: 6 }, { col: 15, row: 6 },
    { col: 20, row: 6 }, { col: 21, row: 6 }, { col: 22, row: 6 }, { col: 23, row: 6 },
    { col: 24, row: 6 }, { col: 25, row: 6 }, { col: 26, row: 6 }, { col: 27, row: 6 },
    { col: 32, row: 6 }, { col: 33, row: 6 }, { col: 34, row: 6 }, { col: 35, row: 6 },
    { col: 36, row: 6 }, { col: 37, row: 6 }, { col: 38, row: 6 }, { col: 39, row: 6 },
    { col: 44, row: 6 }, { col: 45, row: 6 }, { col: 46, row: 6 }, { col: 47, row: 6 },
    { col: 48, row: 6 }, { col: 49, row: 6 }, { col: 50, row: 6 }, { col: 51, row: 6 },
    { col: 4, row: 7 }, { col: 5, row: 7 }, { col: 6, row: 7 }, { col: 7, row: 7 },
    { col: 12, row: 7 }, { col: 13, row: 7 }, { col: 14, row: 7 }, { col: 15, row: 7 },
    { col: 20, row: 7 }, { col: 21, row: 7 }, { col: 22, row: 7 }, { col: 23, row: 7 },
    { col: 24, row: 7 }, { col: 25, row: 7 }, { col: 26, row: 7 }, { col: 27, row: 7 },
    { col: 32, row: 7 }, { col: 33, row: 7 }, { col: 34, row: 7 }, { col: 35, row: 7 },
    { col: 36, row: 7 }, { col: 37, row: 7 }, { col: 38, row: 7 }, { col: 39, row: 7 },
    { col: 44, row: 7 }, { col: 45, row: 7 }, { col: 46, row: 7 }, { col: 47, row: 7 },
    { col: 48, row: 7 }, { col: 49, row: 7 }, { col: 50, row: 7 }, { col: 51, row: 7 },
    { col: 4, row: 8 }, { col: 5, row: 8 }, { col: 6, row: 8 }, { col: 7, row: 8 },
    { col: 12, row: 8 }, { col: 13, row: 8 }, { col: 14, row: 8 }, { col: 15, row: 8 },
    { col: 20, row: 8 }, { col: 21, row: 8 }, { col: 22, row: 8 }, { col: 23, row: 8 },
    { col: 24, row: 8 }, { col: 25, row: 8 }, { col: 26, row: 8 }, { col: 27, row: 8 },
    { col: 32, row: 8 }, { col: 33, row: 8 }, { col: 34, row: 8 }, { col: 35, row: 8 },
    { col: 36, row: 8 }, { col: 37, row: 8 }, { col: 38, row: 8 }, { col: 39, row: 8 },
    { col: 44, row: 8 }, { col: 45, row: 8 }, { col: 46, row: 8 }, { col: 47, row: 8 },
    { col: 48, row: 8 }, { col: 49, row: 8 }, { col: 50, row: 8 }, { col: 51, row: 8 },
    { col: 52, row: 8 }, { col: 53, row: 8 }, { col: 54, row: 8 }, { col: 55, row: 8 },
    { col: 56, row: 8 }, { col: 57, row: 8 },
    { col: 4, row: 9 }, { col: 5, row: 9 }, { col: 6, row: 9 }, { col: 7, row: 9 },
    { col: 12, row: 9 }, { col: 13, row: 9 }, { col: 14, row: 9 }, { col: 15, row: 9 },
    { col: 20, row: 9 }, { col: 21, row: 9 }, { col: 22, row: 9 }, { col: 23, row: 9 },
    { col: 24, row: 9 }, { col: 25, row: 9 }, { col: 26, row: 9 }, { col: 27, row: 9 },
    { col: 32, row: 9 }, { col: 33, row: 9 }, { col: 34, row: 9 }, { col: 35, row: 9 },
    { col: 36, row: 9 }, { col: 37, row: 9 }, { col: 38, row: 9 }, { col: 39, row: 9 },
    { col: 44, row: 9 }, { col: 45, row: 9 }, { col: 46, row: 9 }, { col: 47, row: 9 },
    { col: 48, row: 9 }, { col: 49, row: 9 }, { col: 50, row: 9 }, { col: 51, row: 9 },
    { col: 52, row: 9 }, { col: 53, row: 9 }, { col: 54, row: 9 }, { col: 55, row: 9 },
    { col: 56, row: 9 }, { col: 57, row: 9 },
    { col: 4, row: 10 }, { col: 5, row: 10 }, { col: 6, row: 10 }, { col: 7, row: 10 },
    { col: 12, row: 10 }, { col: 13, row: 10 }, { col: 14, row: 10 }, { col: 15, row: 10 },
    { col: 20, row: 10 }, { col: 21, row: 10 }, { col: 22, row: 10 }, { col: 23, row: 10 },
    { col: 24, row: 10 }, { col: 25, row: 10 }, { col: 26, row: 10 }, { col: 27, row: 10 },
    { col: 32, row: 10 }, { col: 33, row: 10 }, { col: 34, row: 10 }, { col: 35, row: 10 },
    { col: 36, row: 10 }, { col: 37, row: 10 }, { col: 38, row: 10 }, { col: 39, row: 10 },
    { col: 44, row: 10 }, { col: 45, row: 10 }, { col: 46, row: 10 }, { col: 47, row: 10 },
    { col: 48, row: 10 }, { col: 49, row: 10 }, { col: 50, row: 10 }, { col: 51, row: 10 },
    { col: 52, row: 10 }, { col: 53, row: 10 }, { col: 54, row: 10 }, { col: 55, row: 10 },
    { col: 56, row: 10 }, { col: 57, row: 10 },
    { col: 4, row: 11 }, { col: 5, row: 11 }, { col: 6, row: 11 }, { col: 7, row: 11 },
    { col: 12, row: 11 }, { col: 13, row: 11 }, { col: 14, row: 11 }, { col: 15, row: 11 },
    { col: 20, row: 11 }, { col: 21, row: 11 }, { col: 22, row: 11 }, { col: 23, row: 11 },
    { col: 24, row: 11 }, { col: 25, row: 11 }, { col: 26, row: 11 }, { col: 27, row: 11 },
    { col: 32, row: 11 }, { col: 33, row: 11 }, { col: 34, row: 11 }, { col: 35, row: 11 },
    { col: 36, row: 11 }, { col: 37, row: 11 }, { col: 38, row: 11 }, { col: 39, row: 11 },
    { col: 44, row: 11 }, { col: 45, row: 11 }, { col: 46, row: 11 }, { col: 47, row: 11 },
    { col: 48, row: 11 }, { col: 49, row: 11 }, { col: 50, row: 11 }, { col: 51, row: 11 },
    { col: 52, row: 11 }, { col: 53, row: 11 }, { col: 54, row: 11 }, { col: 55, row: 11 },
    { col: 56, row: 11 }, { col: 57, row: 11 },
    { col: 4, row: 12 }, { col: 5, row: 12 }, { col: 6, row: 12 }, { col: 7, row: 12 },
    { col: 12, row: 12 }, { col: 13, row: 12 }, { col: 14, row: 12 }, { col: 15, row: 12 },
    { col: 20, row: 12 }, { col: 21, row: 12 }, { col: 22, row: 12 }, { col: 23, row: 12 },
    { col: 24, row: 12 }, { col: 25, row: 12 }, { col: 26, row: 12 }, { col: 27, row: 12 },
    { col: 32, row: 12 }, { col: 33, row: 12 }, { col: 34, row: 12 }, { col: 35, row: 12 },
    { col: 36, row: 12 }, { col: 37, row: 12 }, { col: 38, row: 12 }, { col: 39, row: 12 },
    { col: 44, row: 12 }, { col: 45, row: 12 }, { col: 46, row: 12 }, { col: 47, row: 12 },
    { col: 48, row: 12 }, { col: 49, row: 12 }, { col: 50, row: 12 }, { col: 51, row: 12 },
    { col: 4, row: 13 }, { col: 5, row: 13 }, { col: 6, row: 13 }, { col: 7, row: 13 },
    { col: 12, row: 13 }, { col: 13, row: 13 }, { col: 14, row: 13 }, { col: 15, row: 13 },
    { col: 20, row: 13 }, { col: 21, row: 13 }, { col: 22, row: 13 }, { col: 23, row: 13 },
    { col: 24, row: 13 }, { col: 25, row: 13 }, { col: 26, row: 13 }, { col: 27, row: 13 },
    { col: 32, row: 13 }, { col: 33, row: 13 }, { col: 34, row: 13 }, { col: 35, row: 13 },
    { col: 36, row: 13 }, { col: 37, row: 13 }, { col: 38, row: 13 }, { col: 39, row: 13 },
    { col: 44, row: 13 }, { col: 45, row: 13 }, { col: 46, row: 13 }, { col: 47, row: 13 },
    { col: 48, row: 13 }, { col: 49, row: 13 }, { col: 50, row: 13 }, { col: 51, row: 13 },
    { col: 4, row: 14 }, { col: 5, row: 14 }, { col: 6, row: 14 }, { col: 7, row: 14 },
    { col: 12, row: 14 }, { col: 13, row: 14 }, { col: 14, row: 14 }, { col: 15, row: 14 },
    { col: 20, row: 14 }, { col: 21, row: 14 }, { col: 22, row: 14 }, { col: 23, row: 14 },
    { col: 24, row: 14 }, { col: 25, row: 14 }, { col: 26, row: 14 }, { col: 27, row: 14 },
    { col: 32, row: 14 }, { col: 33, row: 14 }, { col: 34, row: 14 }, { col: 35, row: 14 },
    { col: 36, row: 14 }, { col: 37, row: 14 }, { col: 38, row: 14 }, { col: 39, row: 14 },
    { col: 44, row: 14 }, { col: 45, row: 14 }, { col: 46, row: 14 }, { col: 47, row: 14 },
    { col: 48, row: 14 }, { col: 49, row: 14 }, { col: 50, row: 14 }, { col: 51, row: 14 },
    { col: 4, row: 15 }, { col: 5, row: 15 }, { col: 6, row: 15 }, { col: 7, row: 15 },
    { col: 12, row: 15 }, { col: 13, row: 15 }, { col: 14, row: 15 }, { col: 15, row: 15 },
    { col: 20, row: 15 }, { col: 21, row: 15 }, { col: 22, row: 15 }, { col: 23, row: 15 },
    { col: 24, row: 15 }, { col: 25, row: 15 }, { col: 26, row: 15 }, { col: 27, row: 15 },
    { col: 32, row: 15 }, { col: 33, row: 15 }, { col: 34, row: 15 }, { col: 35, row: 15 },
    { col: 36, row: 15 }, { col: 37, row: 15 }, { col: 38, row: 15 }, { col: 39, row: 15 },
    { col: 44, row: 15 }, { col: 45, row: 15 }, { col: 46, row: 15 }, { col: 47, row: 15 },
    { col: 48, row: 15 }, { col: 49, row: 15 }, { col: 50, row: 15 }, { col: 51, row: 15 },
    { col: 4, row: 16 }, { col: 5, row: 16 }, { col: 6, row: 16 }, { col: 7, row: 16 },
    { col: 12, row: 16 }, { col: 13, row: 16 }, { col: 14, row: 16 }, { col: 15, row: 16 },
    { col: 16, row: 16 }, { col: 17, row: 16 }, { col: 18, row: 16 }, { col: 19, row: 16 },
    { col: 20, row: 16 }, { col: 21, row: 16 }, { col: 22, row: 16 }, { col: 23, row: 16 },
    { col: 24, row: 16 }, { col: 25, row: 16 }, { col: 26, row: 16 }, { col: 27, row: 16 },
    { col: 28, row: 16 }, { col: 29, row: 16 }, { col: 30, row: 16 }, { col: 31, row: 16 },
    { col: 32, row: 16 }, { col: 33, row: 16 }, { col: 34, row: 16 }, { col: 35, row: 16 },
    { col: 36, row: 16 }, { col: 37, row: 16 }, { col: 38, row: 16 }, { col: 39, row: 16 },
    { col: 44, row: 16 }, { col: 45, row: 16 }, { col: 46, row: 16 }, { col: 47, row: 16 },
    { col: 48, row: 16 }, { col: 49, row: 16 }, { col: 50, row: 16 }, { col: 51, row: 16 },
    { col: 52, row: 16 }, { col: 53, row: 16 }, { col: 54, row: 16 }, { col: 55, row: 16 },
    { col: 56, row: 16 }, { col: 57, row: 16 },
    { col: 4, row: 17 }, { col: 5, row: 17 }, { col: 6, row: 17 }, { col: 7, row: 17 },
    { col: 12, row: 17 }, { col: 13, row: 17 }, { col: 14, row: 17 }, { col: 15, row: 17 },
    { col: 16, row: 17 }, { col: 17, row: 17 }, { col: 18, row: 17 }, { col: 19, row: 17 },
    { col: 20, row: 17 }, { col: 21, row: 17 }, { col: 22, row: 17 }, { col: 23, row: 17 },
    { col: 24, row: 17 }, { col: 25, row: 17 }, { col: 26, row: 17 }, { col: 27, row: 17 },
    { col: 28, row: 17 }, { col: 29, row: 17 }, { col: 30, row: 17 }, { col: 31, row: 17 },
    { col: 32, row: 17 }, { col: 33, row: 17 }, { col: 34, row: 17 }, { col: 35, row: 17 },
    { col: 36, row: 17 }, { col: 37, row: 17 }, { col: 38, row: 17 }, { col: 39, row: 17 },
    { col: 44, row: 17 }, { col: 45, row: 17 }, { col: 46, row: 17 }, { col: 47, row: 17 },
    { col: 48, row: 17 }, { col: 49, row: 17 }, { col: 50, row: 17 }, { col: 51, row: 17 },
    { col: 52, row: 17 }, { col: 53, row: 17 }, { col: 54, row: 17 }, { col: 55, row: 17 },
    { col: 56, row: 17 }, { col: 57, row: 17 },
    { col: 4, row: 18 }, { col: 5, row: 18 }, { col: 6, row: 18 }, { col: 7, row: 18 },
    { col: 13, row: 18 }, { col: 14, row: 18 }, { col: 15, row: 18 }, { col: 16, row: 18 },
    { col: 17, row: 18 }, { col: 18, row: 18 }, { col: 19, row: 18 }, { col: 20, row: 18 },
    { col: 21, row: 18 }, { col: 22, row: 18 }, { col: 25, row: 18 }, { col: 26, row: 18 },
    { col: 27, row: 18 }, { col: 28, row: 18 }, { col: 29, row: 18 }, { col: 30, row: 18 },
    { col: 31, row: 18 }, { col: 32, row: 18 }, { col: 33, row: 18 }, { col: 34, row: 18 },
    { col: 36, row: 18 }, { col: 37, row: 18 }, { col: 38, row: 18 }, { col: 39, row: 18 },
    { col: 44, row: 18 }, { col: 45, row: 18 }, { col: 46, row: 18 }, { col: 47, row: 18 },
    { col: 48, row: 18 }, { col: 49, row: 18 }, { col: 50, row: 18 }, { col: 51, row: 18 },
    { col: 52, row: 18 }, { col: 53, row: 18 }, { col: 54, row: 18 }, { col: 55, row: 18 },
    { col: 56, row: 18 }, { col: 57, row: 18 },
    { col: 4, row: 19 }, { col: 5, row: 19 }, { col: 6, row: 19 }, { col: 7, row: 19 },
    { col: 14, row: 19 }, { col: 15, row: 19 }, { col: 16, row: 19 }, { col: 17, row: 19 },
    { col: 18, row: 19 }, { col: 19, row: 19 }, { col: 20, row: 19 }, { col: 21, row: 19 },
    { col: 26, row: 19 }, { col: 27, row: 19 }, { col: 28, row: 19 }, { col: 29, row: 19 },
    { col: 30, row: 19 }, { col: 31, row: 19 }, { col: 32, row: 19 }, { col: 33, row: 19 },
    { col: 36, row: 19 }, { col: 37, row: 19 }, { col: 38, row: 19 }, { col: 39, row: 19 },
    { col: 44, row: 19 }, { col: 45, row: 19 }, { col: 46, row: 19 }, { col: 47, row: 19 },
    { col: 48, row: 19 }, { col: 49, row: 19 }, { col: 50, row: 19 }, { col: 51, row: 19 },
    { col: 52, row: 19 }, { col: 53, row: 19 }, { col: 54, row: 19 }, { col: 55, row: 19 },
    { col: 56, row: 19 }, { col: 57, row: 19 },
  ],
};

interface Cell {
  col: number;
  row: number;
}

interface FieldData {
  cols: number;
  rows: number;
  textEdgeCells: Cell[];
  textInteriorCells: Cell[];
  numSectors: number;
  numLayers: number;
  sectorLayerCells: Cell[][][];
  centerCol: number;
  centerRow: number;
  distance: Int32Array;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRGB(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function rgba(c: [number, number, number], a: number) {
  return `rgba(${(c[0] * 255) | 0},${(c[1] * 255) | 0},${(c[2] * 255) | 0},${a})`;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function buildFieldData(w: number, h: number): FieldData | null {
  const cols = Math.ceil(w / DOT_SPACING) + 1;
  const rows = Math.ceil(h / DOT_SPACING) + 1;

  const textEdgeCells: Cell[] = [];
  const textInteriorCells: Cell[] = [];
  const textSet = new Set<number>();

  const colOffset = Math.floor((cols - PIXEL_DATA.gridCols) / 2);
  const rowOffset = Math.floor((rows - PIXEL_DATA.gridRows) / 2);
  for (const p of PIXEL_DATA.pixels) {
    const sc = p.col + colOffset;
    const sr = p.row + rowOffset;
    if (sc >= 0 && sc < cols && sr >= 0 && sr < rows)
      textSet.add(sr * cols + sc);
  }

  for (const idx of textSet) {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    let isEdge = false;
    for (let dr = -1; dr <= 1 && !isEdge; dr++)
      for (let dc = -1; dc <= 1 && !isEdge; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr < 0 ||
          nr >= rows ||
          nc < 0 ||
          nc >= cols ||
          !textSet.has(nr * cols + nc)
        )
          isEdge = true;
      }
    (isEdge ? textEdgeCells : textInteriorCells).push({ col: c, row: r });
  }

  const totalCells = cols * rows;
  const distance = new Int32Array(totalCells).fill(-1);
  const queue: number[] = [];
  for (const idx of textSet) {
    distance[idx] = 0;
    queue.push(idx);
  }
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const d = distance[idx];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const nIdx = nr * cols + nc;
        if (distance[nIdx] === -1) {
          distance[nIdx] = d + 1;
          queue.push(nIdx);
        }
      }
  }

  let maxTextDist = 0;
  for (let i = 0; i < totalCells; i++)
    if (distance[i] > maxTextDist) maxTextDist = distance[i];

  const numSectors = 12;
  const layerThickness = 20;
  const numLayers = Math.floor(maxTextDist / layerThickness) + 1;
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);

  const sectorLayerCells: Cell[][][] = [];
  for (let s = 0; s < numSectors; s++) {
    sectorLayerCells[s] = [];
    for (let l = 0; l < numLayers; l++) sectorLayerCells[s][l] = [];
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const d = distance[r * cols + c];
      if (d <= 0) continue;
      const layer = Math.min(
        Math.floor(d / layerThickness),
        numLayers - 1
      );
      let angle = Math.atan2(r - centerRow, c - centerCol);
      if (angle < 0) angle += 2 * Math.PI;
      const sector = Math.min(
        Math.floor((angle / (2 * Math.PI)) * numSectors),
        numSectors - 1
      );
      sectorLayerCells[sector][layer].push({ col: c, row: r });
    }

  return {
    cols,
    rows,
    textEdgeCells,
    textInteriorCells,
    numSectors,
    numLayers,
    sectorLayerCells,
    centerCol,
    centerRow,
    distance,
  };
}

export default function LandingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let fieldData: FieldData | null = null;
    let startTime: number | null = null;
    let animId: number;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      fieldData = buildFieldData(window.innerWidth, window.innerHeight);
    }

    function renderText(elapsed: number) {
      if (!fieldData || !ctx) return;
      const textPulse = (Math.sin(elapsed * 2.0) + 1.0) / 2.0;
      const shimmer = (Math.sin(elapsed * 3.5) + 1.0) / 2.0;

      if (fieldData.textInteriorCells.length > 0) {
        const tint = textPulse * 0.08;
        ctx.fillStyle = rgba(
          [1.0 - tint * 0.1, 1.0 - tint * 0.05, 1.0],
          0.95 + shimmer * 0.05
        );
        for (const cell of fieldData.textInteriorCells)
          ctx.fillRect(
            cell.col * DOT_SPACING - DOT_SIZE / 2,
            cell.row * DOT_SPACING - DOT_SIZE / 2,
            DOT_SIZE,
            DOT_SIZE
          );
      }
      if (fieldData.textEdgeCells.length > 0) {
        const s = 0.95 + shimmer * 0.05;
        ctx.fillStyle = rgba([s, s, 1.0], 0.97 + shimmer * 0.03);
        for (const cell of fieldData.textEdgeCells)
          ctx.fillRect(
            cell.col * DOT_SPACING - DOT_SIZE / 2,
            cell.row * DOT_SPACING - DOT_SIZE / 2,
            DOT_SIZE,
            DOT_SIZE
          );
      }
    }

    function renderOutline(elapsed: number) {
      if (!fieldData || !ctx || fieldData.numSectors <= 0) return;
      const { numSectors, numLayers, sectorLayerCells, distance, cols } =
        fieldData;
      const halfSectors = (numSectors / 2) | 0;
      const storyCount = COLOR_STORY.length;

      const sweepX = Math.sin(elapsed * 1.3);
      const sweepY = Math.cos(elapsed * 0.7);
      let sweepAngle = Math.atan2(sweepY, sweepX);
      if (sweepAngle < 0) sweepAngle += 2 * Math.PI;

      const colorDrift =
        elapsed * 0.4 +
        Math.sin(elapsed * 0.3) * 2.0 +
        Math.sin(elapsed * 0.13) * 1.5;
      const rotatePhase =
        elapsed * 0.35 +
        Math.sin(elapsed * 0.5) * 0.8 +
        Math.cos(elapsed * 0.19) * 0.5;

      for (let sector = 0; sector < numSectors; sector++) {
        const sectorAngle =
          ((sector + 0.5) / numSectors) * 2 * Math.PI;
        const mirrorSector =
          sector < halfSectors ? sector : numSectors - 1 - sector;
        let angleDiff = Math.abs(sectorAngle - sweepAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        const sweepGlow = Math.max(0, 1.0 - angleDiff * 2.0);
        const sectorColorOffset = mirrorSector + rotatePhase;

        for (let layer = 0; layer < numLayers; layer++) {
          const cells = sectorLayerCells[sector][layer];
          if (!cells || cells.length === 0) continue;

          const depthNorm = (numLayers - layer) / numLayers;
          const depthFactor = 1.0 + depthNorm * depthNorm * 1.8;
          const colorPos = mod(
            sectorColorOffset * depthFactor + colorDrift + layer * 0.7,
            storyCount
          );
          const cIdx = Math.floor(colorPos) % storyCount;
          const nextCIdx = (cIdx + 1) % storyCount;
          const layerColor = lerpRGB(
            COLOR_STORY[cIdx],
            COLOR_STORY[nextCIdx],
            colorPos - Math.floor(colorPos)
          );

          const breatheBoost =
            Math.sin(elapsed * 1.2 + layer * 0.4) * 0.12;
          const distFade = layer / numLayers;
          const baseOp = Math.max(
            0.15,
            0.65 - distFade * 0.3 + breatheBoost
          );
          const opacity = Math.min(0.85, baseOp + sweepGlow * 0.35);

          for (const cell of cells) {
            const d = distance[cell.row * cols + cell.col];
            let fc: [number, number, number] = layerColor;
            let fo = opacity;
            if (d > 0 && d <= PROXIMITY_RADIUS) {
              const prox = 1.0 - d / PROXIMITY_RADIUS;
              fc = lerpRGB(layerColor, [1.0, 1.0, 1.0], prox * prox * 0.45);
              fo = Math.min(0.92, opacity + prox * 0.15);
            }
            const scanDim = cell.row % 2 !== 0 ? 0.55 : 1.0;
            ctx!.fillStyle = rgba(fc, fo * scanDim);
            ctx!.fillRect(
              cell.col * DOT_SPACING - DOT_SIZE / 2,
              cell.row * DOT_SPACING - DOT_SIZE / 2,
              DOT_SIZE,
              DOT_SIZE
            );
          }
        }
      }

      renderText(elapsed);
    }

    function frame(timestamp: number) {
      if (!startTime) startTime = timestamp;
      ctx!.fillStyle = rgba(BG_COLOR, 1);
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      if (fieldData)
        renderOutline((timestamp - startTime) / 1000);
      animId = requestAnimationFrame(frame);
    }

    resize();
    animId = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}
