/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiFlexGroup, EuiFlexItem, EuiTitle } from '@elastic/eui';
import React from 'react';
import { i18n } from '@kbn/i18n';
import { RumOverview } from '../RumDashboard';
import { RumHeader } from './RumHeader';
import { UserPercentile } from './UserPercentile';
import { CsmSharedContextProvider } from './CsmSharedContext';

export const UX_LABEL = i18n.translate('xpack.apm.ux.title', {
  defaultMessage: 'User Experience',
});

export function RumHome() {
  return (
    <div>
      <CsmSharedContextProvider>
        <RumHeader>
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem grow={true}>
              <EuiTitle size="l">
                <h1>{UX_LABEL}</h1>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <UserPercentile />
            </EuiFlexItem>
          </EuiFlexGroup>
        </RumHeader>
        <RumOverview />
      </CsmSharedContextProvider>
    </div>
  );
}
