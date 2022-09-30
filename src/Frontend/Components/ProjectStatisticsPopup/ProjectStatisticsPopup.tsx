// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText } from '../../enums/enums';
import {
  getExternalAttributions,
  getExternalAttributionSources,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  getUniqueLicenseNameToAttribution,
  sortAttributionPropertiesEntries,
} from './project-statistics-popup-helpers';
import { AttributionCountPerSourcePerLicenseTable } from './AttributionCountPerSourcePerLicenseTable';
import { AttributionPropertyCountTable } from './AttributionPropertyCountTable';
import { MostFrequentLicensesPieChart } from './PieCharts';
import { CriticalLicensesTable } from './CriticalLicensesTable';

const attributionCountPerSourcePerLicenseTableTitle = 'Signals per Sources';
const attributionPropertyCountTableTitle =
  'First Party and Follow Up Attributions';
const mostFrequentLicenseCountPerSourcePerLicenseTableTitle =
  'Most Frequent Licenses';
const criticalLicensesTableTitle = 'Critical Licenses';

export function ProjectStatisticsPopup(): ReactElement {
  const dispatch = useAppDispatch();

  const externalAttributions = useAppSelector(getExternalAttributions);
  const manualAttributionValues = Object.values(
    useAppSelector(getManualAttributions)
  );
  const attributionSources = useAppSelector(getExternalAttributionSources);
  const strippedLicenseNameToAttribution =
    getUniqueLicenseNameToAttribution(externalAttributions);

  const { attributionCountPerSourcePerLicense, licenseNamesWithCriticality } =
    aggregateLicensesAndSourcesFromAttributions(
      externalAttributions,
      strippedLicenseNameToAttribution,
      attributionSources
    );

  const manualAttributionPropertyCounts =
    aggregateAttributionPropertiesFromAttributions(manualAttributionValues);
  const sortedManualAttributionPropertyCountsEntries =
    sortAttributionPropertiesEntries(
      Object.entries(manualAttributionPropertyCounts)
    );

  function close(): void {
    dispatch(closePopup());
  }

  return (
    <NotificationPopup
      content={
        <>
          <MostFrequentLicensesPieChart
            attributionCountPerSourcePerLicense={
              attributionCountPerSourcePerLicense
            }
            title={mostFrequentLicenseCountPerSourcePerLicenseTableTitle}
          />
          <AttributionPropertyCountTable
            attributionPropertyCountsEntries={
              sortedManualAttributionPropertyCountsEntries
            }
            title={attributionPropertyCountTableTitle}
          />
          <CriticalLicensesTable
            attributionCountPerSourcePerLicense={
              attributionCountPerSourcePerLicense
            }
            licenseNamesWithCriticality={licenseNamesWithCriticality}
            title={criticalLicensesTableTitle}
          />
          <AttributionCountPerSourcePerLicenseTable
            attributionCountPerSourcePerLicense={
              attributionCountPerSourcePerLicense
            }
            licenseNamesWithCriticality={licenseNamesWithCriticality}
            title={attributionCountPerSourcePerLicenseTableTitle}
          />
        </>
      }
      header={'Project Statistics'}
      isOpen={true}
      fullWidth={true}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
