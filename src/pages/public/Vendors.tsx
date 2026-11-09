import { VENDORS } from '@/lib/data';
import { VendorExplorer } from '@/components/discovery';

export default function VendorsPage() {
  return (
    <VendorExplorer
      vendors={VENDORS}
      title="Verified local professionals"
      description="Compare 500+ background-checked businesses by rating, response time and price. Every vendor on Servora is KYC-verified and reviewed by real customers."
    />
  );
}
