import * as alt from '@altv/client';
import game from '@altv/natives';
import Font from "../enums/Font.js";
import Point from "./Point.js";
import Size from "./Size.js";
import Text from '../modules/Text.js';

const gameScreen = game.getActualScreenResolution(0, 0);

export default class Screen {
    public static Width: number = gameScreen[0];
    public static Height: number = gameScreen[1];

    public static get ResolutionMaintainRatio(): Size {
        const ratio = Screen.Width / Screen.Height;
        const width = 1080.0 * ratio;

        return new Size(width, 1080.0);
    }

    public static MousePosition(relative: boolean = false): { X: number; Y: number } {
        const res = Screen.ResolutionMaintainRatio;
        const cursor: { x: number; y: number; } = alt.Cursor.pos as { x: number; y: number; };
        let [mouseX, mouseY] = [cursor.x, cursor.y];
        if (relative)
            [mouseX, mouseY] = [cursor.x / res.Width, cursor.y / res.Height];
        return {
            X: mouseX,
            Y: mouseY
        };
    }

    public static IsMouseInBounds(topLeft: Point, boxSize: Size) {
        const mousePosition = Screen.MousePosition();
        return (
            mousePosition.X >= topLeft.X &&
            mousePosition.X <= topLeft.X + boxSize.Width &&
            (mousePosition.Y > topLeft.Y && mousePosition.Y < topLeft.Y + boxSize.Height)
        );
    }

    public static GetTextWidth(text: string, font: Font, scale: number): number {
        // Start by requesting the game to start processing a width measurement
        game.beginTextCommandGetScreenWidthOfDisplayText("CELL_EMAIL_BCON");
        // Add the text string
        Text.AddLongString(text);

        // Set the properties for the text
        game.setTextFont(font);
        game.setTextScale(1.0, scale);

        // Ask the game for the relative string width
        const width: number = game.endTextCommandGetScreenWidthOfDisplayText(true);
        // And return the literal result
        const res = Screen.ResolutionMaintainRatio;
        return res.Width * width;
    }

    public static GetLineCount(text: string, position: Point, font: Font, scale: number, wrap: number): number {
        // Tell the game that we are going to request the number of lines
        game.beginTextCommandGetNumberOfLinesForString("CELL_EMAIL_BCON");
        // Add the text that has been sent to us
        Text.AddLongString(text);

        // Get the resolution with the correct aspect ratio
        const res: Size = Screen.ResolutionMaintainRatio;
        // Calculate the x and y positions
        const x: number = position.X / res.Width;
        const y: number = position.Y / res.Height;

        // Set the properties for the text
        game.setTextFont(font);
        game.setTextScale(1.0, scale);

        // If there is some text wrap to add
        if (wrap > 0) {
            // Calculate the wrap size
            const start: number = position.X / res.Width;
            const end: number = start + (wrap / res.Width);
            // And apply it
            game.setTextWrap(x, end);
        }

        // Finally, return the number of lines being made by the string  
        let lineCount = game.endTextCommandGetNumberOfLinesForString(x, y);
        return lineCount;
    }
}