import fs from 'fs';
import path from 'path';

/**
 * Given a filename and a directory, returns an iterator allowing module iteration
 * @param {string} filename The current filename triggering this function
 * @param {string} directory The directory to traverse on. This directory should be in the same parent directory of the current file
 */
export default function* directoryFiles<T>(filename: string, directory: string) {
    const files = fs.readdirSync(`${path.dirname(filename)}${path.sep}${directory}`).filter(file => file.endsWith(path.extname(filename)));

    for (const file of files) {
        yield require(`${path.dirname(filename)}${path.sep}${directory}${path.sep}${file}`) as T;
    }
} 