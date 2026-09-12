import { billingState } from '@/client-config/states/billingState';
import { onboardingConfigState } from '@/client-config/states/onboardingConfigState';
import { OnboardingStepPageLoader } from '@/onboarding/components/OnboardingStepPageLoader';
import { ChooseYourPlanErrorState } from '@/onboarding/components/upgrade-free-trial/ChooseYourPlanErrorState';
import { usePlans } from '@/settings/billing/hooks/usePlans';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { Navigate } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { UpgradeFreeTrial } from '~/pages/onboarding/UpgradeFreeTrial';

export const ChooseYourPlan = () => {
  const billing = useAtomStateValue(billingState);
  const isBillingEnabled = billing?.isBillingEnabled ?? false;
  const { isPlansLoaded, error, refetch } = usePlans({
    skip: !isBillingEnabled,
  });
  const onboardingConfig = useAtomStateValue(onboardingConfigState);

  if (isDefined(billing) && !isBillingEnabled) {
    return <Navigate to={AppPath.Index} replace />;
  }

  if (isDefined(billing) && isPlansLoaded) {
    return (
      <UpgradeFreeTrial
        billing={billing}
        creditsReward={onboardingConfig?.upgradeCreditsReward}
      />
    );
  }

  if (isDefined(error)) {
    return <ChooseYourPlanErrorState onRetry={() => void refetch()} />;
  }

  return <OnboardingStepPageLoader />;
};
