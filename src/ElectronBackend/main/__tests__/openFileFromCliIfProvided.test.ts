// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';

import { openFileFromCliIfProvided } from '../openFileFromCliIfProvided';

const mockHandleOpeningFile = jest.fn();
jest.mock('../listeners', () => ({
  handleOpeningFile: (...args: never): void => mockHandleOpeningFile(args),
}));

describe('openFileFromCli', () => {
  let oldProcessArgv: Array<string>;

  beforeAll(() => {
    oldProcessArgv = process.argv;
  });

  afterAll(() => {
    process.argv = oldProcessArgv;
  });

  beforeEach(() => jest.clearAllMocks());

  it.each`
    inputFileName          | extraParameter
    ${'inputFile.json'}    | ${null}
    ${'inputFile.json.gz'} | ${null}
    ${'inputFile.json'}    | ${'--dev'}
  `(
    'calls openFile with input file $inputFileName and extraParameter $extraParameter',
    async ({ inputFileName, extraParameter }) => {
      const oldProcessArgv = process.argv;
      process.argv = ['app'];
      if (extraParameter) {
        process.argv.push(extraParameter);
      }
      process.argv.push(inputFileName);

      await openFileFromCliIfProvided(
        'mockBrowserWindow' as unknown as BrowserWindow,
      );
      expect(mockHandleOpeningFile).toHaveBeenCalledWith([
        'mockBrowserWindow',
        inputFileName,
      ]);

      process.argv = oldProcessArgv;
    },
  );

  it.each`
    inputFileName
    ${'inputFile.txt'}
    ${null}
  `(
    'does not call openFile with input file $inputFileName',
    async ({ inputFileName }) => {
      const oldProcessArgv = process.argv;
      process.argv = ['app'];
      if (inputFileName) {
        process.argv.push(inputFileName);
      }

      await openFileFromCliIfProvided(
        'mockBrowserWindow' as unknown as BrowserWindow,
      );
      expect(mockHandleOpeningFile).not.toHaveBeenCalled();

      process.argv = oldProcessArgv;
    },
  );
});
