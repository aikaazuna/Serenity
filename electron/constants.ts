import { app } from "electron";

export const isDev = !app.isPackaged;

export const MAIN_WINDOW_WIDTH = 1180;
export const MAIN_WINDOW_HEIGHT = 780;
export const MAIN_WINDOW_MIN_WIDTH = 920;
export const MAIN_WINDOW_MIN_HEIGHT = 600;

export const VITE_DEV_SERVER_URL = "http://localhost:5188";
