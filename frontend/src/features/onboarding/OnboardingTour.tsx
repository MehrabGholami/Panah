import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingInvite } from './OnboardingInvite';
import { OnboardingOverlay } from './OnboardingOverlay';
import { OnboardingTooltip } from './OnboardingTooltip';
import { useOnboarding } from './useOnboarding';
import { queryTourTarget } from './onboardingUtils';
import { SkipConfirmDialog } from './SkipConfirmDialog';

export function OnboardingTour() {
  const { t } = useTranslation('common');
  const {
    isTourOpen,
    currentStep,
    currentIndex,
    steps,
    highlightRect,
    targetElement,
    skipDialogOpen,
    showInvite,
    guideAnchorEl,
    setGuideAnchorEl,
    startTour,
    nextStep,
    prevStep,
    requestSkip,
    cancelSkip,
    confirmSkip,
    finishTour,
    dismissInvite,
  } = useOnboarding();

  useEffect(() => {
    if (!showInvite) return;
    const sync = () => {
      const el = queryTourTarget('[data-tour="nav-guide"]');
      setGuideAnchorEl(el);
    };
    sync();
    const id = window.setInterval(sync, 600);
    return () => window.clearInterval(id);
  }, [showInvite, setGuideAnchorEl]);

  const total = steps.length;
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= total - 1;
  const isWelcome = currentStep?.id === 'welcome';
  const dimOnly = currentStep?.placement === 'center';

  return (
    <>
      <OnboardingInvite
        open={showInvite}
        anchorEl={guideAnchorEl}
        onStart={() => startTour()}
        onLater={dismissInvite}
      />

      {isTourOpen && currentStep && (
        <>
          <OnboardingOverlay
            rect={highlightRect}
            targetElement={targetElement}
            interactive={Boolean(currentStep.interactive)}
            dimOnly={dimOnly}
          />
          <OnboardingTooltip
            title={t(currentStep.titleKey)}
            description={t(currentStep.descriptionKey)}
            stepIndex={currentIndex}
            stepTotal={total}
            isFirst={isFirst}
            isLast={isLast}
            isWelcome={Boolean(isWelcome)}
            targetElement={targetElement}
            preferredPlacement={currentStep.placement ?? 'auto'}
            onNext={nextStep}
            onPrev={prevStep}
            onSkipRequest={requestSkip}
            onFinish={finishTour}
          />
        </>
      )}

      <SkipConfirmDialog
        open={skipDialogOpen}
        onContinue={cancelSkip}
        onConfirmSkip={confirmSkip}
      />
    </>
  );
}
