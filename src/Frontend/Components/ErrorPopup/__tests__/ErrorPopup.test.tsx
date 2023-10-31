// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ErrorPopup } from '../ErrorPopup';

describe('Error popup ', () => {
  it('renders', () => {
    renderComponentWithStore(<ErrorPopup content="Invalid link." />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
