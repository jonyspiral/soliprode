import { PaymentReturnScreen } from "@/components/payments/payment-return-screen";

type PaymentReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PagoSuccessPage({ searchParams }: PaymentReturnPageProps) {
  return <PaymentReturnScreen kind="success" searchParams={await searchParams} />;
}
