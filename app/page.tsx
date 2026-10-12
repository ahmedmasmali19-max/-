import Portal from './portal';
import DashboardPersonalizer from './dashboard-personalizer';
import ManagerRequestsPanel from './manager-requests-panel';

export default function Home(){
  return <>
    <DashboardPersonalizer/>
    <Portal/>
    <ManagerRequestsPanel/>
  </>;
}
