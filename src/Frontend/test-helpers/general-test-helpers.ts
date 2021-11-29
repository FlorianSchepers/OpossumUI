// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { act, fireEvent, Screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import {
  Attributions,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import {
  EMPTY_FREQUENT_LICENSES,
  EMPTY_PROJECT_METADATA,
} from '../shared-constants';
import isEmpty from 'lodash/isEmpty';

import { ButtonText } from '../enums/enums';
import { canHaveChildren } from '../util/can-have-children';

export const TEST_TIMEOUT = 15000;

export function mockElectronIpcRendererOn(
  mockChannel: string,
  mockChannelReturn: unknown
): unknown {
  return (channel: unknown, listenerCallback: unknown): unknown =>
    // @ts-ignore
    listenerCallback(
      null,
      channel === mockChannel ? mockChannelReturn : undefined
    );
}

export const EMPTY_PARSED_FILE_CONTENT: ParsedFileContent = {
  metadata: EMPTY_PROJECT_METADATA,
  resources: {},
  manualAttributions: {
    attributions: {},
    resourcesToAttributions: {},
  },
  externalAttributions: {
    attributions: {},
    resourcesToAttributions: {},
  },
  frequentLicenses: EMPTY_FREQUENT_LICENSES,
  resolvedExternalAttributions: new Set(),
  attributionBreakpoints: new Set(),
  filesWithChildren: new Set(),
  baseUrlsForSources: {},
  externalAttributionSources: {},
};

export function getParsedInputFileEnrichedWithTestData(testData: {
  resources?: Resources;
  manualAttributions?: Attributions;
  resourcesToManualAttributions?: ResourcesToAttributions;
  externalAttributions?: Attributions;
  resourcesToExternalAttributions?: ResourcesToAttributions;
  attributionBreakpoints?: Set<string>;
  filesWithChildren?: Set<string>;
}): ParsedFileContent {
  const defaultTestResources: Resources = {
    thirdParty: {
      'package_1.tr.gz': 1,
      'package_2.tr.gz': 1,
      'jQuery.js': 1,
    },
  };
  const resources = testData.resources || defaultTestResources;
  const resourceIdOfRoot = getResourceIdOfRoot(resources);

  const testResourcesToManualAttributions = getResourcesToAttributions(
    testData.manualAttributions,
    testData.resourcesToManualAttributions,
    resourceIdOfRoot
  );
  const testResourcesToExternalAttributions = getResourcesToAttributions(
    testData.externalAttributions,
    testData.resourcesToExternalAttributions,
    resourceIdOfRoot
  );

  return {
    ...EMPTY_PARSED_FILE_CONTENT,
    resources,
    manualAttributions: {
      attributions: testData.manualAttributions || {},
      resourcesToAttributions: testResourcesToManualAttributions,
    },
    externalAttributions: {
      attributions: testData.externalAttributions || {},
      resourcesToAttributions: testResourcesToExternalAttributions,
    },
    attributionBreakpoints: testData.attributionBreakpoints || new Set(),
    filesWithChildren: testData.filesWithChildren || new Set(),
  };
}

function getResourceIdOfRoot(resources: Resources): string {
  return (
    '/' +
    Object.keys(resources)[0] +
    (canHaveChildren(resources[Object.keys(resources)[0]]) ? '' : '/')
  );
}

function getResourcesToAttributions(
  attributions: Attributions | undefined,
  resourcesToAttributions: ResourcesToAttributions | undefined,
  resourceIdOfRoot: string
): ResourcesToAttributions {
  let testResourcesToExternalAttributions: ResourcesToAttributions =
    resourcesToAttributions || {};
  if (attributions && isEmpty(testResourcesToExternalAttributions)) {
    testResourcesToExternalAttributions = {
      [resourceIdOfRoot]: Object.keys(attributions),
    };
  }

  return testResourcesToExternalAttributions;
}

export function getButton(screen: Screen, buttonLabel: string): HTMLElement {
  return screen.getByRole('button', { name: buttonLabel });
}

export function clickOnButton(screen: Screen, buttonLabel: string): void {
  fireEvent.click(getButton(screen, buttonLabel));
}

export function expectButton(
  screen: Screen,
  buttonLabel: ButtonText,
  disabled?: boolean
): void {
  const button = getButton(screen, buttonLabel);
  const buttonDisabledAttribute = button.attributes.getNamedItem('disabled');

  if (disabled) {
    expect(buttonDisabledAttribute).toBeTruthy();
  } else {
    expect(buttonDisabledAttribute).toBeFalsy();
  }
}

export function expectButtonIsNotShown(
  screen: Screen,
  buttonLabel: ButtonText
): void {
  expect(screen.queryByRole('button', { name: buttonLabel })).not.toBeTruthy();
}

export function goToView(screen: Screen, view: string): void {
  fireEvent.click(screen.getByText(view) as Element);
}

export function clickOnOpenFileIcon(screen: Screen): void {
  fireEvent.click(getOpenFileIcon(screen));
}

export function getOpenFileIcon(screen: Screen): HTMLElement {
  return screen.getByLabelText('open file');
}

export function clickOnEditIconForElement(
  screen: Screen,
  element: string
): void {
  fireEvent.click(screen.getByLabelText(`edit ${element}`) as Element);
}

export function clickOnProgressBar(screen: Screen): void {
  fireEvent.click(screen.getByLabelText('ProgressBar') as Element);
}

export function clickOnCheckbox(screen: Screen, label: string): void {
  fireEvent.click(
    screen.getByRole('checkbox', { name: `checkbox ${label}` }) as Element
  );
}

export function expectElementsInAutoCompleteAndSelectFirst(
  screen: Screen,
  elements: Array<string>
): void {
  const autoComplete = screen.getByRole('combobox');
  autoComplete.focus();
  fireEvent.keyDown(autoComplete, { key: 'ArrowDown' });

  elements.forEach((element) => expect(screen.getByText(element)));

  fireEvent.click(screen.getByText(elements[0]) as Element);
}

export function expectValuesInProgressbarTooltip(
  screen: Screen,
  numberOfFiles: number,
  filesWithAttribution: number,
  filesWithOnlyPreSelectedAttributions: number,
  filesWithOnlySignals: number
): void {
  (global as typeof globalThis).document.createRange = (): Range =>
    ({
      setStart: (): void => {},
      setEnd: (): void => {},
      commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
      },
    } as unknown as Range);
  jest.useFakeTimers();
  const progressBar = screen.getByLabelText('ProgressBar');
  fireEvent.mouseOver(progressBar);
  act(() => {
    jest.runAllTimers();
  });
  expect(
    screen.getByText(new RegExp(`Number of files: ${numberOfFiles}`))
  ).toBeDefined();
  expect(
    screen.getByText(
      new RegExp(`Files with attributions: ${filesWithAttribution}`)
    ) &&
      screen.getByText(
        new RegExp(
          `Files with only pre-selected attributions: ${filesWithOnlyPreSelectedAttributions}`
        )
      ) &&
      screen.getByText(
        new RegExp(`Files with only signals: ${filesWithOnlySignals}`)
      )
  ).toBeDefined();
}

export function getPackagePanel(
  screen: Screen,
  packagePanelName: string
): HTMLElement {
  return (
    (screen.getByText(packagePanelName).parentElement as HTMLElement)
      .parentElement as HTMLElement
  ).parentElement as HTMLElement;
}