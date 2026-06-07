import { PaymentReturnScreen } from "@/components/payments/payment-return-screen";

type PaymentReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PagoFailurePage({ searchParams }: PaymentReturnPageProps) {
  return <PaymentReturnScreen kind="failure" searchParams={await searchParams} />;
}
