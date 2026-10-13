import type {ReactNode} from 'react';
import BeneficiaryDocumentUploader from '../beneficiary-document-uploader';
import BeneficiaryPaymentCenter from '../beneficiary-payment-center';

export default function BeneficiaryLayout({children}:{children:ReactNode}){
 return <>{children}<BeneficiaryPaymentCenter/><BeneficiaryDocumentUploader/></>;
}
