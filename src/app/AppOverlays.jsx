import React, { Suspense, lazy } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import LocalDataMigrationDialog from '../components/LocalDataMigrationDialog.jsx';
import OnboardingDialog from '../components/OnboardingDialog.jsx';
import Toast from '../components/Toast.jsx';

const ManualPlayDialog = lazy(() => import('../components/ManualPlayDialog.jsx'));

export default function AppOverlays({ manual, onboarding, clearConfirm, unsavedGenerationConfirm, migration, toast }) {
  return (
    <>
      <Suspense fallback={null}>
        <ManualPlayDialog {...manual}/>
      </Suspense>
      <OnboardingDialog {...onboarding}/>
      <ConfirmDialog {...clearConfirm}/>
      <ConfirmDialog {...unsavedGenerationConfirm}/>
      <LocalDataMigrationDialog {...migration}/>
      <Toast {...toast}/>
    </>
  );
}
