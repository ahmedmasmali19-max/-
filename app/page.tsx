import Portal from './portal';
import DashboardPersonalizer from './dashboard-personalizer';
import ManagerRequestsPanel from './manager-requests-panel';
import ManagerBeneficiaryAccountsPanel from './manager-beneficiary-accounts-panel';
import SidebarRequestsLink from './sidebar-requests-link';
import Beneficiary360Links from './beneficiary-360-links';

export default function Home(){
  return <>
    <DashboardPersonalizer/>
    <SidebarRequestsLink/>
    <Beneficiary360Links/>
    <Portal/>
    <ManagerRequestsPanel/>
    <ManagerBeneficiaryAccountsPanel/>
  </>;
}
