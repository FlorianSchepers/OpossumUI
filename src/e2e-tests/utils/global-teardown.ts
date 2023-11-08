// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { removeTempAssets } from './opossum-files';

async function globalTeardown(): Promise<void> {
  await removeTempAssets();
}

export default globalTeardown;
