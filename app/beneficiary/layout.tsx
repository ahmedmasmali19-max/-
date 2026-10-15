import type {ReactNode} from 'react';
import BeneficiaryQuickTools from './quick-tools';
import BeneficiaryRequestJourney from './request-journey';

export default function BeneficiaryLayout({children}:{children:ReactNode}){
 return <>{children}<BeneficiaryRequestJourney/><BeneficiaryQuickTools/></>;
}
