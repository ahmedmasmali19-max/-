import Portal from './portal';
import DashboardPersonalizer from './dashboard-personalizer';
import ManagerRequestsPanel from './manager-requests-panel';
import ManagerBeneficiaryAccountsPanel from './manager-beneficiary-accounts-panel';

export default function Home(){
  return <>
    <DashboardPersonalizer/>
    <Portal/>
    <ManagerRequestsPanel/>
    <ManagerBeneficiaryAccountsPanel/>
  </>;
}
