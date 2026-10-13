import type {ReactNode} from 'react';
import BeneficiaryDocumentUploader from '../beneficiary-document-uploader';

export default function BeneficiaryLayout({children}:{children:ReactNode}){
 return <>{children}<BeneficiaryDocumentUploader/></>;
}
