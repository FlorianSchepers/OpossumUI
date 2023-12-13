// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import { renderComponent, renderHook } from '../../../test-helpers/render';
import {
  FetchLicenseInformationButton,
  FetchStatus,
  useFetchPackageInfo,
} from '../FetchLicenseInformationButton';
import {
  convertGithubPayload,
  getGithubAPIUrl,
} from '../github-fetching-helpers';
import { getPypiAPIUrl } from '../pypi-fetching-helpers';

jest.useFakeTimers();

const axiosMock = new MockAdapter(axios);

describe('FetchLicenseInformationButton', () => {
  it('renders no button when disabled', () => {
    const { container } = render(
      <FetchLicenseInformationButton
        disabled={true}
        url={'https://github.com/reactchartjs/react-chartjs-2/tree/d8c'}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders tooltip vor invalid domain', () => {
    render(
      <FetchLicenseInformationButton disabled={false} url={'invalid url'} />,
    );
    expect(
      screen.getByLabelText(
        text.attributionColumn.packageSubPanel.fetchPackageInfoNotPossible,
      ),
    ).toBeInTheDocument();
  });

  it('renders enabled button', () => {
    renderComponent(
      <FetchLicenseInformationButton
        url={'https://pypi.org/pypi/pip'}
        disabled={false}
      />,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  describe('Tooltip', () => {
    it("shows fetching error tooltip 'Network error'", async () => {
      const MOCK_URL = 'https://pypi.org/pypi/test';

      axiosMock.onGet(getPypiAPIUrl(MOCK_URL)).networkErrorOnce();

      renderComponent(
        <FetchLicenseInformationButton url={MOCK_URL} disabled={false} />,
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.mouseOver(screen.getByRole('button'));
      jest.runAllTimers();

      expect(await screen.findByText('Network Error')).toBeInTheDocument();
    });

    it("shows fetching error tooltip 'Request failed with status code 404'", async () => {
      const MOCK_URL = 'https://github.com/opossum-tool/Oposs';
      const notFoundStatus = 404;

      axiosMock.onGet(getGithubAPIUrl(MOCK_URL)).replyOnce(notFoundStatus);

      renderComponent(
        <FetchLicenseInformationButton url={MOCK_URL} disabled={false} />,
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.mouseOver(screen.getByRole('button'));
      jest.runAllTimers();

      expect(
        await screen.findByText('Request failed with status code 404'),
      ).toBeInTheDocument();
    });

    it('shows fetch data tooltip after successful fetch', async () => {
      const MOCK_URL = 'https://pypi.org/project/pip';
      const okStatus = 200;

      axiosMock.onGet(getPypiAPIUrl(MOCK_URL)).replyOnce(okStatus, {
        info: {
          license: 'Apache-2.0',
          name: 'react',
        },
      });

      renderComponent(
        <FetchLicenseInformationButton url={MOCK_URL} disabled={false} />,
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.mouseOver(screen.getByRole('button'));
      jest.runAllTimers();

      expect(
        await screen.findByText(
          text.attributionColumn.packageSubPanel.fetchPackageInfo,
        ),
      ).toBeInTheDocument();
    });
  });
});

function mockConvertPayload(_: Response): PackageInfo {
  return { licenseName: 'testLicense' };
}

function mockConvertPayloadRaises(_: Response): PackageInfo {
  throw new Error('unexpected error');
}

const MOCK_URL = 'mock_url';

const GITHUB_URL = 'https://github.com/opossum-tool/OpossumUI';

describe('useFetchPackageInfo', () => {
  it('returns idle', () => {
    const { result } = renderHook(() =>
      useFetchPackageInfo({
        url: MOCK_URL,
        convertPayload: mockConvertPayload,
      }),
    );
    expect(result.current.fetchStatus).toBe(FetchStatus.Idle);
  });

  it('fetches data', async () => {
    const okStatus = 200;
    axiosMock.onGet(GITHUB_URL).replyOnce(okStatus, {
      license: { spdx_id: 'Apache-2.0' },
      content: 'TGljZW5zZSBUZXh0', // "License Text" in base64
      html_url: 'https://github.com/opossum-tool/OpossumUI/blob/main/LICENSE',
    });

    const licenseFetchingInformation = {
      url: GITHUB_URL,
      convertPayload: convertGithubPayload,
    };

    const { result, store } = renderHook(() =>
      useFetchPackageInfo(licenseFetchingInformation),
    );
    act(() => {
      result.current.fetchData();
    });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe(FetchStatus.Success);
    });
    expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject({
      licenseName: 'Apache-2.0',
    });
  });

  it('handles errors', async () => {
    const { result, store } = renderHook(() =>
      useFetchPackageInfo({
        url: MOCK_URL,
        convertPayload: mockConvertPayloadRaises,
      }),
    );
    act(() => {
      result.current.fetchData();
    });
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe(FetchStatus.Error);
    });
    expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject({});
  });
});
