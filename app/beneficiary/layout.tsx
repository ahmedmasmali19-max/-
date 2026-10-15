import type {ReactNode} from 'react';
import BeneficiaryQuickTools from './quick-tools';
import BeneficiaryRequestJourney from './request-journey';
import SecureBeneficiaryFormsBridge from './secure-forms-bridge';

export default function BeneficiaryLayout({children}:{children:ReactNode}){
 return <>{children}<SecureBeneficiaryFormsBridge/><BeneficiaryRequestJourney/><BeneficiaryQuickTools/></>;
}
